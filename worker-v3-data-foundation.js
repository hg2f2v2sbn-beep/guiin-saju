/**
 * 귀인사주 Worker v3 DATA foundation
 * profile/chart/conversation 저장 API의 안전한 뼈대.
 * 기존 실제 AI Worker를 대체하지 않습니다.
 *
 * 예상 D1 binding: DB
 * 현재 결제는 항상 OFF.
 */
const VERSION="3.1-data-foundation";

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}
  });
}
function dbReady(env){return !!env?.DB && typeof env.DB.prepare==="function";}
function uid(prefix){return prefix+"_"+crypto.randomUUID();}
function text(v,max=120){return String(v??"").trim().slice(0,max);}

async function sha256(s){
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(s)));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

async function guestFromRequest(env,request){
  const token=text(request.headers.get("X-Guiin-Guest"),256);
  if(!token.startsWith("gst_"))return null;
  const hash=await sha256(token);
  const row=await env.DB.prepare(`
    SELECT id,expires_at,converted_user_id FROM guest_sessions
    WHERE token_hash=? LIMIT 1
  `).bind(hash).first();
  if(!row || Date.parse(row.expires_at)<=Date.now())return null;
  return {type:"guest",id:row.id,convertedUserId:row.converted_user_id||null};
}

async function bodyJson(request){
  try{return await request.json();}catch(_){throw new Error("invalid_json");}
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);

    if(request.method==="GET"&&url.pathname==="/health"){
      return json({ok:true,version:VERSION,databaseReady:dbReady(env),paymentsEnabled:false});
    }
    if(!dbReady(env))return json({ok:false,error:"server_runtime_unavailable"},503);

    const subject=await guestFromRequest(env,request);
    if(!subject)return json({ok:false,error:"guest_session_required"},401);

    if(request.method==="POST"&&url.pathname==="/api/profiles"){
      try{
        const b=await bodyJson(request);
        const id=uid("profile"),now=new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO profiles(
            id,user_id,label,display_name,calendar,lunar_leap_month,
            birth_year,birth_month,birth_day,birth_hour,birth_minute,hour_unknown,
            gender,timezone,day_boundary,true_solar_time,longitude,created_at,updated_at
          ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
          id,null,text(b.label,40)||null,text(b.display_name||b.name,40)||null,
          b.calendar==="음력"?"음력":"양력",b.lunar_leap_month?1:0,
          Number(b.birth_year),Number(b.birth_month),Number(b.birth_day),
          b.hour_unknown?null:Number(b.birth_hour),b.hour_unknown?null:Number(b.birth_minute||0),
          b.hour_unknown?1:0,text(b.gender,12)||null,text(b.timezone,64)||"Asia/Seoul",
          text(b.day_boundary,8)||"23",b.true_solar_time?1:0,
          b.true_solar_time?Number(b.longitude):null,now,now
        ).run();

        // 현 스키마의 profiles는 user_id NOT NULL인 구버전 배포가 있을 수 있어
        // 실제 D1 적용 전 migration에서 guest_session_id 컬럼 추가가 필요함.
        return json({ok:true,profileId:id,note:"requires_guest_profile_migration"},201);
      }catch(e){
        return json({ok:false,error:e?.message==="invalid_json"?"invalid_json":"profile_save_failed"},400);
      }
    }

    if(request.method==="GET"&&url.pathname==="/api/conversations"){
      const rows=await env.DB.prepare(`
        SELECT id,title,created_at,updated_at
        FROM conversations
        WHERE guest_session_id=? AND deleted_at IS NULL
        ORDER BY updated_at DESC LIMIT 50
      `).bind(subject.id).all();
      return json({ok:true,conversations:rows?.results||[]});
    }

    if(request.method==="POST"&&url.pathname==="/api/conversations"){
      const b=await bodyJson(request);
      const id=uid("conv"),now=new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO conversations(
          id,user_id,guest_session_id,chart_snapshot_id,title,created_at,updated_at
        ) VALUES(?,?,?,?,?,?,?)
      `).bind(id,null,subject.id,b.chart_snapshot_id||null,text(b.title,80)||"사주 상담",now,now).run();
      return json({ok:true,conversationId:id},201);
    }

    const m=url.pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
    if(m&&request.method==="GET"){
      const convId=m[1];
      const own=await env.DB.prepare(`
        SELECT id FROM conversations WHERE id=? AND guest_session_id=? AND deleted_at IS NULL
      `).bind(convId,subject.id).first();
      if(!own)return json({ok:false,error:"not_found"},404);
      const rows=await env.DB.prepare(`
        SELECT id,role,content,request_id,created_at
        FROM messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 200
      `).bind(convId).all();
      return json({ok:true,messages:rows?.results||[]});
    }

    if(m&&request.method==="POST"){
      const convId=m[1],b=await bodyJson(request);
      const own=await env.DB.prepare(`
        SELECT id FROM conversations WHERE id=? AND guest_session_id=? AND deleted_at IS NULL
      `).bind(convId,subject.id).first();
      if(!own)return json({ok:false,error:"not_found"},404);
      const role=["user","assistant"].includes(b.role)?b.role:null;
      const content=text(b.content,12000);
      if(!role||!content)return json({ok:false,error:"invalid_message"},400);

      const id=uid("msg"),now=new Date().toISOString();
      await env.DB.prepare(`
        INSERT OR IGNORE INTO messages(id,conversation_id,role,content,request_id,created_at)
        VALUES(?,?,?,?,?,?)
      `).bind(id,convId,role,content,text(b.request_id,200)||null,now).run();
      await env.DB.prepare(`UPDATE conversations SET updated_at=? WHERE id=?`)
        .bind(now,convId).run();
      return json({ok:true,messageId:id},201);
    }

    return json({ok:false,error:"not_found"},404);
  }
};
