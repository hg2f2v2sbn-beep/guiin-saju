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
const WORKER_VERSION="4.3-accounting-preview";
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
function json(data,status,o){return new Response(JSON.stringify(data),{status,headers:{
  "Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...corsHeaders(o)
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
  const row=await env.DB.prepare(`SELECT s.id,s.user_id,s.expires_at,s.revoked_at,u.status FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? LIMIT 1`).bind(await sha256(m[1])).first();
  if(!row||row.revoked_at||row.status!=="active"||Date.parse(row.expires_at)<=Date.now())return null;
  return row;
}
async function guestSession(env,req){
  if(!dbReady(env))return null;
  const t=(req.headers.get("X-Guiin-Guest")||"").trim();
  if(!/^gst_[A-Za-z0-9._:-]{32,}$/.test(t))return null;
  const row=await env.DB.prepare(`SELECT id,expires_at,converted_user_id FROM guest_sessions WHERE token_hash=? LIMIT 1`).bind(await sha256(t)).first();
  if(!row||Date.parse(row.expires_at)<=Date.now())return null;
  return row;
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

export default{
  async fetch(request,env){
    const reqId=requestId(),url=new URL(request.url),originHeader=request.headers.get("Origin")||"",allowed=pickOrigin(request);
    if(originHeader&&!allowed)return json({error:"origin_not_allowed",requestId:reqId},403,"https://gwiinsaju.com");
    const o=allowed||"https://gwiinsaju.com";
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(o)});

    if(request.method==="GET"&&(url.pathname==="/"||url.pathname==="/health")){
      return json({ok:true,service:"guiin-saju-api",version:WORKER_VERSION,answerSchemaVersion:ANSWER_SCHEMA_VERSION,chatEnabled:env.AI_CHAT_ENABLED!=="false",databaseReady:dbReady(env),serverAccountingReady:false,paymentsEnabled:false,persistencePreview:true,accountingPreview:true},200,o);
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
          // DB가 생겼더라도 기존 사용자의 AI를 갑자기 막지 않는 호환 경로.
          const result=await generateAnswer(env,facts,cleanHistory(b.history),q,reqId);
          return json({ok:true,requestId:reqId,clientRequestId:cid,answer:result.answer,model:result.model,quality:result.quality,schemaVersion:facts.schema_version,answerSchemaVersion:ANSWER_SCHEMA_VERSION,chargeSafe:true,serverCharged:false,durableResultStored:false,sessionPersistenceSkipped:true},200,o);
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

    if(request.method==="POST"&&url.pathname==="/api/session/guest"){
      try{return json({ok:true,requestId:reqId,...await createGuest(env)},201,o)}catch(_){return json({ok:false,error:"guest_create_failed",requestId:reqId},500,o)}
    }

    const s=await resolveSubject(env,request);
    if(!s)return json({ok:false,error:"session_required",requestId:reqId},401,o);

    if(request.method==="GET"&&url.pathname==="/api/auth/status")return json({ok:true,requestId:reqId,subject:{type:s.type,id:s.id}},200,o);
    if(request.method==="GET"&&url.pathname==="/api/me/usage")return json({ok:true,requestId:reqId,subject:{type:s.type,id:s.id},usage:await usageFor(env,s)},200,o);

    if(request.method==="GET"&&url.pathname==="/api/profiles"){
      const col=s.type==="user"?"user_id":"guest_session_id";
      const rows=await env.DB.prepare(`SELECT * FROM profiles WHERE ${col}=? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 20`).bind(s.id).all();
      return json({ok:true,requestId:reqId,profiles:rows?.results||[]},200,o);
    }

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

    return json({ok:false,error:"not_found",requestId:reqId},404,o);
  }
};
