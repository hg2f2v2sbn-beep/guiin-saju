/**
 * 귀인사주 Worker v4.0 integrated preview
 * 기존 AI 상담 + 서버 데이터 API 통합 후보.
 * DB 없이도 /api/chat 유지. 결제/서버 최종차감은 아직 OFF.
 */
const ALLOWED_ORIGINS=new Set([
  "https://gwiinsaju.com",
  "https://www.gwiinsaju.com",
  "https://hg2f2v2sbn-beep.github.io"
]);
const WORKER_VERSION="5.5-pg-test-preview";
const ANSWER_SCHEMA_VERSION="2.2.0";

const SYSTEM_PROMPT=`
당신은 '귀인사주'의 AI 사주 상담가입니다.
- chart_facts와 person_model은 이미 계산된 근거입니다.
- 명식을 다시 계산하거나 없는 십성·신살·합충형파해·대운·세운·월운·일운을 만들지 마세요.
- element_distribution은 분포이지 실제 강약·용신 자체가 아닙니다.
- 출생시간 미상은 시주를 추정하지 마세요.
- 사용자가 말하지 않은 과거 사건·직업·가족사·연애사를 지어내지 마세요.
- 미래는 확정 사건이 아니라 경향·가능성·활용법으로 설명하세요.
- 의료·법률·투자 판단을 사주로 대신하지 마세요.
- 질문에 직접 관련된 근거 2~4개를 연결하세요.
- 같은 조언을 반복하지 마세요.
- 실제 이름이 있으면 필요한 지점에서만 이름+님으로 부르세요.
- 사용자님·고객님·내담자님·회원님·당신 같은 호칭은 피하세요.
- ###, **, __ 같은 마크다운 장식은 사용하지 마세요.
`;

function requestId(){try{return crypto.randomUUID()}catch(_){return "req_"+Date.now().toString(36)}}
function uid(p){try{return p+"_"+crypto.randomUUID()}catch(_){return p+"_"+Date.now().toString(36)}}
function safeClientRequestId(v){const s=typeof v==="string"?v.trim():"";return /^[A-Za-z0-9._:-]{12,180}$/.test(s)?s:null}
function pickOrigin(r){const o=r.headers.get("Origin")||"";return ALLOWED_ORIGINS.has(o)?o:""}
function corsHeaders(o){return {
  "Access-Control-Allow-Methods":"GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type, Accept, Authorization, X-Guiin-Guest, X-Idempotency-Key",
  "Access-Control-Max-Age":"86400",
  "Access-Control-Allow-Origin":o||"https://gwiinsaju.com",
  "Vary":"Origin"
}}
function securityHeaders(){return{
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "Referrer-Policy":"no-referrer",
  "Permissions-Policy":"camera=(), microphone=(), geolocation=(), payment=()",
  "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  "Strict-Transport-Security":"max-age=31536000; includeSubDomains"
}}
function json(data,status,o,extra={}){return new Response(JSON.stringify(data),{status,headers:{
  "Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store",...securityHeaders(),...corsHeaders(o),...extra
}})}
function plain(v){if(v==null)return v;try{return JSON.parse(JSON.stringify(v))}catch(_){return null}}
function text(v,max=120){return typeof v==="string"?v.trim().slice(0,max):""}
function dbReady(env){return !!env?.DB&&typeof env.DB.prepare==="function"}
async function sha256(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(s)));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function randomToken(prefix){const b=new Uint8Array(32);crypto.getRandomValues(b);return prefix+[...b].map(x=>x.toString(16).padStart(2,"0")).join("")}

async function userSession(env,req){
  if(!dbReady(env))return null;
  const h=(req.headers.get("Authorization")||"").trim(),m=h.match(/^Bearer\s+(usr_[A-Za-z0-9._:-]{32,})$/i);
  if(!m)return null;
  const row=await env.DB.prepare(`SELECT s.id,s.user_id,s.expires_at,s.absolute_expires_at,s.last_seen_at,s.idle_timeout_seconds,s.revoked_at,s.token_version,u.status FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? LIMIT 1`).bind(await sha256(m[1])).first();
  if(!row||row.revoked_at||row.status!=="active")return null;const now=Date.now(),exp=Date.parse(row.expires_at),abs=Date.parse(row.absolute_expires_at||""),last=Date.parse(row.last_seen_at||""),idle=Number(row.idle_timeout_seconds||0);if(!Number.isFinite(exp)||exp<=now)return null;if(Number.isFinite(abs)&&abs<=now)return null;if(Number.isFinite(last)&&idle>0&&last+idle*1000<=now)return null;return row;
}
async function guestSession(env,req){
  if(!dbReady(env))return null;
  const t=(req.headers.get("X-Guiin-Guest")||"").trim();
  if(!/^gst_[A-Za-z0-9._:-]{32,}$/.test(t))return null;
  const row=await env.DB.prepare(`SELECT id,expires_at,absolute_expires_at,last_seen_at,idle_timeout_seconds,revoked_at,converted_user_id,token_version FROM guest_sessions WHERE token_hash=? LIMIT 1`).bind(await sha256(t)).first();
  if(!row||row.revoked_at)return null;const now=Date.now(),exp=Date.parse(row.expires_at),abs=Date.parse(row.absolute_expires_at||""),last=Date.parse(row.last_seen_at||""),idle=Number(row.idle_timeout_seconds||0);if(!Number.isFinite(exp)||exp<=now)return null;if(Number.isFinite(abs)&&abs<=now)return null;if(Number.isFinite(last)&&idle>0&&last+idle*1000<=now)return null;return row;
}
async function resolveSubject(env,req){
  const u=await userSession(env,req);if(u)return {type:"user",id:u.user_id,sessionId:u.id};
  const g=await guestSession(env,req);if(g)return {type:"guest",id:g.id,convertedUserId:g.converted_user_id||null};
  return null;
}
async function createGuest(env){
  const id=uid("guest"),raw=randomToken("gst_"),now=new Date(),exp=new Date(now.getTime()+180*86400000);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)`).bind(id,await sha256(raw),now.toISOString(),now.toISOString(),exp.toISOString()),
    env.DB.prepare(`INSERT OR IGNORE INTO usage_quotas(id,subject_type,subject_id,quota_key,period_key,used_count,reserved_count,limit_count,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(uid("quota"),"guest",id,"ai_chat_free","lifetime",0,0,3,now.toISOString()),
    env.DB.prepare(`INSERT OR IGNORE INTO wallet_accounts(subject_type,subject_id,balance,reserved_balance,version,updated_at) VALUES(?,?,?,?,?,?)`).bind("guest",id,0,0,0,now.toISOString())
  ]);
  return {guestId:id,guestToken:raw,expiresAt:exp.toISOString()};
}
async function usageFor(env,s){
  const q=await env.DB.prepare(`SELECT used_count,reserved_count,limit_count FROM usage_quotas WHERE subject_type=? AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime' LIMIT 1`).bind(s.type,s.id).first();
  const w=await env.DB.prepare(`SELECT balance,reserved_balance FROM wallet_accounts WHERE subject_type=? AND subject_id=? LIMIT 1`).bind(s.type,s.id).first();
  const used=Number(q?.used_count||0),reserved=Number(q?.reserved_count||0),limit=Number(q?.limit_count??3);
  return {free:{used,reserved,limit,remaining:Math.max(0,limit-used-reserved)},wallet:{balance:Number(w?.balance||0),reserved:Number(w?.reserved_balance||0),available:Math.max(0,Number(w?.balance||0)-Number(w?.reserved_balance||0))}};
}

function hasLegacyPillars(c){return c&&["year","month","day"].every(k=>typeof c[k]==="string"&&c[k].trim())}
function hasV2Pillars(c){return c?.pillars&&["year","month","day"].every(k=>typeof c.pillars[k]==="string"&&c.pillars[k].trim())}
function validChart(c){return !!c&&typeof c==="object"&&(hasLegacyPillars(c)||hasV2Pillars(c))}
function normalizeChart(c,name){
  if(!validChart(c))return null;
  if(hasV2Pillars(c))return {
    schema_version:text(c.schema_version,30)||"2.0.0",name:text(name||c.name,40)||null,
    pillars:{year:text(c.pillars.year,12),month:text(c.pillars.month,12),day:text(c.pillars.day,12),hour:text(c.pillars.hour,20)||null},
    day_master:plain(c.day_master),ten_gods:plain(c.ten_gods),hidden_stems:plain(c.hidden_stems),
    element_distribution:plain(c.element_distribution),element_strength:c.element_strength==null?null:plain(c.element_strength),
    relations:plain(c.relations),stars:plain(c.stars),daeun:plain(c.daeun),
    current_daeun:plain(c.current_daeun),current_seun:plain(c.current_seun),current_wolun:plain(c.current_wolun),current_ilun:plain(c.current_ilun),
    flow:plain(c.flow),precision:plain(c.precision),uncertainty:plain(c.uncertainty),person_model:plain(c.person_model)
  };
  return {
    schema_version:"2.0.0-legacy-bridge",name:text(name||c.name||c.userName,40)||null,
    pillars:{year:text(c.year,12),month:text(c.month,12),day:text(c.day,12),hour:c.hourUnknown?null:(text(c.hour,20)||null)},
    day_master:{stem:text(c.dayMaster,8)||null},ten_gods:plain(c.tenGods),hidden_stems:plain(c.hiddenStems),
    element_distribution:plain(c.elements),element_strength:null,relations:plain(c.relations),stars:plain(c.stars),
    current_daeun:plain(c.currentLuck),current_seun:plain(c.yearFlow),current_wolun:null,current_ilun:null,
    flow:null,precision:null,person_model:plain(c.person_model),
    uncertainty:{hour_pillar:c.hourUnknown?"unavailable":"available",birth_time_unknown:!!c.hourUnknown,daeun_transition:c.hourUnknown?"range":"calculated"}
  };
}
function cleanHistory(h){if(!Array.isArray(h))return [];return h.filter(x=>x&&(x.role==="user"||x.role==="assistant")&&typeof x.content==="string").slice(-10).map(x=>({role:x.role,content:x.content.trim().slice(0,1800)})).filter(x=>x.content)}
function extractQuestion(m){const raw=typeof m==="string"?m.trim():"";if(!raw)return "";const marker="\n질문:",p=raw.lastIndexOf(marker);return (p>=0?raw.slice(p+marker.length).trim():raw).slice(0,1800)}
function koreaDate(now=new Date()){try{return new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",year:"numeric",month:"long",day:"numeric"}).format(now)}catch(_){return now.toISOString().slice(0,10)}}
function chartContext(facts){return `[귀인사주 chart_facts]\n${JSON.stringify(facts).slice(0,18000)}\n\n없는 필드는 추정하지 말고 uncertainty가 있으면 확신도를 낮추세요.`}
function qualityIssues(a){
  const s=String(a||""),issues=[];
  if(!s.trim())issues.push("empty");
  if(s.trim().length<80)issues.push("too_short");
  if(/^#{1,6}\s/m.test(s)||/\*\*[^*]+\*\*/.test(s)||/__[^_]+__/.test(s))issues.push("markdown");
  if(/사용자님|고객님|내담자님|회원님/.test(s))issues.push("generic_honorific");
  if(/무조건\s*(이혼|파산|사고|수술|죽|망)/.test(s)||/(반드시|확실히)\s*(이혼|파산|사고|수술|실패|합격|결혼)/.test(s))issues.push("deterministic_fear");
  return [...new Set(issues)];
}
async function callOpenAI(env,messages,maxTokens,id){
  const model=(env.CHAT_MODEL||"gpt-4o-mini").trim();
  const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":`Bearer ${env.OPENAI_API_KEY}`,"Content-Type":"application/json","X-Request-ID":id},body:JSON.stringify({model,messages,max_tokens:maxTokens,temperature:0.7})});
  let d=null;try{d=await r.json()}catch(_){}
  if(!r.ok){const e=new Error("ai_request_failed");e.status=r.status;throw e}
  const answer=d?.choices?.[0]?.message?.content?.trim();if(!answer)throw new Error("empty_ai_response");
  return {answer,model};
}
async function idemGet(env,key){if(!key||!env.AI_IDEMPOTENCY||typeof env.AI_IDEMPOTENCY.get!=="function")return null;try{const r=await env.AI_IDEMPOTENCY.get("chat:"+key);return r?JSON.parse(r):null}catch(_){return null}}
async function idemPut(env,key,v){if(!key||!env.AI_IDEMPOTENCY||typeof env.AI_IDEMPOTENCY.put!=="function")return;try{await env.AI_IDEMPOTENCY.put("chat:"+key,JSON.stringify(v),{expirationTtl:3600})}catch(_){}}
async function generateAnswer(env,facts,history,q,id){
  const first=await callOpenAI(env,[{role:"system",content:SYSTEM_PROMPT},{role:"system",content:`현재 서버 기준 날짜는 ${koreaDate()}입니다.`},{role:"system",content:chartContext(facts)},...history,{role:"user",content:q}],1350,id);
  const issues=qualityIssues(first.answer);
  if(!issues.length)return {answer:first.answer,model:first.model,quality:{repaired:false,issues}};
  const repaired=await callOpenAI(env,[{role:"system",content:SYSTEM_PROMPT},{role:"system",content:chartContext(facts)},{role:"user",content:`아래 답변 문제(${issues.join(", ")})를 고치되 새로운 명리 사실은 추가하지 마세요.\n질문:${q}\n답변:${first.answer.slice(0,7500)}\n최종 답변만 출력하세요.`}],1350,id+"_repair");
  return {answer:repaired.answer,model:repaired.model,quality:{repaired:true,issues,remaining:qualityIssues(repaired.answer)}};
}


async function createChartSnapshot(env,subject,body){
  const input=body?.normalized_input;
  const facts=body?.chart_facts;
  if(!input||typeof input!=="object"||!facts||typeof facts!=="object")throw new Error("chart_snapshot_payload_required");
  const now=new Date().toISOString(),id=uid("chart");
  const canonical=JSON.stringify(input);
  const rule=text(body.calculation_rule_version,80)||"unknown";
  const chartKey=await sha256(canonical+"|"+rule);
  await env.DB.prepare(`INSERT INTO chart_snapshots(
    id,user_id,guest_session_id,profile_id,chart_key,calculation_engine_version,
    calculation_rule_version,normalized_input_json,chart_facts_json,uncertainty_json,
    verification_state,created_at
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    id,
    subject.type==="user"?subject.id:null,
    subject.type==="guest"?subject.id:null,
    body.profile_id||null,
    chartKey,
    text(body.calculation_engine_version,80)||null,
    rule,
    canonical,
    JSON.stringify(facts),
    JSON.stringify(body.uncertainty||null),
    "CLIENT_FACTS_UNVERIFIED",
    now
  ).run();
  return {chartSnapshotId:id,chartKey,verificationState:"CLIENT_FACTS_UNVERIFIED"};
}

async function getOwnedChartSnapshot(env,subject,id){
  const col=subject.type==="user"?"user_id":"guest_session_id";
  return env.DB.prepare(`SELECT id,profile_id,chart_key,calculation_engine_version,calculation_rule_version,
    chart_facts_json,uncertainty_json,verification_state,created_at
    FROM chart_snapshots WHERE id=? AND ${col}=? LIMIT 1`).bind(id,subject.id).first();
}


async function ownedConversation(env,subject,id){
  if(!id)return null;
  const col=subject.type==="user"?"user_id":"guest_session_id";
  return env.DB.prepare(`SELECT id,chart_snapshot_id FROM conversations WHERE id=? AND ${col}=? AND deleted_at IS NULL LIMIT 1`)
    .bind(id,subject.id).first();
}

async function ownedChartSnapshot(env,subject,id){
  if(!id)return null;
  const col=subject.type==="user"?"user_id":"guest_session_id";
  return env.DB.prepare(`SELECT id,verification_state FROM chart_snapshots WHERE id=? AND ${col}=? LIMIT 1`)
    .bind(id,subject.id).first();
}

async function findAiReplay(env,idem){
  if(!idem)return null;
  const req=await env.DB.prepare(`SELECT id,state,conversation_id,chart_snapshot_id FROM ai_requests WHERE idempotency_key=? LIMIT 1`)
    .bind(idem).first();
  if(!req)return null;
  const result=await env.DB.prepare(`SELECT response_text,response_json,quality_json,request_id FROM ai_results WHERE ai_request_id=? LIMIT 1`)
    .bind(req.id).first();
  if(result&&["STORED","SPENT"].includes(req.state)){
    return {kind:"replay",request:req,result};
  }
  if(["PROCESSING","AI_SUCCESS","VALIDATING"].includes(req.state))return {kind:"in_progress",request:req};
  if(req.state==="FAILED_RETRYABLE")return {kind:"retry",request:req};
  return {kind:"blocked",request:req};
}

async function startAiRequest(env,subject,{idem,conversationId,chartSnapshotId,modelId,requestId}){
  const id=uid("aireq"),now=new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO ai_requests(
      id,user_id,guest_session_id,conversation_id,chart_snapshot_id,request_type,
      idempotency_key,state,model_id,prompt_version,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      id,
      subject.type==="user"?subject.id:null,
      subject.type==="guest"?subject.id:null,
      conversationId||null,chartSnapshotId||null,"AI_CHAT",
      idem,"PROCESSING",modelId||null,"ai-counsel-2.2",now,now
    ),
    env.DB.prepare(`INSERT INTO ai_request_events(
      id,ai_request_id,from_state,to_state,event_type,request_id,metadata_json,created_at
    ) VALUES(?,?,?,?,?,?,?,?)`).bind(
      uid("aievt"),id,"CREATED","PROCESSING","request_started",requestId,null,now
    )
  ]);
  return id;
}

async function markAiFailure(env,aiRequestId,requestId,errorCode,retryable=true){
  if(!aiRequestId)return;
  const now=new Date().toISOString(),to=retryable?"FAILED_RETRYABLE":"FAILED_FINAL";
  try{
    await env.DB.batch([
      env.DB.prepare(`UPDATE ai_requests SET state=?,error_code=?,updated_at=? WHERE id=? AND state NOT IN ('STORED','SPENT','RELEASED','FAILED_FINAL')`)
        .bind(to,errorCode||"unknown_error",now,aiRequestId),
      env.DB.prepare(`INSERT INTO ai_request_events(
        id,ai_request_id,from_state,to_state,event_type,request_id,metadata_json,created_at
      ) VALUES(?,?,?,?,?,?,?,?)`).bind(
        uid("aievt"),aiRequestId,"PROCESSING",to,"request_failed",requestId,
        JSON.stringify({error:errorCode||"unknown_error"}),now
      )
    ]);
  }catch(_){}
}

async function storeAiSuccess(env,{aiRequestId,requestId,answer,model,quality,conversationId,chartSnapshotId,userQuestion}){
  const now=new Date().toISOString();
  const resultId=uid("aires");
  const stmts=[
    env.DB.prepare(`UPDATE ai_requests SET state='AI_SUCCESS',model_id=?,updated_at=? WHERE id=? AND state='PROCESSING'`)
      .bind(model||null,now,aiRequestId),
    env.DB.prepare(`INSERT INTO ai_request_events(id,ai_request_id,from_state,to_state,event_type,request_id,metadata_json,created_at)
      VALUES(?,?,?,?,?,?,?,?)`).bind(uid("aievt"),aiRequestId,"PROCESSING","AI_SUCCESS","model_completed",requestId,null,now),
    env.DB.prepare(`UPDATE ai_requests SET state='VALIDATING',updated_at=? WHERE id=? AND state='AI_SUCCESS'`)
      .bind(now,aiRequestId),
    env.DB.prepare(`INSERT INTO ai_request_events(id,ai_request_id,from_state,to_state,event_type,request_id,metadata_json,created_at)
      VALUES(?,?,?,?,?,?,?,?)`).bind(uid("aievt"),aiRequestId,"AI_SUCCESS","VALIDATING","quality_validated",requestId,JSON.stringify(quality||null),now),
    env.DB.prepare(`INSERT INTO ai_results(
      id,ai_request_id,request_id,response_text,response_json,quality_json,chart_snapshot_id,conversation_id,created_at
    ) VALUES(?,?,?,?,?,?,?,?,?)`).bind(
      resultId,aiRequestId,requestId,answer,
      JSON.stringify({answer,model}),JSON.stringify(quality||null),
      chartSnapshotId||null,conversationId||null,now
    )
  ];

  if(conversationId){
    stmts.push(
      env.DB.prepare(`INSERT OR IGNORE INTO messages(id,conversation_id,role,content,request_id,created_at)
        VALUES(?,?,?,?,?,?)`).bind(uid("msg"),conversationId,"user",String(userQuestion||"").slice(0,12000),requestId+":user",now)
    );
    stmts.push(
      env.DB.prepare(`INSERT OR IGNORE INTO messages(id,conversation_id,role,content,request_id,created_at)
        VALUES(?,?,?,?,?,?)`).bind(uid("msg"),conversationId,"assistant",answer,requestId+":assistant",now)
    );
    stmts.push(
      env.DB.prepare(`UPDATE conversations SET updated_at=? WHERE id=?`).bind(now,conversationId)
    );
  }

  stmts.push(
    env.DB.prepare(`UPDATE ai_requests SET state='STORED',completed_at=?,updated_at=? WHERE id=? AND state='VALIDATING'`)
      .bind(now,now,aiRequestId)
  );
  stmts.push(
    env.DB.prepare(`INSERT INTO ai_request_events(id,ai_request_id,from_state,to_state,event_type,request_id,metadata_json,created_at)
      VALUES(?,?,?,?,?,?,?,?)`).bind(uid("aievt"),aiRequestId,"VALIDATING","STORED","durable_store_completed",requestId,JSON.stringify({resultId}),now)
  );

  await env.DB.batch(stmts);
  return {resultId,state:"STORED"};
}


function accountingFlags(env){return{free:env.SERVER_FREE_QUOTA_ENABLED==="true",wallet:env.SERVER_WALLET_ENABLED==="true"}}
async function accountingStatus(env,subject){
  const q=await env.DB.prepare(`SELECT id,used_count,reserved_count,limit_count FROM usage_quotas WHERE subject_type=? AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime' LIMIT 1`).bind(subject.type,subject.id).first();
  const w=await env.DB.prepare(`SELECT balance,reserved_balance FROM wallet_accounts WHERE subject_type=? AND subject_id=? LIMIT 1`).bind(subject.type,subject.id).first();
  const used=Number(q?.used_count||0),reserved=Number(q?.reserved_count||0),limit=Number(q?.limit_count??3),balance=Number(w?.balance||0),wr=Number(w?.reserved_balance||0);
  return{quota:{id:q?.id||null,used,reserved,limit,available:Math.max(0,limit-used-reserved)},wallet:{balance,reserved:wr,available:Math.max(0,balance-wr)}};
}
async function reserveAccounting(env,subject,requestId,idempotencyKey){
  const flags=accountingFlags(env);if(!flags.free&&!flags.wallet)return{source:"none",reservationId:null,disabled:true};
  const status=await accountingStatus(env,subject),now=new Date().toISOString();
  if(flags.free&&status.quota.available>0){
    const reservationId=uid("qres");
    const u=await env.DB.prepare(`UPDATE usage_quotas SET reserved_count=reserved_count+1,updated_at=? WHERE subject_type=? AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime' AND used_count+reserved_count<limit_count`).bind(now,subject.type,subject.id).run();
    if(Number(u?.meta?.changes||0)===1){
      try{
        await env.DB.prepare(`INSERT INTO quota_reservations(id,subject_type,subject_id,quota_key,period_key,amount,state,request_id,idempotency_key,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(reservationId,subject.type,subject.id,"ai_chat_free","lifetime",1,"RESERVED",requestId,idempotencyKey+":quota",now,now).run();
        return{source:"free_quota",reservationId};
      }catch(e){
        await env.DB.prepare(`UPDATE usage_quotas SET reserved_count=MAX(0,reserved_count-1),updated_at=? WHERE subject_type=? AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime'`).bind(now,subject.type,subject.id).run();
        throw e;
      }
    }
  }
  if(flags.wallet){
    const fresh=await accountingStatus(env,subject);
    if(fresh.wallet.available>0){
      const reservationId=uid("wres");
      const u=await env.DB.prepare(`UPDATE wallet_accounts SET reserved_balance=reserved_balance+1,version=version+1,updated_at=? WHERE subject_type=? AND subject_id=? AND balance-reserved_balance>=1`).bind(now,subject.type,subject.id).run();
      if(Number(u?.meta?.changes||0)===1){
        try{
          await env.DB.prepare(`INSERT INTO wallet_reservations(id,subject_type,subject_id,request_id,amount,state,idempotency_key,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(reservationId,subject.type,subject.id,requestId,1,"RESERVED",idempotencyKey+":wallet",now,now).run();
          return{source:"wallet",reservationId};
        }catch(e){
          await env.DB.prepare(`UPDATE wallet_accounts SET reserved_balance=MAX(0,reserved_balance-1),version=version+1,updated_at=? WHERE subject_type=? AND subject_id=?`).bind(now,subject.type,subject.id).run();
          throw e;
        }
      }
    }
  }
  return{source:"none",reservationId:null,blocked:true};
}
async function finalizeAccounting(env,subject,charge,requestId){
  if(!charge||charge.source==="none")return{action:"none",succeeded:true};
  const now=new Date().toISOString();
  if(charge.source==="free_quota"){
    const res=await env.DB.prepare(`SELECT id,state,amount FROM quota_reservations WHERE id=? AND subject_type=? AND subject_id=? LIMIT 1`).bind(charge.reservationId,subject.type,subject.id).first();
    if(!res||res.state!=="RESERVED")return{action:"spend",succeeded:false,error:"quota_reservation_missing"};
    const a=Number(res.amount||1);
    const u=await env.DB.prepare(`UPDATE usage_quotas SET used_count=used_count+?,reserved_count=reserved_count-?,updated_at=? WHERE subject_type=? AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime' AND reserved_count>=? AND used_count+?<=limit_count`).bind(a,a,now,subject.type,subject.id,a,a).run();
    if(Number(u?.meta?.changes||0)!==1)return{action:"spend",succeeded:false,error:"quota_finalize_failed"};
    await env.DB.prepare(`UPDATE quota_reservations SET state='SPENT',updated_at=? WHERE id=? AND state='RESERVED'`).bind(now,res.id).run();
    return{action:"spend",succeeded:true,source:"free_quota"};
  }
  if(charge.source==="wallet"){
    const res=await env.DB.prepare(`SELECT id,state,amount FROM wallet_reservations WHERE id=? AND subject_type=? AND subject_id=? LIMIT 1`).bind(charge.reservationId,subject.type,subject.id).first();
    if(!res||res.state!=="RESERVED")return{action:"spend",succeeded:false,error:"wallet_reservation_missing"};
    const a=Number(res.amount||1),acct=await env.DB.prepare(`SELECT balance,reserved_balance FROM wallet_accounts WHERE subject_type=? AND subject_id=? LIMIT 1`).bind(subject.type,subject.id).first();
    if(!acct||Number(acct.balance)<a||Number(acct.reserved_balance)<a)return{action:"spend",succeeded:false,error:"wallet_finalize_failed"};
    const after=Number(acct.balance)-a;
    const u=await env.DB.prepare(`UPDATE wallet_accounts SET balance=balance-?,reserved_balance=reserved_balance-?,version=version+1,updated_at=? WHERE subject_type=? AND subject_id=? AND balance>=? AND reserved_balance>=?`).bind(a,a,now,subject.type,subject.id,a,a).run();
    if(Number(u?.meta?.changes||0)!==1)return{action:"spend",succeeded:false,error:"wallet_finalize_failed"};
    await env.DB.batch([
      env.DB.prepare(`UPDATE wallet_reservations SET state='SPENT',updated_at=? WHERE id=? AND state='RESERVED'`).bind(now,res.id),
      env.DB.prepare(`INSERT INTO wallet_ledger(id,subject_type,subject_id,request_id,reservation_id,kind,delta,balance_after,state,idempotency_key,note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(uid("ledger"),subject.type,subject.id,requestId,res.id,"AI_CHAT",-a,after,"SPENT","ledger:"+res.id,"AI 답변 저장 완료 후 최종 차감",now)
    ]);
    return{action:"spend",succeeded:true,source:"wallet",balanceAfter:after};
  }
  return{action:"none",succeeded:false,error:"invalid_charge_source"};
}
async function releaseAccounting(env,subject,charge){
  if(!charge||charge.source==="none")return{action:"none",succeeded:true};
  const now=new Date().toISOString();
  if(charge.source==="free_quota"){
    const r=await env.DB.prepare(`SELECT state,amount FROM quota_reservations WHERE id=? AND subject_type=? AND subject_id=? LIMIT 1`).bind(charge.reservationId,subject.type,subject.id).first();
    if(!r||r.state!=="RESERVED")return{action:"release",succeeded:true,replayed:true};
    const a=Number(r.amount||1);
    await env.DB.batch([
      env.DB.prepare(`UPDATE usage_quotas SET reserved_count=MAX(0,reserved_count-?),updated_at=? WHERE subject_type=? AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime'`).bind(a,now,subject.type,subject.id),
      env.DB.prepare(`UPDATE quota_reservations SET state='RELEASED',updated_at=? WHERE id=? AND state='RESERVED'`).bind(now,charge.reservationId)
    ]);
    return{action:"release",succeeded:true,source:"free_quota"};
  }
  if(charge.source==="wallet"){
    const r=await env.DB.prepare(`SELECT state,amount FROM wallet_reservations WHERE id=? AND subject_type=? AND subject_id=? LIMIT 1`).bind(charge.reservationId,subject.type,subject.id).first();
    if(!r||r.state!=="RESERVED")return{action:"release",succeeded:true,replayed:true};
    const a=Number(r.amount||1);
    await env.DB.batch([
      env.DB.prepare(`UPDATE wallet_accounts SET reserved_balance=MAX(0,reserved_balance-?),version=version+1,updated_at=? WHERE subject_type=? AND subject_id=?`).bind(a,now,subject.type,subject.id),
      env.DB.prepare(`UPDATE wallet_reservations SET state='RELEASED',updated_at=? WHERE id=? AND state='RESERVED'`).bind(now,charge.reservationId)
    ]);
    return{action:"release",succeeded:true,source:"wallet"};
  }
  return{action:"release",succeeded:false,error:"invalid_charge_source"};
}


function paymentEnabled(env){return env.NEW_PAYMENTS_ENABLED==="true"}

async function ownedOrder(env,subject,id){
  const col=subject.type==="user"?"user_id":"guest_session_id";
  return env.DB.prepare(`SELECT o.*,p.product_code,p.product_type,p.name AS product_name,p.benefits_json
    FROM orders o JOIN products p ON p.id=o.product_id
    WHERE o.id=? AND o.${col}=? LIMIT 1`).bind(id,subject.id).first();
}

async function createOrder(env,subject,body,idempotencyKey){
  const productCode=text(body?.product_code,80);
  if(!productCode)throw new Error("product_code_required");
  const p=await env.DB.prepare(`SELECT * FROM products WHERE product_code=? AND active=1 LIMIT 1`).bind(productCode).first();
  if(!p)throw new Error("product_not_found");

  const existing=await env.DB.prepare(`SELECT id,state,amount,currency FROM orders WHERE idempotency_key=? LIMIT 1`)
    .bind(idempotencyKey).first();
  if(existing)return {...existing,replayed:true};

  const id=uid("order"),now=new Date().toISOString();
  const snapshot={
    product_id:p.id,product_code:p.product_code,product_type:p.product_type,
    name:p.name,price_amount:Number(p.price_amount),currency:p.currency,
    benefits:JSON.parse(p.benefits_json||"{}")
  };
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders(
      id,user_id,guest_session_id,product_id,chart_snapshot_id,idempotency_key,state,
      product_snapshot_json,amount,currency,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      id,subject.type==="user"?subject.id:null,subject.type==="guest"?subject.id:null,
      p.id,body?.chart_snapshot_id||null,idempotencyKey,"CREATED",
      JSON.stringify(snapshot),Number(p.price_amount),p.currency,now,now
    ),
    env.DB.prepare(`INSERT INTO payment_events(
      id,order_id,event_type,from_state,to_state,request_id,metadata_json,created_at
    ) VALUES(?,?,?,?,?,?,?,?)`).bind(
      uid("pevt"),id,"order_created",null,"CREATED",null,JSON.stringify({productCode}),now
    )
  ]);
  return {id,state:"CREATED",amount:Number(p.price_amount),currency:p.currency,replayed:false};
}

async function fulfillOrder(env,order,payment,requestId){
  if(order.state!=="PAID"||payment.state!=="VERIFIED")throw new Error("payment_not_verified");
  const snap=JSON.parse(order.product_snapshot_json||"{}"),b=snap.benefits||{},now=new Date().toISOString();
  const subjectType=order.user_id?"user":"guest",subjectId=order.user_id||order.guest_session_id;

  if(snap.product_code==="LIFETIME_SAJU"||snap.product_code==="PREMIUM_COMPAT"){
    const type=snap.product_code==="LIFETIME_SAJU"?"lifetime_saju":"premium_compat";
    await env.DB.prepare(`INSERT OR IGNORE INTO entitlements(
      id,user_id,guest_session_id,order_id,entitlement_type,resource_key,state,granted_at,metadata_json
    ) VALUES(?,?,?,?,?,?,?,?,?)`).bind(
      uid("ent"),order.user_id||null,order.guest_session_id||null,order.id,type,
      order.chart_snapshot_id||null,"ACTIVE",now,JSON.stringify({product_code:snap.product_code})
    ).run();
  }else if(/^CLOVER_/.test(String(snap.product_code||""))){
    const credits=Number(b.credits||0);
    if(!Number.isInteger(credits)||credits<=0)throw new Error("invalid_credit_benefit");
    const before=await env.DB.prepare(`SELECT balance FROM wallet_accounts WHERE subject_type=? AND subject_id=? LIMIT 1`)
      .bind(subjectType,subjectId).first();
    const balanceBefore=Number(before?.balance||0),balanceAfter=balanceBefore+credits;
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO wallet_accounts(subject_type,subject_id,balance,reserved_balance,version,updated_at)
        VALUES(?,?,?,?,?,?)
        ON CONFLICT(subject_type,subject_id) DO UPDATE SET
          balance=wallet_accounts.balance+excluded.balance,
          version=wallet_accounts.version+1,
          updated_at=excluded.updated_at`).bind(subjectType,subjectId,credits,0,0,now),
      env.DB.prepare(`INSERT INTO wallet_ledger(
        id,subject_type,subject_id,request_id,order_id,kind,delta,balance_after,state,idempotency_key,note,created_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        uid("ledger"),subjectType,subjectId,requestId,order.id,"PURCHASE",credits,balanceAfter,
        "POSTED","purchase:"+order.id,"클로버 구매 지급",now
      )
    ]);
  }else throw new Error("unknown_product_benefit");

  await env.DB.batch([
    env.DB.prepare(`UPDATE orders SET state='FULFILLED',updated_at=? WHERE id=? AND state='PAID'`).bind(now,order.id),
    env.DB.prepare(`INSERT INTO payment_events(
      id,order_id,payment_id,event_type,from_state,to_state,request_id,metadata_json,created_at
    ) VALUES(?,?,?,?,?,?,?,?,?)`).bind(
      uid("pevt"),order.id,payment.id,"order_fulfilled","PAID","FULFILLED",requestId,null,now
    )
  ]);
}

async function processVerifiedPayment(env,{orderId,provider,providerPaymentId,amount,currency,requestId,payloadHash}){
  const order=await env.DB.prepare(`SELECT * FROM orders WHERE id=? LIMIT 1`).bind(orderId).first();
  if(!order)throw new Error("order_not_found");
  if(Number(order.amount)!==Number(amount))throw new Error("payment_amount_mismatch");
  if(String(order.currency)!==String(currency))throw new Error("payment_currency_mismatch");

  const existing=await env.DB.prepare(`SELECT * FROM payments WHERE provider=? AND provider_payment_id=? LIMIT 1`)
    .bind(provider,providerPaymentId).first();
  if(existing&&existing.order_id!==orderId)throw new Error("provider_payment_reused");

  const now=new Date().toISOString();
  let payment=existing;
  if(!payment){
    const paymentId=uid("pay");
    await env.DB.prepare(`INSERT INTO payments(
      id,order_id,provider,provider_payment_id,state,approved_amount,currency,approved_at,
      verified_at,verification_source,raw_payload_hash,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      paymentId,orderId,provider,providerPaymentId,"VERIFIED",Number(amount),currency,now,
      now,"provider_api_or_signed_webhook",payloadHash||null,now,now
    ).run();
    payment={id:paymentId,order_id:orderId,state:"VERIFIED"};
  }

  if(["PAID","FULFILLED"].includes(order.state)){
    return {orderId,paymentId:payment.id,replayed:true,state:order.state};
  }

  await env.DB.batch([
    env.DB.prepare(`UPDATE orders SET state='PAID',updated_at=? WHERE id=? AND state IN ('CREATED','PAYMENT_PENDING')`).bind(now,orderId),
    env.DB.prepare(`INSERT INTO payment_events(
      id,order_id,payment_id,event_type,from_state,to_state,request_id,metadata_json,created_at
    ) VALUES(?,?,?,?,?,?,?,?,?)`).bind(
      uid("pevt"),orderId,payment.id,"payment_verified",order.state,"PAID",requestId,
      JSON.stringify({provider,providerPaymentId}),now
    )
  ]);

  const refreshed=await env.DB.prepare(`SELECT * FROM orders WHERE id=?`).bind(orderId).first();
  await fulfillOrder(env,refreshed,payment,requestId);
  return {orderId,paymentId:payment.id,replayed:false,state:"FULFILLED"};
}


async function purchaseRestoreSnapshot(env,subject){
  const col=subject.type==="user"?"user_id":"guest_session_id";
  const orders=await env.DB.prepare(`SELECT id,state,amount,currency,product_snapshot_json,created_at,updated_at
    FROM orders WHERE ${col}=? ORDER BY created_at DESC LIMIT 100`).bind(subject.id).all();
  const ent=await env.DB.prepare(`SELECT entitlement_type,resource_key,order_id,state,granted_at,revoked_at
    FROM entitlements WHERE ${col}=? ORDER BY granted_at DESC`).bind(subject.id).all();
  const ledger=await env.DB.prepare(`SELECT order_id,kind,delta,balance_after,state,created_at
    FROM wallet_ledger WHERE subject_type=? AND subject_id=? ORDER BY created_at ASC`).bind(subject.type,subject.id).all();
  return {orders:orders?.results||[],entitlements:ent?.results||[],walletLedger:ledger?.results||[]};
}

async function findPaymentRecoveryIssues(env,limit=100){
  const rows=await env.DB.prepare(`
    SELECT o.id AS order_id,o.state AS order_state,p.id AS payment_id,p.state AS payment_state
    FROM orders o
    LEFT JOIN payments p ON p.order_id=o.id
    WHERE
      (p.state='VERIFIED' AND o.state IN ('CREATED','PAYMENT_PENDING','PAID'))
      OR (o.state='FULFILLED' AND p.id IS NULL)
    ORDER BY o.updated_at ASC
    LIMIT ?
  `).bind(limit).all();
  return rows?.results||[];
}

async function findRefundRecoveryIssues(env,limit=100){
  const rows=await env.DB.prepare(`
    SELECT r.id AS refund_id,r.state AS refund_state,r.order_id,r.payment_id,o.state AS order_state,p.state AS payment_state
    FROM refunds r
    JOIN orders o ON o.id=r.order_id
    JOIN payments p ON p.id=r.payment_id
    WHERE
      (r.state='VERIFIED' AND o.state!='REFUNDED')
      OR (r.state='FAILED' AND o.state='REFUND_PENDING')
    ORDER BY r.requested_at ASC
    LIMIT ?
  `).bind(limit).all();
  return rows?.results||[];
}

async function recordReconciliationRun(env,{paymentIssues,refundIssues}){
  const now=new Date().toISOString(),runId=uid("recon");
  const issues=[...paymentIssues.map(x=>({type:"PAYMENT_STATE_MISMATCH",row:x})),
                ...refundIssues.map(x=>({type:"REFUND_STATE_MISMATCH",row:x}))];
  const stmts=[
    env.DB.prepare(`INSERT INTO reconciliation_runs(
      id,run_type,state,started_at,completed_at,scanned_count,issue_count,metadata_json
    ) VALUES(?,?,?,?,?,?,?,?)`).bind(
      runId,"PAYMENT_RECOVERY","COMPLETED",now,now,
      paymentIssues.length+refundIssues.length,issues.length,JSON.stringify({preview:true})
    )
  ];
  for(const x of issues){
    stmts.push(env.DB.prepare(`INSERT INTO reconciliation_issues(
      id,reconciliation_run_id,issue_type,severity,order_id,payment_id,refund_id,state,details_json,detected_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(
      uid("reconissue"),runId,x.type,"critical",
      x.row.order_id||null,x.row.payment_id||null,x.row.refund_id||null,
      "OPEN",JSON.stringify(x.row),now
    ));
  }
  await env.DB.batch(stmts);
  return {runId,issueCount:issues.length};
}


function securityEnforced(env){return env.SECURITY_ENFORCEMENT_ENABLED==="true"}

function routeClass(path){
  if(path==="/"||path==="/health")return"public_read";
  if(path==="/api/session/guest")return"session_create";
  if(path==="/api/chat")return"ai";
  if(path.startsWith("/api/orders"))return"payment";
  if(path.startsWith("/api/me/"))return"private_read";
  if(path.startsWith("/api/profiles")||path.startsWith("/api/conversations")||path.startsWith("/api/chart-snapshots"))return"private_write";
  if(path.startsWith("/api/admin/"))return"admin";
  return"other";
}

function ratePolicy(path){
  const p={
    public_read:[120,60],session_create:[12,60],ai:[20,60],payment:[20,60],
    private_read:[60,60],private_write:[40,60],admin:[10,60],other:[30,60]
  }[routeClass(path)];
  return{limit:p[0],windowSeconds:p[1]};
}

function requestBodyLimit(path){
  const c=routeClass(path);
  return c==="ai"?65536:c==="payment"?32768:24576;
}

async function hashSecurityValue(env,value){
  const secret=String(env.SECURITY_HASH_SECRET||"");
  if(!secret)return sha256(String(value||""));
  return sha256(secret+"|"+String(value||""));
}

function clientIp(request){
  return request.headers.get("CF-Connecting-IP")||request.headers.get("X-Forwarded-For")||"unknown";
}

async function rateLimitCheck(env,request,path,subject){
  if(!dbReady(env))return{allowed:true,skipped:true};
  const policy=ratePolicy(path),now=Date.now(),windowMs=policy.windowSeconds*1000;
  const keyMaterial=subject?`${subject.type}:${subject.id}`:`ip:${clientIp(request)}`;
  const bucketHash=await hashSecurityValue(env,keyMaterial+"|"+routeClass(path));
  const row=await env.DB.prepare(`SELECT window_start,request_count FROM api_rate_limits WHERE bucket_key=? LIMIT 1`).bind(bucketHash).first();
  const nowIso=new Date(now).toISOString();

  if(!row){
    await env.DB.prepare(`INSERT INTO api_rate_limits(bucket_key,window_start,request_count,updated_at) VALUES(?,?,1,?)`)
      .bind(bucketHash,nowIso,nowIso).run();
    return{allowed:true,remaining:policy.limit-1};
  }

  const start=Date.parse(row.window_start);
  if(!Number.isFinite(start)||now-start>=windowMs){
    await env.DB.prepare(`UPDATE api_rate_limits SET window_start=?,request_count=1,updated_at=? WHERE bucket_key=?`)
      .bind(nowIso,nowIso,bucketHash).run();
    return{allowed:true,remaining:policy.limit-1};
  }

  if(Number(row.request_count)>=policy.limit){
    return{allowed:false,retryAfter:Math.max(1,Math.ceil((windowMs-(now-start))/1000))};
  }

  await env.DB.prepare(`UPDATE api_rate_limits SET request_count=request_count+1,updated_at=? WHERE bucket_key=?`)
    .bind(nowIso,bucketHash).run();
  return{allowed:true,remaining:Math.max(0,policy.limit-Number(row.request_count)-1)};
}

function sanitizeMetadata(value,depth=0){
  if(depth>5)return"[TRUNCATED]";
  if(value==null||typeof value==="number"||typeof value==="boolean")return value;
  if(typeof value==="string")return value.length>240?value.slice(0,240)+"…":value;
  if(Array.isArray(value))return value.slice(0,20).map(x=>sanitizeMetadata(x,depth+1));
  if(typeof value==="object"){
    const blocked=new Set(["authorization","cookie","set-cookie","x-guiin-guest","token","access_token","refresh_token","password","email","phone","telephone","name","display_name","birth_year","birth_month","birth_day","birth_hour","birth_minute","provider_payment_id"]);
    const out={};
    for(const[k,v]of Object.entries(value)){
      out[k]=blocked.has(String(k).toLowerCase())?"[REDACTED]":sanitizeMetadata(v,depth+1);
    }
    return out;
  }
  return String(value);
}

async function recordSecurityEvent(env,{eventType,severity="warning",subject,requestId,route,request,metadata}){
  if(!dbReady(env))return;
  try{
    const ipHash=await hashSecurityValue(env,clientIp(request));
    const uaHash=await hashSecurityValue(env,request.headers.get("User-Agent")||"");
    await env.DB.prepare(`INSERT INTO security_events(
      id,event_type,severity,subject_type,subject_id,request_id,route,ip_hash,user_agent_hash,metadata_json,created_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(
      uid("sevt"),String(eventType).slice(0,120),String(severity).slice(0,20),
      subject?.type||null,subject?.id||null,requestId||null,String(route||"").slice(0,180),
      ipHash,uaHash,JSON.stringify(sanitizeMetadata(metadata||{})),new Date().toISOString()
    ).run();
  }catch(_){}
}

function methodAllowed(path,method){
  const m=String(method||"GET").toUpperCase();
  if(path==="/"||path==="/health")return m==="GET";
  if(path==="/api/session/guest")return m==="POST";
  return ["GET","POST","DELETE","OPTIONS"].includes(m);
}

function needsJson(path,method){
  const m=String(method||"GET").toUpperCase();
  return ["POST","PUT","PATCH"].includes(m)&&path!=="/api/session/guest";
}


function paymentLaunchGate(env){
  const keys=["AUTH_READY","SESSION_SECURITY_READY","RATE_LIMIT_READY","SECRETS_READY","PAYMENT_IDEMPOTENCY_READY","AI_NO_LOSS_READY","WEBHOOK_RECOVERY_READY","REFUND_RECOVERY_READY","AUDIT_INTEGRITY_READY","BACKUP_VERIFIED","RESTORE_DRILL_READY","LEGAL_READY","PG_VERIFIED"];
  const failed=keys.filter(k=>env[k]!=="true");return{ready:failed.length===0,failed};
}
async function adminGate(env,subject){
  if(!subject||subject.type!=="user")return{allowed:false,reason:"user_required"};
  const r=await env.DB.prepare(`SELECT user_id,mfa_required,mfa_verified_at,access_enabled FROM admin_security WHERE user_id=? LIMIT 1`).bind(subject.id).first();
  if(!r||Number(r.access_enabled)!==1)return{allowed:false,reason:"admin_disabled"};
  if(Number(r.mfa_required)!==1)return{allowed:false,reason:"mfa_policy_missing"};
  const t=Date.parse(r.mfa_verified_at||"");
  if(!Number.isFinite(t)||Date.now()-t>900000)return{allowed:false,reason:"mfa_required"};
  return{allowed:true};
}


async function readServiceStates(env){
  if(!dbReady(env))return{};
  try{
    const rows=await env.DB.prepare(`SELECT state_key,state_value FROM service_state`).all();
    return Object.fromEntries((rows?.results||[]).map(x=>[x.state_key,x.state_value]));
  }catch(_){return{}}
}

function runtimeGate(states,path,method){
  const maintenance=states.MAINTENANCE_MODE==="true";
  const readOnly=states.READ_ONLY_MODE==="true";
  const aiDisabled=states.AI_DISABLED==="true";
  const paymentsDisabled=states.PAYMENTS_DISABLED!=="false";
  const write=["POST","PUT","PATCH","DELETE"].includes(String(method).toUpperCase());

  if(maintenance&&path!=="/health")return{allowed:false,status:503,error:"maintenance_mode"};
  if(aiDisabled&&path==="/api/chat")return{allowed:false,status:503,error:"ai_temporarily_disabled"};
  if(readOnly&&write&&path!=="/api/session/guest")return{allowed:false,status:503,error:"read_only_mode"};
  if(paymentsDisabled&&path.startsWith("/api/orders")&&write)return{allowed:false,status:503,error:"payments_disabled"};
  return{allowed:true};
}

async function recordIncident(env,{type,severity="warning",state="OPEN",requestId,subject,orderId,aiRequestId,details}){
  if(!dbReady(env))return;
  try{
    await env.DB.prepare(`INSERT INTO incident_events(
      id,incident_type,severity,state,request_id,subject_type,subject_id,order_id,ai_request_id,details_json,created_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(
      uid("inc"),String(type).slice(0,120),severity,state,requestId||null,
      subject?.type||null,subject?.id||null,orderId||null,aiRequestId||null,
      JSON.stringify(sanitizeMetadata(details||{})),new Date().toISOString()
    ).run();
  }catch(_){}
}

async function integritySnapshot(env){
  if(!dbReady(env))return{available:false,issues:["database_unavailable"]};
  const q={};
  q.walletNegative=Number((await env.DB.prepare(`SELECT COUNT(*) AS c FROM wallet_accounts WHERE balance<0`).first())?.c||0);
  q.walletReservedOverBalance=Number((await env.DB.prepare(`SELECT COUNT(*) AS c FROM wallet_accounts WHERE reserved_balance>balance OR reserved_balance<0`).first())?.c||0);
  q.quotaReservedNegative=Number((await env.DB.prepare(`SELECT COUNT(*) AS c FROM usage_quotas WHERE reserved_count<0 OR used_count<0 OR used_count+reserved_count>limit_count`).first())?.c||0);
  q.fulfilledWithoutPayment=Number((await env.DB.prepare(`SELECT COUNT(*) AS c FROM orders o LEFT JOIN payments p ON p.order_id=o.id WHERE o.state='FULFILLED' AND p.id IS NULL`).first())?.c||0);
  q.paidNotFulfilled=Number((await env.DB.prepare(`SELECT COUNT(*) AS c FROM orders WHERE state='PAID'`).first())?.c||0);
  q.storedAiWithoutResult=Number((await env.DB.prepare(`SELECT COUNT(*) AS c FROM ai_requests a LEFT JOIN ai_results r ON r.ai_request_id=a.id WHERE a.state IN ('STORED','SPENT') AND r.id IS NULL`).first())?.c||0);
  const issues=Object.entries(q).filter(([,v])=>Number(v)>0).map(([k])=>k);
  return{available:true,counts:q,issues,healthy:issues.length===0};
}


async function latestLaunchGate(env){
  if(!dbReady(env))return{available:false,ready:false,reason:"database_unavailable"};
  try{
    const run=await env.DB.prepare(`SELECT id,state,passed_count,failed_count,completed_at FROM launch_gate_runs ORDER BY started_at DESC LIMIT 1`).first();
    if(!run)return{available:true,ready:false,reason:"no_launch_gate_run"};
    const failed=await env.DB.prepare(`SELECT gate_key,category,state FROM launch_gate_results WHERE launch_gate_run_id=? AND required=1 AND state!='PASS' ORDER BY category,gate_key`).bind(run.id).all();
    return{available:true,ready:run.state==="PASS"&&Number(run.failed_count)===0,runId:run.id,passed:Number(run.passed_count||0),failed:Number(run.failed_count||0),failedGates:failed?.results||[]};
  }catch(_){return{available:false,ready:false,reason:"launch_gate_read_failed"}}
}


async function subjectBusyForConversion(env,type,id){
  const [wr,qr,ai]=await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS c FROM wallet_reservations WHERE subject_type=? AND subject_id=? AND state='RESERVED'`).bind(type,id).first(),
    env.DB.prepare(`SELECT COUNT(*) AS c FROM quota_reservations WHERE subject_type=? AND subject_id=? AND state='RESERVED'`).bind(type,id).first(),
    type==="guest"
      ? env.DB.prepare(`SELECT COUNT(*) AS c FROM ai_requests WHERE guest_session_id=? AND state IN ('PROCESSING','AI_SUCCESS','VALIDATING')`).bind(id).first()
      : env.DB.prepare(`SELECT COUNT(*) AS c FROM ai_requests WHERE user_id=? AND state IN ('PROCESSING','AI_SUCCESS','VALIDATING')`).bind(id).first()
  ]);
  return Number(wr?.c||0)+Number(qr?.c||0)+Number(ai?.c||0);
}

async function conversionUsage(env,type,id){
  const w=await env.DB.prepare(`SELECT balance,reserved_balance FROM wallet_accounts WHERE subject_type=? AND subject_id=? LIMIT 1`).bind(type,id).first();
  const q=await env.DB.prepare(`SELECT used_count,reserved_count,limit_count FROM usage_quotas WHERE subject_type=? AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime' LIMIT 1`).bind(type,id).first();
  return {
    wallet:{balance:Number(w?.balance||0),reserved:Number(w?.reserved_balance||0)},
    quota:{used:Number(q?.used_count||0),reserved:Number(q?.reserved_count||0),limit:Number(q?.limit_count??3)}
  };
}

async function convertGuestToUser(env,{guestToken,userId,idempotencyKey,requestId}){
  if(!/^gst_[A-Za-z0-9._:-]{32,}$/.test(String(guestToken||"")))throw new Error("invalid_guest_token");
  const guest=await env.DB.prepare(`SELECT id,converted_user_id,revoked_at FROM guest_sessions WHERE token_hash=? LIMIT 1`)
    .bind(await sha256(guestToken)).first();
  if(!guest)throw new Error("guest_not_found");
  if(guest.converted_user_id && String(guest.converted_user_id)!==String(userId))throw new Error("guest_already_linked_other_user");

  const existing=await env.DB.prepare(`SELECT id,user_id,state FROM guest_conversions WHERE guest_session_id=? LIMIT 1`).bind(guest.id).first();
  if(existing){
    if(String(existing.user_id)!==String(userId))throw new Error("guest_already_linked_other_user");
    if(existing.state==="COMPLETED")return {ok:true,replayed:true,conversionId:existing.id};
    if(existing.state==="PROCESSING")throw new Error("conversion_in_progress");
  }

  const busyGuest=await subjectBusyForConversion(env,"guest",guest.id);
  const busyUser=await subjectBusyForConversion(env,"user",userId);
  if(busyGuest||busyUser)throw new Error("conversion_busy_retry_later");

  const [g,u]=await Promise.all([conversionUsage(env,"guest",guest.id),conversionUsage(env,"user",userId)]);
  if(g.wallet.reserved||u.wallet.reserved||g.quota.reserved||u.quota.reserved)throw new Error("conversion_busy_retry_later");

  const now=new Date().toISOString(),conversionId=existing?.id||uid("gconv");
  if(!existing){
    const claimed=await env.DB.prepare(`INSERT OR IGNORE INTO guest_conversions(
      id,guest_session_id,user_id,state,started_at,idempotency_key
    ) VALUES(?,?,?,?,?,?)`).bind(
      conversionId,guest.id,userId,"PROCESSING",now,idempotencyKey
    ).run();
    if(Number(claimed?.meta?.changes||0)!==1){
      const again=await env.DB.prepare(`SELECT id,user_id,state FROM guest_conversions WHERE guest_session_id=? LIMIT 1`).bind(guest.id).first();
      if(again?.state==="COMPLETED"&&String(again.user_id)===String(userId))return {ok:true,replayed:true,conversionId:again.id};
      throw new Error("conversion_in_progress");
    }
  }else{
    await env.DB.prepare(`UPDATE guest_conversions SET state='PROCESSING',error_code=NULL WHERE id=? AND user_id=?`)
      .bind(conversionId,userId).run();
  }

  const mergedBalance=u.wallet.balance+g.wallet.balance;
  const limit=Math.max(3,u.quota.limit,g.quota.limit);
  const mergedUsed=Math.min(limit,u.quota.used+g.quota.used);

  const stmts=[
    env.DB.prepare(`UPDATE profiles SET user_id=?,guest_session_id=NULL,updated_at=? WHERE guest_session_id=?`).bind(userId,now,guest.id),
    env.DB.prepare(`UPDATE chart_snapshots SET user_id=?,guest_session_id=NULL WHERE guest_session_id=?`).bind(userId,guest.id),
    env.DB.prepare(`UPDATE conversations SET user_id=?,guest_session_id=NULL,updated_at=? WHERE guest_session_id=?`).bind(userId,now,guest.id),
    env.DB.prepare(`UPDATE reports SET user_id=?,guest_session_id=NULL,updated_at=? WHERE guest_session_id=?`).bind(userId,now,guest.id),
    env.DB.prepare(`UPDATE orders SET user_id=?,guest_session_id=NULL,updated_at=? WHERE guest_session_id=?`).bind(userId,now,guest.id),
    env.DB.prepare(`UPDATE entitlements SET user_id=?,guest_session_id=NULL WHERE guest_session_id=?`).bind(userId,guest.id),
    env.DB.prepare(`UPDATE ai_requests SET user_id=?,guest_session_id=NULL,updated_at=? WHERE guest_session_id=?`).bind(userId,now,guest.id),

    env.DB.prepare(`UPDATE wallet_reservations SET subject_type='user',subject_id=?,updated_at=? WHERE subject_type='guest' AND subject_id=?`).bind(userId,now,guest.id),
    env.DB.prepare(`UPDATE wallet_ledger SET subject_type='user',subject_id=? WHERE subject_type='guest' AND subject_id=?`).bind(userId,guest.id),
    env.DB.prepare(`UPDATE quota_reservations SET subject_type='user',subject_id=?,updated_at=? WHERE subject_type='guest' AND subject_id=?`).bind(userId,now,guest.id),

    env.DB.prepare(`INSERT INTO wallet_accounts(subject_type,subject_id,balance,reserved_balance,version,updated_at)
      VALUES('user',?,?,0,0,?)
      ON CONFLICT(subject_type,subject_id) DO UPDATE SET balance=?,reserved_balance=0,version=wallet_accounts.version+1,updated_at=?`)
      .bind(userId,mergedBalance,now,mergedBalance,now),
    env.DB.prepare(`DELETE FROM wallet_accounts WHERE subject_type='guest' AND subject_id=?`).bind(guest.id),

    env.DB.prepare(`INSERT INTO usage_quotas(id,subject_type,subject_id,quota_key,period_key,used_count,reserved_count,limit_count,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?)
      ON CONFLICT(subject_type,subject_id,quota_key,period_key) DO UPDATE SET used_count=?,reserved_count=0,limit_count=?,updated_at=?`)
      .bind(uid("quota"),"user",userId,"ai_chat_free","lifetime",mergedUsed,0,limit,now,mergedUsed,limit,now),
    env.DB.prepare(`DELETE FROM usage_quotas WHERE subject_type='guest' AND subject_id=? AND quota_key='ai_chat_free' AND period_key='lifetime'`).bind(guest.id),

    env.DB.prepare(`UPDATE guest_sessions SET converted_user_id=?,revoked_at=?,revoke_reason='converted_to_user' WHERE id=?`).bind(userId,now,guest.id),
    env.DB.prepare(`UPDATE guest_conversions SET state='COMPLETED',completed_at=?,error_code=NULL WHERE id=?`).bind(now,conversionId),
    env.DB.prepare(`INSERT INTO guest_conversion_events(
      id,guest_conversion_id,event_type,from_state,to_state,metadata_json,created_at
    ) VALUES(?,?,?,?,?,?,?)`).bind(
      uid("gcevt"),conversionId,"conversion_completed","PROCESSING","COMPLETED",
      JSON.stringify({walletMerged:g.wallet.balance,quotaUsedMerged:g.quota.used}),now
    )
  ];
  await env.DB.batch(stmts);
  return {ok:true,replayed:false,conversionId,walletBalance:mergedBalance,freeUsed:mergedUsed,freeLimit:limit};
}


function profilePayload(body){
  const calendar=text(body?.calendar,10)||"양력",y=Number(body?.birth_year??body?.year),m=Number(body?.birth_month??body?.month),d=Number(body?.birth_day??body?.day),unknown=body?.hour_unknown===true||body?.hour_unknown===1;
  const h=unknown?null:Number(body?.birth_hour??body?.hour),mi=unknown?null:Number(body?.birth_minute??body?.minute??0);
  if(!["양력","음력"].includes(calendar))throw new Error("invalid_calendar");
  if(!Number.isInteger(y)||y<1900||y>2100)throw new Error("invalid_birth_year");
  if(!Number.isInteger(m)||m<1||m>12)throw new Error("invalid_birth_month");
  if(!Number.isInteger(d)||d<1||d>31)throw new Error("invalid_birth_day");
  if(!unknown&&(!Number.isInteger(h)||h<0||h>23))throw new Error("invalid_birth_hour");
  if(!unknown&&(!Number.isInteger(mi)||mi<0||mi>59))throw new Error("invalid_birth_minute");
  const lon=body?.longitude==null?null:Number(body.longitude);
  return{label:text(body?.label,40)||null,displayName:text(body?.display_name||body?.name,40)||null,calendar,lunarLeap:body?.lunar_leap_month?1:0,y,m,d,h,mi,hourUnknown:unknown?1:0,gender:text(body?.gender,12)||null,timezone:text(body?.timezone,80)||"Asia/Seoul",dayBoundary:text(body?.day_boundary,8)||"23",trueSolar:body?.true_solar_time?1:0,longitude:Number.isFinite(lon)?lon:null};
}
async function createProfileRow(env,subject,body){
  const p=profilePayload(body),id=uid("profile"),now=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO profiles(id,user_id,guest_session_id,label,display_name,calendar,lunar_leap_month,birth_year,birth_month,birth_day,birth_hour,birth_minute,hour_unknown,gender,timezone,day_boundary,true_solar_time,longitude,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,subject.type==="user"?subject.id:null,subject.type==="guest"?subject.id:null,p.label,p.displayName,p.calendar,p.lunarLeap,p.y,p.m,p.d,p.h,p.mi,p.hourUnknown,p.gender,p.timezone,p.dayBoundary,p.trueSolar,p.longitude,now,now).run();
  return{id,label:p.label,display_name:p.displayName,calendar:p.calendar,birth_year:p.y,birth_month:p.m,birth_day:p.d,birth_hour:p.h,birth_minute:p.mi,hour_unknown:p.hourUnknown,created_at:now,updated_at:now};
}
async function createConversationRow(env,subject,body){
  const chartId=text(body?.chart_snapshot_id||body?.chartSnapshotId,160)||null;
  if(chartId&&!await ownedChartSnapshot(env,subject,chartId))throw new Error("chart_snapshot_not_found");
  const id=uid("conv"),now=new Date().toISOString(),title=text(body?.title,120)||null;
  await env.DB.prepare(`INSERT INTO conversations(id,user_id,guest_session_id,chart_snapshot_id,title,created_at,updated_at) VALUES(?,?,?,?,?,?,?)`).bind(id,subject.type==="user"?subject.id:null,subject.type==="guest"?subject.id:null,chartId,title,now,now).run();
  return{id,title,chart_snapshot_id:chartId,created_at:now,updated_at:now};
}
async function listConversationMessages(env,subject,conversationId){
  if(!await ownedConversation(env,subject,conversationId))return null;
  const rows=await env.DB.prepare(`SELECT id,role,content,request_id,created_at FROM messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 200`).bind(conversationId).all();
  return rows?.results||[];
}
async function appendUserMessage(env,subject,conversationId,body){
  if(!await ownedConversation(env,subject,conversationId))throw new Error("conversation_not_found");
  const content=String(body?.content||"").trim();if(!content)throw new Error("message_required");if(content.length>12000)throw new Error("message_too_long");
  const req=text(body?.request_id||body?.requestId,200)||null,now=new Date().toISOString();
  if(req){const old=await env.DB.prepare(`SELECT id,role,content,request_id,created_at FROM messages WHERE conversation_id=? AND request_id=? AND role='user' LIMIT 1`).bind(conversationId,req).first();if(old)return{...old,replayed:true};}
  const id=uid("msg");
  await env.DB.batch([env.DB.prepare(`INSERT INTO messages(id,conversation_id,role,content,request_id,created_at) VALUES(?,?,?,?,?,?)`).bind(id,conversationId,"user",content,req,now),env.DB.prepare(`UPDATE conversations SET updated_at=? WHERE id=?`).bind(now,conversationId)]);
  return{id,role:"user",content,request_id:req,created_at:now,replayed:false};
}


function loginProviderEnabled(env,provider){
  const key="LOGIN_"+String(provider||"").toUpperCase()+"_ENABLED";
  return env[key]==="true";
}

async function createLoginState(env,provider,guestSessionId,redirectPath){
  const raw=randomToken("lst_"),id=uid("login"),now=new Date(),exp=new Date(now.getTime()+10*60*1000);
  const path=String(redirectPath||"/");
  if(!path.startsWith("/")||path.startsWith("//"))throw new Error("invalid_redirect_path");
  await env.DB.prepare(`INSERT INTO auth_login_states(
    id,provider,state_hash,guest_session_id,redirect_path,expires_at,created_at
  ) VALUES(?,?,?,?,?,?,?)`).bind(
    id,provider,await sha256(raw),guestSessionId||null,path,exp.toISOString(),now.toISOString()
  ).run();
  return {state:raw,expiresAt:exp.toISOString(),redirectPath:path};
}

async function revokeCurrentUserSession(env,request){
  const h=(request.headers.get("Authorization")||"").trim();
  const m=h.match(/^Bearer\s+(usr_[A-Za-z0-9._:-]{32,})$/i);
  if(!m)return false;
  const now=new Date().toISOString();
  const r=await env.DB.prepare(`UPDATE user_sessions
    SET revoked_at=?,revoke_reason='logout'
    WHERE token_hash=? AND revoked_at IS NULL`).bind(now,await sha256(m[1])).run();
  return Number(r?.meta?.changes||0)===1;
}


function stagingReadiness(env){
  const missing=[],unsafe=[];
  if(String(env.ENVIRONMENT||"")!=="staging")missing.push("ENVIRONMENT");
  if(!dbReady(env))missing.push("DB");
  if(!env.OPENAI_API_KEY)missing.push("OPENAI_API_KEY");
  if(String(env.AI_CHAT_ENABLED||"")!=="true")missing.push("AI_CHAT_ENABLED");
  for(const k of ["NEW_PAYMENTS_ENABLED","SERVER_WALLET_ENABLED","SERVER_FREE_QUOTA_ENABLED"]){
    if(String(env[k]||"false")==="true")unsafe.push(k);
  }
  return{ready:missing.length===0&&unsafe.length===0,environment:String(env.ENVIRONMENT||"unknown"),
    databaseReady:dbReady(env),aiKeyPresent:!!env.OPENAI_API_KEY,
    paymentsDisabled:String(env.NEW_PAYMENTS_ENABLED||"false")!=="true",
    walletAccountingDisabled:String(env.SERVER_WALLET_ENABLED||"false")!=="true",
    freeQuotaAccountingDisabled:String(env.SERVER_FREE_QUOTA_ENABLED||"false")!=="true",
    missing,unsafe};
}


function authorityMode(env){
  const v=String(env.CLIENT_AUTHORITY_MODE||"SHADOW").toUpperCase();
  return ["LEGACY","SHADOW","SERVER"].includes(v)?v:"SHADOW";
}

function authorityCapabilities(env){
  return {
    mode:authorityMode(env),
    serverUsageReadable:dbReady(env),
    serverWalletEnabled:String(env.SERVER_WALLET_ENABLED||"false")==="true",
    serverFreeQuotaEnabled:String(env.SERVER_FREE_QUOTA_ENABLED||"false")==="true",
    paymentsEnabled:String(env.NEW_PAYMENTS_ENABLED||"false")==="true"
  };
}


async function hmacHex(secret,value){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(String(secret)),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(String(value)));
  return[...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function safeHexEq(a,b){const x=String(a||"").toLowerCase(),y=String(b||"").toLowerCase();if(!x||x.length!==y.length)return false;let d=0;for(let i=0;i<x.length;i++)d|=x.charCodeAt(i)^y.charCodeAt(i);return d===0}
async function verifyWebhookRequest(env,provider,request,rawBody){
  if(provider==="mock"){
    const secret=env.PG_TEST_WEBHOOK_SECRET;
    if(!secret)return{ok:false,reason:"test_webhook_secret_missing"};
    const sig=request.headers.get("X-Guiin-Test-Signature")||"",expected=await hmacHex(secret,rawBody),ok=safeHexEq(sig,expected);
    return{ok,reason:ok?null:"signature_invalid",eventId:request.headers.get("X-Guiin-Event-Id")||null,version:"hmac-sha256-test"};
  }
  if(provider==="inicis")return{ok:false,reason:"inicis_signature_adapter_not_configured",eventId:null,version:"pending-provider-spec"};
  return{ok:false,reason:"unsupported_pg_provider",eventId:null,version:null};
}

export default{
  async fetch(request,env){
    const reqId=requestId(),url=new URL(request.url),originHeader=request.headers.get("Origin")||"",allowed=pickOrigin(request);
    if(originHeader&&!allowed)return json({error:"origin_not_allowed",requestId:reqId},403,"https://gwiinsaju.com");
    const o=allowed||"https://gwiinsaju.com";
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...securityHeaders(),...corsHeaders(o)}});

    const serviceStates=await readServiceStates(env);
    const runtime=runtimeGate(serviceStates,url.pathname,request.method);
    if(!runtime.allowed){
      await recordIncident(env,{type:runtime.error,severity:"warning",requestId:reqId,details:{path:url.pathname,method:request.method}});
      return json({error:runtime.error,requestId:reqId},runtime.status,o);
    }

    if(!methodAllowed(url.pathname,request.method)){
      await recordSecurityEvent(env,{eventType:"method_not_allowed",requestId:reqId,route:url.pathname,request,metadata:{method:request.method}});
      return json({error:"method_not_allowed",requestId:reqId},405,o,{"Allow":"GET, POST, DELETE, OPTIONS"});
    }

    const contentLength=Number(request.headers.get("Content-Length")||0);
    if(contentLength>requestBodyLimit(url.pathname)){
      await recordSecurityEvent(env,{eventType:"request_too_large",requestId:reqId,route:url.pathname,request,metadata:{contentLength}});
      return json({error:"request_too_large",requestId:reqId},413,o);
    }

    if(needsJson(url.pathname,request.method)){
      const ct=(request.headers.get("Content-Type")||"").toLowerCase();
      if(!ct.startsWith("application/json")){
        return json({error:"content_type_required",requestId:reqId},415,o);
      }
    }

    if(request.method==="GET"&&(url.pathname==="/"||url.pathname==="/health")){
      const gate=paymentLaunchGate(env);return json({ok:true,service:"guiin-saju-api",version:WORKER_VERSION,answerSchemaVersion:ANSWER_SCHEMA_VERSION,chatEnabled:env.AI_CHAT_ENABLED!=="false",databaseReady:dbReady(env),serverAccountingReady:false,paymentsEnabled:false,persistencePreview:true,accountingPreview:true,paymentFoundationPreview:true,paymentRecoveryPreview:true,securityHardeningPreview:true,securityRecoveryPreview:true,paymentLaunchReady:gate.ready,paymentLaunchFailed:gate.failed,runtimeMode:serviceStates.MAINTENANCE_MODE==="true"?"maintenance":serviceStates.READ_ONLY_MODE==="true"?"read_only":"normal",launchGatePreview:true},200,o);
    }

    if(request.method==="POST"&&url.pathname==="/api/chat"){
      let aiRequestId=null;
      try{
        if(env.AI_CHAT_ENABLED==="false")return json({error:"chat_temporarily_disabled",requestId:reqId},503,o);
        if(!env.OPENAI_API_KEY)return json({error:"server_configuration_error",requestId:reqId},500,o);

        let b;try{b=await request.json()}catch(_){return json({error:"invalid_json",requestId:reqId},400,o)}
        const cid=safeClientRequestId(request.headers.get("X-Idempotency-Key")||b.requestId);
        const q=extractQuestion(b.message),facts=normalizeChart(b.chart,b.name);
        if(!q)return json({error:"question_required",requestId:reqId},400,o);
        if(!facts)return json({error:"valid_chart_required",requestId:reqId},400,o);

        // 서버 DB/세션이 아직 준비되지 않은 동안 기존 AI 경로는 그대로 유지한다.
        if(!dbReady(env)){
          if(cid){const cached=await idemGet(env,cid);if(cached?.ok&&cached?.answer)return json({...cached,replayed:true},200,o)}
          const result=await generateAnswer(env,facts,cleanHistory(b.history),q,reqId);
          const payload={ok:true,requestId:reqId,clientRequestId:cid,answer:result.answer,model:result.model,quality:result.quality,schemaVersion:facts.schema_version,answerSchemaVersion:ANSWER_SCHEMA_VERSION,chargeSafe:true,serverCharged:false,durableResultStored:false};
          await idemPut(env,cid,payload);
          return json(payload,200,o);
        }

        const subject=await resolveSubject(env,request);
        if(!subject){
          if(securityEnforced(env)){
            await recordSecurityEvent(env,{eventType:"chat_session_required",requestId:reqId,route:url.pathname,request});
            return json({error:"session_required",requestId:reqId},401,o);
          }
          const result=await generateAnswer(env,facts,cleanHistory(b.history),q,reqId);
          return json({ok:true,requestId:reqId,clientRequestId:cid,answer:result.answer,model:result.model,quality:result.quality,schemaVersion:facts.schema_version,answerSchemaVersion:ANSWER_SCHEMA_VERSION,chargeSafe:true,serverCharged:false,durableResultStored:false,sessionPersistenceSkipped:true},200,o);
        }

        const chatRl=await rateLimitCheck(env,request,url.pathname,subject);
        if(!chatRl.allowed){
          await recordSecurityEvent(env,{eventType:"rate_limited",requestId:reqId,route:url.pathname,request,subject});
          return json({error:"rate_limited",requestId:reqId},429,o,{"Retry-After":String(chatRl.retryAfter||60)});
        }

        if(!cid)return json({error:"idempotency_key_required",requestId:reqId},400,o);

        const replay=await findAiReplay(env,cid);
        if(replay?.kind==="replay"){
          return json({ok:true,requestId:replay.result.request_id||reqId,clientRequestId:cid,answer:replay.result.response_text,replayed:true,durableResultStored:true,serverCharged:false},200,o);
        }
        if(replay?.kind==="in_progress"){
          return json({error:"request_in_progress",requestId:reqId,clientRequestId:cid},409,o);
        }
        if(replay?.kind==="blocked"){
          return json({error:"request_not_retryable",requestId:reqId,clientRequestId:cid},409,o);
        }

        const conversationId=text(b.conversationId||b.conversation_id,120)||null;
        const chartSnapshotId=text(b.chartSnapshotId||b.chart_snapshot_id,120)||null;

        if(conversationId){
          const conv=await ownedConversation(env,subject,conversationId);
          if(!conv)return json({error:"conversation_not_found",requestId:reqId},404,o);
        }
        if(chartSnapshotId){
          const snap=await ownedChartSnapshot(env,subject,chartSnapshotId);
          if(!snap)return json({error:"chart_snapshot_not_found",requestId:reqId},404,o);
        }

        const charge=await reserveAccounting(env,subject,reqId,cid);
        if(charge.blocked)return json({error:"no_quota_or_wallet",requestId:reqId,clientRequestId:cid},402,o);

        aiRequestId=await startAiRequest(env,subject,{
          idem:cid,conversationId,chartSnapshotId,
          modelId:(env.CHAT_MODEL||"gpt-4o-mini").trim(),requestId:reqId
        });
        if(charge.source!=="none"){
          await env.DB.prepare(`UPDATE ai_requests SET charge_source=?,quota_reservation_id=?,wallet_reservation_id=?,updated_at=? WHERE id=?`).bind(
            charge.source,charge.source==="free_quota"?charge.reservationId:null,
            charge.source==="wallet"?charge.reservationId:null,new Date().toISOString(),aiRequestId
          ).run();
        }

        let result;
        try{result=await generateAnswer(env,facts,cleanHistory(b.history),q,reqId)}
        catch(e){await releaseAccounting(env,subject,charge);throw e}

        const stored=await storeAiSuccess(env,{
          aiRequestId,requestId:reqId,answer:result.answer,model:result.model,
          quality:result.quality,conversationId,chartSnapshotId,userQuestion:q
        });

        let finalized={action:"none",succeeded:true};
        if(charge.source!=="none"){
          finalized=await finalizeAccounting(env,subject,charge,reqId);
          if(!finalized.succeeded)return json({error:"accounting_finalize_failed",requestId:reqId,clientRequestId:cid,durableResultStored:true,serverCharged:false,recoveryRequired:true},503,o);
          await env.DB.prepare(`UPDATE ai_requests SET state='SPENT',updated_at=? WHERE id=? AND state='STORED'`).bind(new Date().toISOString(),aiRequestId).run();
        }

        return json({
          ok:true,requestId:reqId,clientRequestId:cid,answer:result.answer,model:result.model,
          quality:result.quality,schemaVersion:facts.schema_version,answerSchemaVersion:ANSWER_SCHEMA_VERSION,
          durableResultStored:stored.state==="STORED",chargeSafe:true,
          serverCharged:charge.source!=="none"&&finalized.succeeded,chargeSource:charge.source,
          serverAccountingReady:accountingFlags(env).free||accountingFlags(env).wallet
        },200,o);
      }catch(e){
        const code=e?.message==="empty_ai_response"?"empty_ai_response":e?.message==="ai_request_failed"?"ai_request_failed":"internal_server_error";
        if(dbReady(env)&&aiRequestId)await markAiFailure(env,aiRequestId,reqId,code,true);
        return json({error:code,requestId:reqId},code==="internal_server_error"?500:502,o);
      }
    }

    if(!dbReady(env))return json({ok:false,error:"server_runtime_unavailable",requestId:reqId},503,o);

    if(request.method==="POST"&&url.pathname==="/api/auth/login/start"){
      if(!dbReady(env))return json({ok:false,error:"database_unavailable",requestId:reqId},503,o);
      let b;try{b=await request.json()}catch(_){return json({ok:false,error:"invalid_json",requestId:reqId},400,o)}
      const provider=text(b?.provider,30).toLowerCase();
      if(!["kakao","naver","google","apple","email"].includes(provider))
        return json({ok:false,error:"unsupported_provider",requestId:reqId},400,o);
      if(!loginProviderEnabled(env,provider))
        return json({ok:false,error:"provider_not_configured",provider,requestId:reqId},503,o);
      const g=await guestSession(env,request);
      try{
        const login=await createLoginState(env,provider,g?.id||null,b?.redirect_path||"/");
        return json({ok:true,requestId:reqId,provider,loginState:login.state,expiresAt:login.expiresAt,redirectPath:login.redirectPath},201,o);
      }catch(e){
        return json({ok:false,error:e?.message||"login_start_failed",requestId:reqId},400,o);
      }
    }

    if(request.method==="POST"&&url.pathname==="/api/auth/logout"){
      if(!dbReady(env))return json({ok:false,error:"database_unavailable",requestId:reqId},503,o);
      const done=await revokeCurrentUserSession(env,request);
      if(!done)return json({ok:false,error:"user_session_required",requestId:reqId},401,o);
      return json({ok:true,requestId:reqId,loggedOut:true},200,o);
    }

    const pgHook=url.pathname.match(/^\/api\/webhooks\/(mock|inicis)$/);
    if(request.method==="POST"&&pgHook){
      const provider=pgHook[1],raw=await request.text(),v=await verifyWebhookRequest(env,provider,request,raw);
      if(!v.ok)return json({ok:false,error:v.reason,requestId:reqId},401,o);
      if(!dbReady(env))return json({ok:false,error:"database_unavailable",requestId:reqId},503,o);
      const eventId=v.eventId||safeClientRequestId(request.headers.get("X-Idempotency-Key"))||uid("wh");
      const old=await env.DB.prepare(`SELECT id,state FROM webhook_events WHERE provider=? AND provider_event_id=? LIMIT 1`).bind(provider,eventId).first();
      if(old)return json({ok:true,replayed:true,requestId:reqId,eventId},200,o);
      await env.DB.prepare(`INSERT INTO webhook_events(id,provider,provider_event_id,event_type,payload_hash,state,retry_count,received_at)
        VALUES(?,?,?,?,?,?,0,?)`).bind(uid("wh"),provider,eventId,"PAYMENT_TEST",await sha256(raw),"RECEIVED",new Date().toISOString()).run();
      return json({ok:true,replayed:false,requestId:reqId,eventId},202,o);
    }

    if(request.method==="GET"&&url.pathname==="/api/capabilities"){
      return json({ok:true,requestId:reqId,version:WORKER_VERSION,authority:authorityCapabilities(env)},200,o);
    }

    if(request.method==="GET"&&url.pathname==="/api/staging/readiness"){
      const ready=stagingReadiness(env);
      return json({ok:true,requestId:reqId,version:WORKER_VERSION,...ready},200,o);
    }

    if(request.method==="POST"&&url.pathname==="/api/session/guest"){
      try{return json({ok:true,requestId:reqId,...await createGuest(env)},201,o)}catch(_){return json({ok:false,error:"guest_create_failed",requestId:reqId},500,o)}
    }

    const s=await resolveSubject(env,request);
    if(!s){
      await recordSecurityEvent(env,{eventType:"session_required",requestId:reqId,route:url.pathname,request});
      return json({ok:false,error:"session_required",requestId:reqId},401,o);
    }

    const rl=await rateLimitCheck(env,request,url.pathname,s);
    if(!rl.allowed){
      await recordSecurityEvent(env,{eventType:"rate_limited",requestId:reqId,route:url.pathname,request,subject:s});
      return json({ok:false,error:"rate_limited",requestId:reqId},429,o,{"Retry-After":String(rl.retryAfter||60)});
    }

    if(url.pathname.startsWith("/api/admin/")){
      const ag=await adminGate(env,s);
      await recordSecurityEvent(env,{eventType:"admin_route_attempt",severity:ag.allowed?"warning":"critical",requestId:reqId,route:url.pathname,request,subject:s,metadata:{allowed:ag.allowed,reason:ag.reason||null}});
      if(!ag.allowed)return json({ok:false,error:ag.reason||"admin_access_denied",requestId:reqId},403,o);
      return json({ok:false,error:"admin_route_not_implemented",requestId:reqId},404,o);
    }

    if(request.method==="POST"&&url.pathname==="/api/auth/convert-guest"){
      if(s.type!=="user")return json({ok:false,error:"user_login_required",requestId:reqId},401,o);
      const idem=safeClientRequestId(request.headers.get("X-Idempotency-Key"));
      if(!idem)return json({ok:false,error:"idempotency_key_required",requestId:reqId},400,o);
      let b;try{b=await request.json()}catch(_){return json({ok:false,error:"invalid_json",requestId:reqId},400,o)}
      try{
        const result=await convertGuestToUser(env,{
          guestToken:b?.guestToken,userId:s.id,idempotencyKey:idem,requestId:reqId
        });
        return json({...result,requestId:reqId},200,o);
      }catch(e){
        const code=String(e?.message||"conversion_failed");
        const status=/in_progress|busy/.test(code)?409:/not_found/.test(code)?404:/other_user/.test(code)?403:400;
        return json({ok:false,error:code,requestId:reqId},status,o);
      }
    }

    if(request.method==="GET"&&url.pathname==="/api/auth/status")return json({ok:true,requestId:reqId,subject:{type:s.type,id:s.id}},200,o);
    if(request.method==="GET"&&url.pathname==="/api/me/usage")return json({ok:true,requestId:reqId,subject:{type:s.type,id:s.id},usage:await usageFor(env,s)},200,o);

    if(request.method==="GET"&&url.pathname==="/api/profiles"){
      const col=s.type==="user"?"user_id":"guest_session_id";
      const rows=await env.DB.prepare(`SELECT * FROM profiles WHERE ${col}=? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 20`).bind(s.id).all();
      return json({ok:true,requestId:reqId,profiles:rows?.results||[]},200,o);
    }

    if(request.method==="POST"&&url.pathname==="/api/profiles"){
      let b;try{b=await request.json()}catch(_){return json({ok:false,error:"invalid_json",requestId:reqId},400,o)}
      try{return json({ok:true,requestId:reqId,profile:await createProfileRow(env,s,b)},201,o)}catch(e){return json({ok:false,error:e?.message||"profile_create_failed",requestId:reqId},400,o)}
    }
    const profileDelete=url.pathname.match(/^\/api\/profiles\/([^/]+)$/);
    if(request.method==="DELETE"&&profileDelete){const col=s.type==="user"?"user_id":"guest_session_id",now=new Date().toISOString();const r=await env.DB.prepare(`UPDATE profiles SET deleted_at=?,updated_at=? WHERE id=? AND ${col}=? AND deleted_at IS NULL`).bind(now,now,profileDelete[1],s.id).run();if(Number(r?.meta?.changes||0)!==1)return json({ok:false,error:"not_found",requestId:reqId},404,o);return json({ok:true,requestId:reqId,deleted:true},200,o);}

    if(request.method==="POST"&&url.pathname==="/api/chart-snapshots"){
      let b;try{b=await request.json()}catch(_){return json({ok:false,error:"invalid_json",requestId:reqId},400,o)}
      try{
        const saved=await createChartSnapshot(env,s,b);
        return json({ok:true,requestId:reqId,...saved},201,o);
      }catch(e){
        return json({ok:false,error:e?.message||"chart_snapshot_save_failed",requestId:reqId},400,o);
      }
    }

    const chartMatch=url.pathname.match(/^\/api\/chart-snapshots\/([^/]+)$/);
    if(request.method==="GET"&&chartMatch){
      const row=await getOwnedChartSnapshot(env,s,chartMatch[1]);
      if(!row)return json({ok:false,error:"not_found",requestId:reqId},404,o);
      return json({ok:true,requestId:reqId,chartSnapshot:{
        ...row,
        chart_facts:JSON.parse(row.chart_facts_json||"null"),
        uncertainty:JSON.parse(row.uncertainty_json||"null")
      }},200,o);
    }

    if(request.method==="GET"&&url.pathname==="/api/conversations"){
      const col=s.type==="user"?"user_id":"guest_session_id";
      const rows=await env.DB.prepare(`SELECT id,title,created_at,updated_at FROM conversations WHERE ${col}=? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 50`).bind(s.id).all();
      return json({ok:true,requestId:reqId,conversations:rows?.results||[]},200,o);
    }

    if(request.method==="POST"&&url.pathname==="/api/conversations"){
      let b;try{b=await request.json()}catch(_){return json({ok:false,error:"invalid_json",requestId:reqId},400,o)}
      try{return json({ok:true,requestId:reqId,conversation:await createConversationRow(env,s,b)},201,o)}catch(e){return json({ok:false,error:e?.message||"conversation_create_failed",requestId:reqId},/not_found/.test(String(e?.message))?404:400,o)}
    }
    const convMessages=url.pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
    if(request.method==="GET"&&convMessages){const messages=await listConversationMessages(env,s,convMessages[1]);if(messages===null)return json({ok:false,error:"not_found",requestId:reqId},404,o);return json({ok:true,requestId:reqId,messages},200,o);}
    if(request.method==="POST"&&convMessages){let b;try{b=await request.json()}catch(_){return json({ok:false,error:"invalid_json",requestId:reqId},400,o)}try{const message=await appendUserMessage(env,s,convMessages[1],b);return json({ok:true,requestId:reqId,message},message.replayed?200:201,o)}catch(e){return json({ok:false,error:e?.message||"message_create_failed",requestId:reqId},/not_found/.test(String(e?.message))?404:400,o)}}
    const convDelete=url.pathname.match(/^\/api\/conversations\/([^/]+)$/);
    if(request.method==="DELETE"&&convDelete){const col=s.type==="user"?"user_id":"guest_session_id",now=new Date().toISOString();const r=await env.DB.prepare(`UPDATE conversations SET deleted_at=?,updated_at=? WHERE id=? AND ${col}=? AND deleted_at IS NULL`).bind(now,now,convDelete[1],s.id).run();if(Number(r?.meta?.changes||0)!==1)return json({ok:false,error:"not_found",requestId:reqId},404,o);return json({ok:true,requestId:reqId,deleted:true},200,o);}

    if(request.method==="POST"&&url.pathname==="/api/orders"){
      if(!paymentEnabled(env))return json({ok:false,error:"payments_disabled",requestId:reqId},503,o);
      const idem=text(request.headers.get("X-Idempotency-Key"),200);
      if(idem.length<12)return json({ok:false,error:"idempotency_key_required",requestId:reqId},400,o);
      let b;try{b=await request.json()}catch(_){return json({ok:false,error:"invalid_json",requestId:reqId},400,o)}
      try{
        const order=await createOrder(env,s,b,idem);
        return json({ok:true,requestId:reqId,order},201,o);
      }catch(e){
        return json({ok:false,error:e?.message||"order_create_failed",requestId:reqId},400,o);
      }
    }

    const orderMatch=url.pathname.match(/^\/api\/orders\/([^/]+)$/);
    if(request.method==="GET"&&orderMatch){
      const order=await ownedOrder(env,s,orderMatch[1]);
      if(!order)return json({ok:false,error:"not_found",requestId:reqId},404,o);
      return json({ok:true,requestId:reqId,order:{
        id:order.id,state:order.state,amount:Number(order.amount),currency:order.currency,
        product_code:order.product_code,created_at:order.created_at,updated_at:order.updated_at
      }},200,o);
    }

    if(request.method==="GET"&&url.pathname==="/api/me/purchases"){
      const snap=await purchaseRestoreSnapshot(env,s);
      return json({ok:true,requestId:reqId,purchases:{
        orders:snap.orders.map(x=>({
          id:x.id,state:x.state,amount:Number(x.amount),currency:x.currency,
          product:JSON.parse(x.product_snapshot_json||"{}"),
          created_at:x.created_at,updated_at:x.updated_at
        })),
        entitlements:snap.entitlements,
        wallet_ledger:snap.walletLedger
      }},200,o);
    }

    if(request.method==="GET"&&url.pathname==="/api/me/restore-summary"){
      const snap=await purchaseRestoreSnapshot(env,s);
      const active=snap.entitlements.filter(x=>x.state==="ACTIVE");
      const purchaseCredits=snap.walletLedger.filter(x=>x.kind==="PURCHASE"&&Number(x.delta)>0)
        .reduce((a,x)=>a+Number(x.delta||0),0);
      return json({ok:true,requestId:reqId,restore:{
        fulfilledOrders:snap.orders.filter(x=>x.state==="FULFILLED").length,
        activeEntitlements:active,
        walletPurchaseCredits:purchaseCredits
      }},200,o);
    }

    return json({ok:false,error:"not_found",requestId:reqId},404,o);
  }
};
