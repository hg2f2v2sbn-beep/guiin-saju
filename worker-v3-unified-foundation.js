/**
 * 귀인사주 Worker v3.2 통합 기반
 * 실제 AI Worker(worker.js)를 아직 대체하지 않음.
 * 결제는 항상 OFF.
 */
const VERSION="3.2-unified-foundation";
const ALLOWED=new Set(["https://gwiinsaju.com","https://www.gwiinsaju.com","https://hg2f2v2sbn-beep.github.io"]);
function rid(){try{return crypto.randomUUID()}catch(_){return "r_"+Date.now()}}
function token(prefix){const b=new Uint8Array(32);crypto.getRandomValues(b);return prefix+[...b].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function hash(v){const x=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(v)));return [...new Uint8Array(x)].map(b=>b.toString(16).padStart(2,"0")).join("")}
function dbReady(env){return !!env?.DB&&typeof env.DB.prepare==="function"}
function origin(req){const o=req.headers.get("Origin")||"";return ALLOWED.has(o)?o:""}
function cors(o){return {"Access-Control-Allow-Origin":o||"https://gwiinsaju.com","Access-Control-Allow-Methods":"GET,POST,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Accept,Authorization,X-Guiin-Guest,X-Idempotency-Key","Access-Control-Max-Age":"86400","Vary":"Origin"}}
function json(data,status,o){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...cors(o)}})}
function txt(v,max=120){return String(v??"").trim().slice(0,max)}
function uuid(p){return p+"_"+crypto.randomUUID()}
async function userSession(env,req){
  const h=txt(req.headers.get("Authorization"),300),m=h.match(/^Bearer\s+(usr_[A-Za-z0-9._:-]{32,})$/i);
  if(!m)return null;
  const th=await hash(m[1]);
  const row=await env.DB.prepare(`SELECT s.id,s.user_id,s.expires_at,s.revoked_at,u.status FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? LIMIT 1`).bind(th).first();
  if(!row||row.revoked_at||row.status!=="active"||Date.parse(row.expires_at)<=Date.now())return null;
  await env.DB.prepare(`UPDATE user_sessions SET last_seen_at=? WHERE id=?`).bind(new Date().toISOString(),row.id).run();
  return row;
}
async function guestSession(env,req){
  const t=txt(req.headers.get("X-Guiin-Guest"),300);
  if(!/^gst_[A-Za-z0-9._:-]{32,}$/.test(t))return null;
  const th=await hash(t);
  const row=await env.DB.prepare(`SELECT id,expires_at,converted_user_id FROM guest_sessions WHERE token_hash=? LIMIT 1`).bind(th).first();
  if(!row||Date.parse(row.expires_at)<=Date.now())return null;
  await env.DB.prepare(`UPDATE guest_sessions SET last_seen_at=? WHERE id=?`).bind(new Date().toISOString(),row.id).run();
  return row;
}
async function subject(env,req){
  const u=await userSession(env,req);if(u)return {type:"user",id:u.user_id,sessionId:u.id};
  const g=await guestSession(env,req);if(g)return {type:"guest",id:g.id,convertedUserId:g.converted_user_id||null};
  return null;
}
function columns(s){return {userId:s.type==="user"?s.id:null,guestId:s.type==="guest"?s.id:null}}
async function createGuest(env){
  const id=uuid("guest"),raw=token("gst_"),th=await hash(raw),now=new Date(),exp=new Date(now.getTime()+180*86400000);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)`).bind(id,th,now.toISOString(),now.toISOString(),exp.toISOString()),
    env.DB.prepare(`INSERT INTO usage_quotas(id,subject_type,subject_id,quota_key,period_key,used_count,reserved_count,limit_count,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(uuid("quota"),"guest",id,"ai_chat_free","lifetime",0,0,3,now.toISOString()),
    env.DB.prepare(`INSERT INTO wallet_accounts(subject_type,subject_id,balance,version,updated_at) VALUES(?,?,?,?,?)`).bind("guest",id,0,0,now.toISOString())
  ]);
  return {guestId:id,guestToken:raw,expiresAt:exp.toISOString()};
}
async function usage(env,s){
  const q=await env.DB.prepare(`SELECT used_count,reserved_count,limit_count FROM usage_quotas WHERE subject_type=? AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime' LIMIT 1`).bind(s.type,s.id).first();
  const w=await env.DB.prepare(`SELECT balance FROM wallet_accounts WHERE subject_type=? AND subject_id=? LIMIT 1`).bind(s.type,s.id).first();
  const used=Number(q?.used_count||0),reserved=Number(q?.reserved_count||0),limit=Number(q?.limit_count??3);
  return {free:{used,reserved,limit,remaining:Math.max(0,limit-used-reserved)},wallet:{balance:Number(w?.balance||0)}};
}
async function convertGuestToUser(env,g,u,idempotencyKey){
  if(g.converted_user_id&&g.converted_user_id!==u.user_id)throw new Error("guest_already_converted");
  const now=new Date().toISOString();
  const existing=await env.DB.prepare(`SELECT id,state FROM guest_conversions WHERE guest_session_id=? LIMIT 1`).bind(g.id).first();
  if(existing?.state==="COMPLETED")return {replayed:true};

  const uw=await env.DB.prepare(`SELECT balance FROM wallet_accounts WHERE subject_type='user' AND subject_id=?`).bind(u.user_id).first();
  const gw=await env.DB.prepare(`SELECT balance FROM wallet_accounts WHERE subject_type='guest' AND subject_id=?`).bind(g.id).first();
  const mergedWallet=Number(uw?.balance||0)+Number(gw?.balance||0);

  const uq=await env.DB.prepare(`SELECT used_count,limit_count FROM usage_quotas WHERE subject_type='user' AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime'`).bind(u.user_id).first();
  const gq=await env.DB.prepare(`SELECT used_count,limit_count FROM usage_quotas WHERE subject_type='guest' AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime'`).bind(g.id).first();
  const limit=Math.max(Number(uq?.limit_count||3),Number(gq?.limit_count||3));
  const used=Math.min(limit,Number(uq?.used_count||0)+Number(gq?.used_count||0));
  const convId=existing?.id||uuid("gconv");

  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO guest_conversions(id,guest_session_id,user_id,state,started_at,idempotency_key) VALUES(?,?,?,?,?,?)`).bind(convId,g.id,u.user_id,"PROCESSING",now,idempotencyKey),
    env.DB.prepare(`UPDATE profiles SET user_id=?,guest_session_id=NULL,updated_at=? WHERE guest_session_id=?`).bind(u.user_id,now,g.id),
    env.DB.prepare(`UPDATE chart_snapshots SET user_id=?,guest_session_id=NULL WHERE guest_session_id=?`).bind(u.user_id,g.id),
    env.DB.prepare(`UPDATE conversations SET user_id=?,guest_session_id=NULL,updated_at=? WHERE guest_session_id=?`).bind(u.user_id,now,g.id),
    env.DB.prepare(`UPDATE reports SET user_id=?,guest_session_id=NULL,updated_at=? WHERE guest_session_id=?`).bind(u.user_id,now,g.id),
    env.DB.prepare(`UPDATE entitlements SET user_id=?,guest_session_id=NULL WHERE guest_session_id=?`).bind(u.user_id,g.id),
    env.DB.prepare(`INSERT INTO wallet_accounts(subject_type,subject_id,balance,version,updated_at) VALUES('user',?,?,0,?) ON CONFLICT(subject_type,subject_id) DO UPDATE SET balance=excluded.balance,version=wallet_accounts.version+1,updated_at=excluded.updated_at`).bind(u.user_id,mergedWallet,now),
    env.DB.prepare(`INSERT INTO usage_quotas(id,subject_type,subject_id,quota_key,period_key,used_count,reserved_count,limit_count,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(subject_type,subject_id,quota_key,period_key) DO UPDATE SET used_count=excluded.used_count,reserved_count=0,limit_count=excluded.limit_count,updated_at=excluded.updated_at`).bind(uuid("quota"),"user",u.user_id,"ai_chat_free","lifetime",used,0,limit,now),
    env.DB.prepare(`UPDATE guest_sessions SET converted_user_id=? WHERE id=?`).bind(u.user_id,g.id),
    env.DB.prepare(`UPDATE guest_conversions SET state='COMPLETED',completed_at=? WHERE guest_session_id=?`).bind(now,g.id),
    env.DB.prepare(`INSERT INTO audit_logs(id,actor_type,actor_id,action,target_type,target_id,request_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(uuid("audit"),"user",u.user_id,"guest.convert","guest_session",g.id,null,JSON.stringify({mergedWallet,used,limit}),now)
  ]);
  return {replayed:false,mergedWallet,freeUsed:used,freeLimit:limit};
}
export default{
  async fetch(req,env){
    const requestId=rid(),url=new URL(req.url),rawOrigin=req.headers.get("Origin")||"",o=origin(req);
    if(rawOrigin&&!o)return json({ok:false,error:"origin_not_allowed",requestId},403,"https://gwiinsaju.com");
    if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(o)});
    if(req.method==="GET"&&url.pathname==="/health")return json({ok:true,version:VERSION,databaseReady:dbReady(env),paymentsEnabled:false},200,o);
    if(!dbReady(env))return json({ok:false,error:"server_runtime_unavailable",requestId},503,o);
    if(req.method==="POST"&&url.pathname==="/api/session/guest"){
      try{return json({ok:true,requestId,...await createGuest(env)},201,o)}catch(e){return json({ok:false,error:"guest_create_failed",requestId},500,o)}
    }

    const s=await subject(env,req);
    if(!s)return json({ok:false,error:"session_required",requestId},401,o);

    if(req.method==="GET"&&url.pathname==="/api/auth/status")return json({ok:true,requestId,subject:{type:s.type,id:s.id}},200,o);
    if(req.method==="GET"&&url.pathname==="/api/me/usage")return json({ok:true,requestId,subject:{type:s.type,id:s.id},usage:await usage(env,s)},200,o);

    if(req.method==="GET"&&url.pathname==="/api/me/entitlements"){
      const col=s.type==="user"?"user_id":"guest_session_id";
      const rows=await env.DB.prepare(`SELECT entitlement_type,resource_key,state,granted_at FROM entitlements WHERE ${col}=? AND state='ACTIVE' ORDER BY granted_at DESC`).bind(s.id).all();
      return json({ok:true,requestId,entitlements:rows?.results||[]},200,o);
    }

    if(req.method==="POST"&&url.pathname==="/api/auth/convert-guest"){
      const u=await userSession(env,req),g=await guestSession(env,req);
      if(!u||!g)return json({ok:false,error:"user_and_guest_session_required",requestId},401,o);
      const idem=txt(req.headers.get("X-Idempotency-Key"),200);
      if(idem.length<12)return json({ok:false,error:"idempotency_key_required",requestId},400,o);
      try{return json({ok:true,requestId,...await convertGuestToUser(env,g,u,idem)},200,o)}
      catch(e){return json({ok:false,error:e.message||"guest_conversion_failed",requestId},409,o)}
    }

    const c=columns(s);

    if(req.method==="GET"&&url.pathname==="/api/profiles"){
      const col=s.type==="user"?"user_id":"guest_session_id";
      const rows=await env.DB.prepare(`SELECT * FROM profiles WHERE ${col}=? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 20`).bind(s.id).all();
      return json({ok:true,requestId,profiles:rows?.results||[]},200,o);
    }

    if(req.method==="POST"&&url.pathname==="/api/profiles"){
      let b;try{b=await req.json()}catch(_){return json({ok:false,error:"invalid_json",requestId},400,o)}
      const id=uuid("profile"),now=new Date().toISOString(),hu=!!b.hour_unknown;
      const yy=Number(b.birth_year),mm=Number(b.birth_month),dd=Number(b.birth_day);
      if(!Number.isInteger(yy)||!Number.isInteger(mm)||!Number.isInteger(dd))return json({ok:false,error:"invalid_birth_date",requestId},400,o);
      await env.DB.prepare(`INSERT INTO profiles(id,user_id,guest_session_id,label,display_name,calendar,lunar_leap_month,birth_year,birth_month,birth_day,birth_hour,birth_minute,hour_unknown,gender,timezone,day_boundary,true_solar_time,longitude,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id,c.userId,c.guestId,txt(b.label,40)||null,txt(b.display_name||b.name,40)||null,b.calendar==="음력"?"음력":"양력",b.lunar_leap_month?1:0,yy,mm,dd,hu?null:Number(b.birth_hour),hu?null:Number(b.birth_minute||0),hu?1:0,txt(b.gender,12)||null,txt(b.timezone,64)||"Asia/Seoul",txt(b.day_boundary,8)||"23",b.true_solar_time?1:0,b.true_solar_time?Number(b.longitude):null,now,now).run();
      return json({ok:true,requestId,profileId:id},201,o);
    }

    if(req.method==="GET"&&url.pathname==="/api/conversations"){
      const col=s.type==="user"?"user_id":"guest_session_id";
      const rows=await env.DB.prepare(`SELECT id,title,created_at,updated_at FROM conversations WHERE ${col}=? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 50`).bind(s.id).all();
      return json({ok:true,requestId,conversations:rows?.results||[]},200,o);
    }

    if(req.method==="POST"&&url.pathname==="/api/conversations"){
      let b;try{b=await req.json()}catch(_){return json({ok:false,error:"invalid_json",requestId},400,o)}
      const id=uuid("conv"),now=new Date().toISOString();
      await env.DB.prepare(`INSERT INTO conversations(id,user_id,guest_session_id,chart_snapshot_id,title,created_at,updated_at) VALUES(?,?,?,?,?,?,?)`)
        .bind(id,c.userId,c.guestId,b.chart_snapshot_id||null,txt(b.title,80)||"사주 상담",now,now).run();
      return json({ok:true,requestId,conversationId:id},201,o);
    }

    const m=url.pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
    if(m){
      const col=s.type==="user"?"user_id":"guest_session_id";
      const own=await env.DB.prepare(`SELECT id FROM conversations WHERE id=? AND ${col}=? AND deleted_at IS NULL`).bind(m[1],s.id).first();
      if(!own)return json({ok:false,error:"not_found",requestId},404,o);

      if(req.method==="GET"){
        const rows=await env.DB.prepare(`SELECT id,role,content,request_id,created_at FROM messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 200`).bind(m[1]).all();
        return json({ok:true,requestId,messages:rows?.results||[]},200,o);
      }

      if(req.method==="POST"){
        let b;try{b=await req.json()}catch(_){return json({ok:false,error:"invalid_json",requestId},400,o)}
        const role=["user","assistant"].includes(b.role)?b.role:null,content=txt(b.content,12000);
        if(!role||!content)return json({ok:false,error:"invalid_message",requestId},400,o);
        const id=uuid("msg"),now=new Date().toISOString();
        await env.DB.prepare(`INSERT OR IGNORE INTO messages(id,conversation_id,role,content,request_id,created_at) VALUES(?,?,?,?,?,?)`)
          .bind(id,m[1],role,content,txt(b.request_id,200)||null,now).run();
        await env.DB.prepare(`UPDATE conversations SET updated_at=? WHERE id=?`).bind(now,m[1]).run();
        return json({ok:true,requestId,messageId:id},201,o);
      }
    }

    return json({ok:false,error:"not_found",requestId},404,o);
  }
};
