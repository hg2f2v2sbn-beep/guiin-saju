/**
 * 귀인사주 Worker v3 준비본
 * 목적: 기존 AI Worker 앞에 서버 권한형 guest/session/usage 기반을 추가한다.
 *
 * 현재 단계:
 * - /api/session/guest
 * - /api/me/usage
 * - D1이 없으면 안전하게 server_runtime_unavailable 반환
 * - 결제/차감은 아직 켜지지 않음
 *
 * 실제 배포 전 Cloudflare bindings:
 * DB = D1 database
 * SESSION_SECRET = secret
 */
const ALLOWED_ORIGINS = new Set([
  "https://gwiinsaju.com",
  "https://www.gwiinsaju.com",
  "https://hg2f2v2sbn-beep.github.io"
]);

const VERSION = "3.0-server-foundation";

function rid() {
  try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch (_) {}
  return "req_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

function originOf(req) {
  const o = req.headers.get("Origin") || "";
  return ALLOWED_ORIGINS.has(o) ? o : "";
}

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "https://gwiinsaju.com",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept,X-Guiin-Guest,X-Idempotency-Key,Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type":"application/json; charset=UTF-8",
      "Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff",
      ...cors(origin)
    }
  });
}

function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}

async function sha256(s) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s))));
}

function randomToken(prefix = "gst_") {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2,"0");
  return prefix + s;
}

function dbReady(env) {
  return !!env?.DB && typeof env.DB.prepare === "function";
}

async function createGuest(env) {
  const id = "guest_" + crypto.randomUUID();
  const token = randomToken("gst_");
  const hash = await sha256(token);
  const now = new Date();
  const expires = new Date(now.getTime() + 180 * 86400000);

  await env.DB.prepare(`
    INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at)
    VALUES(?,?,?,?,?)
  `).bind(id,hash,now.toISOString(),now.toISOString(),expires.toISOString()).run();

  await env.DB.prepare(`
    INSERT OR IGNORE INTO usage_quotas
      (id,subject_type,subject_id,quota_key,period_key,used_count,reserved_count,limit_count,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?)
  `).bind(
    "quota_" + crypto.randomUUID(),
    "guest", id, "ai_chat_free", "lifetime",
    0, 0, 3, now.toISOString()
  ).run();

  return {guestId:id, guestToken:token, expiresAt:expires.toISOString()};
}

async function resolveGuest(env, req) {
  const token = (req.headers.get("X-Guiin-Guest") || "").trim();
  if (!token || !token.startsWith("gst_")) return null;
  const hash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT id, expires_at, converted_user_id
    FROM guest_sessions
    WHERE token_hash = ?
    LIMIT 1
  `).bind(hash).first();

  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;

  await env.DB.prepare(`
    UPDATE guest_sessions SET last_seen_at = ? WHERE id = ?
  `).bind(new Date().toISOString(), row.id).run();

  return {
    guestSessionId: row.id,
    convertedUserId: row.converted_user_id || null
  };
}

async function usageFor(env, subjectType, subjectId) {
  const q = await env.DB.prepare(`
    SELECT used_count,reserved_count,limit_count
    FROM usage_quotas
    WHERE subject_type=? AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime'
    LIMIT 1
  `).bind(subjectType,subjectId).first();

  const w = await env.DB.prepare(`
    SELECT balance FROM wallet_accounts
    WHERE subject_type=? AND subject_id=?
    LIMIT 1
  `).bind(subjectType,subjectId).first();

  const used = Number(q?.used_count || 0);
  const reserved = Number(q?.reserved_count || 0);
  const limit = Number(q?.limit_count ?? 3);
  const effectiveUsed = Math.min(limit, used + reserved);

  return {
    free: {
      used,
      reserved,
      limit,
      remaining: Math.max(0, limit - effectiveUsed)
    },
    wallet: {
      balance: Number(w?.balance || 0)
    }
  };
}

export default {
  async fetch(request, env) {
    const requestId = rid();
    const url = new URL(request.url);
    const rawOrigin = request.headers.get("Origin") || "";
    const allowed = originOf(request);

    if (rawOrigin && !allowed) {
      return json({ok:false,error:"origin_not_allowed",requestId},403,"https://gwiinsaju.com");
    }
    const origin = allowed || "https://gwiinsaju.com";

    if (request.method === "OPTIONS") {
      return new Response(null,{status:204,headers:cors(origin)});
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok:true,
        service:"guiin-saju-api",
        version:VERSION,
        databaseReady:dbReady(env),
        paymentsEnabled:false
      },200,origin);
    }

    if (request.method === "POST" && url.pathname === "/api/session/guest") {
      if (!dbReady(env)) {
        return json({ok:false,error:"server_runtime_unavailable",requestId},503,origin);
      }
      try {
        const result = await createGuest(env);
        return json({ok:true,requestId,...result},201,origin);
      } catch (e) {
        console.error("guest_create_failed",{requestId,message:e?.message||String(e)});
        return json({ok:false,error:"guest_create_failed",requestId},500,origin);
      }
    }

    if (request.method === "GET" && url.pathname === "/api/me/usage") {
      if (!dbReady(env)) {
        return json({ok:false,error:"server_runtime_unavailable",requestId},503,origin);
      }
      const guest = await resolveGuest(env,request);
      if (!guest) return json({ok:false,error:"guest_session_required",requestId},401,origin);

      const usage = await usageFor(env,"guest",guest.guestSessionId);
      return json({ok:true,requestId,subject:{type:"guest",id:guest.guestSessionId},usage},200,origin);
    }

    return json({ok:false,error:"not_found",requestId},404,origin);
  }
};
