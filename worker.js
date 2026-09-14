const ALLOWED_ORIGINS = new Set([
  "https://gwiinsaju.com",
  "https://www.gwiinsaju.com",
  "https://hg2f2v2sbn-beep.github.io"
]);

const WORKER_VERSION = "2.2-ai-counsel";
const ANSWER_SCHEMA_VERSION = "2.2.0";

const SYSTEM_PROMPT = `
당신은 '귀인사주'의 AI 사주 상담가입니다.

[가장 중요한 원칙]
- chart_facts와 person_model은 귀인사주 계산/해석 엔진이 이미 만든 근거입니다.
- 명식을 다시 계산하지 마세요.
- 전달되지 않은 십성·신살·합충형파해·대운·세운·월운·일운을 새로 만들지 마세요.
- 사용자가 말하지 않은 과거 사건·직업·가족사·연애사를 실제 있었던 일처럼 지어내지 마세요.
- 미래를 확정 사건으로 예언하지 말고 경향·가능성·활용법으로 설명하세요.
- 질병·임신·사망·사고·이혼·파산·합격·투자수익 등 중요한 결과를 확정하지 마세요.
- 의료·법률·투자 판단을 사주로 대신하지 마세요.

[근거 우선순위]
1. 일간 + 월주/월지
2. 원국 전체 + 십성
3. 지장간/통근/합충형파해 등 관계 신호
4. 현재 대운 → 세운 → 월운 → 일운
5. 오행 분포
6. 신살은 마지막 보조 근거

[반드시 구분]
- element_distribution은 오행 "분포"이지 곧바로 실제 강약·용신이 아닙니다.
- element_strength가 null이면 강약을 확정하지 마세요.
- 출생시간이 없으면 시주를 추정하지 마세요.
- uncertainty에 후보/범위가 있으면 하나로 확정하지 마세요.
- 합·충·형·파·해 하나만으로 사건을 확정하지 마세요.
- 신살 하나로 성격이나 운명을 결론내리지 마세요.

[2세대 상담 방식]
답변을 쓰기 전에 내부적으로 다음 순서로 검토한 뒤 최종 답변만 출력하세요.
1. 질문이 무엇을 묻는지 한 문장으로 정리
2. 질문에 직접 관련된 계산 근거 2~4개 선택
3. 서로 반대되는 근거가 있으면 둘 다 살리고 상황별 차이를 설명
4. 초안 작성
5. 일반론·반복·근거 없는 단정·과장 여부 자체 점검
6. 문제가 있으면 고친 최종본만 출력

[답변 품질]
- 첫 문단에서 질문에 바로 답하세요.
- 가능하면 서로 다른 근거 2개 이상을 연결하세요.
- 명리 용어를 쓰면 바로 쉬운 말로 풀어주세요.
- 장점 + 과해질 때의 약점 + 현실적인 조정법을 균형 있게 주세요.
- 같은 조언을 다른 말로 반복하지 마세요.
- chart_facts에서 확인할 수 없는 내용은 "이 정보만으로는 확정하기 어렵다"고 말하세요.
- 사용자가 묻지 않은 주제로 길게 새지 마세요.
- 숫자·개수·연도는 chart_facts에 있거나 서버가 제공한 날짜일 때만 사용하세요.

[문체]
- 한국어로 자연스럽고 현실적으로 말하세요.
- 실제 이름이 있으면 필요한 지점에서만 이름+님으로 부르세요.
- 사용자님·고객님·내담자님·회원님·당신 같은 호칭은 피하세요.
- 모바일에서 읽기 좋은 짧은 문단으로 작성하세요.
- ###, **, __ 같은 마크다운 장식을 사용하지 마세요.
`;

function requestId() {
  try { if (globalThis.crypto?.randomUUID) return crypto.randomUUID(); } catch (_) {}
  return "req_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

function safeClientRequestId(v) {
  const s = typeof v === "string" ? v.trim() : "";
  return /^[A-Za-z0-9._:-]{12,180}$/.test(s) ? s : null;
}

function pickOrigin(request) {
  const origin = request.headers.get("Origin") || "";
  return ALLOWED_ORIGINS.has(origin) ? origin : "";
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, X-Idempotency-Key",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Origin": origin || "https://gwiinsaju.com",
    "Vary": "Origin"
  };
}

function json(data, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...corsHeaders(origin),
      ...extraHeaders
    }
  });
}

function plain(v) {
  if (v == null) return v;
  try { return JSON.parse(JSON.stringify(v)); }
  catch (_) { return null; }
}

function text(v, max = 120) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function hasLegacyPillars(chart) {
  return chart && ["year","month","day"].every(
    key => typeof chart[key] === "string" && chart[key].trim()
  );
}

function hasV2Pillars(chart) {
  return chart?.pillars &&
    ["year","month","day"].every(
      key => typeof chart.pillars[key] === "string" && chart.pillars[key].trim()
    );
}

function validChart(chart) {
  return !!chart && typeof chart === "object" && (hasLegacyPillars(chart) || hasV2Pillars(chart));
}

function normalizeChart(chart, bodyName) {
  if (!validChart(chart)) return null;

  if (hasV2Pillars(chart)) {
    return {
      schema_version: text(chart.schema_version, 30) || "2.0.0",
      calculation_rule_version: text(chart.calculation_rule_version, 60) || null,
      calculation_engine_version: text(chart.calculation_engine_version, 60) || null,
      name: text(bodyName || chart.name, 40) || null,
      gender: text(chart.gender, 12) || null,
      pillars: {
        year: text(chart.pillars.year, 12),
        month: text(chart.pillars.month, 12),
        day: text(chart.pillars.day, 12),
        hour: text(chart.pillars.hour, 20) || null
      },
      day_master: plain(chart.day_master),
      ten_gods: plain(chart.ten_gods),
      hidden_stems: plain(chart.hidden_stems),
      element_distribution: plain(chart.element_distribution),
      element_strength: chart.element_strength == null ? null : plain(chart.element_strength),
      relations: plain(chart.relations),
      stars: plain(chart.stars),
      twelve_stages: plain(chart.twelve_stages),
      foundational_extras: plain(chart.foundational_extras),
      daeun: plain(chart.daeun),
      current_daeun: plain(chart.current_daeun),
      current_seun: plain(chart.current_seun),
      current_wolun: plain(chart.current_wolun),
      current_ilun: plain(chart.current_ilun),
      flow: plain(chart.flow),
      precision: plain(chart.precision),
      uncertainty: plain(chart.uncertainty),
      person_model: plain(chart.person_model)
    };
  }

  return {
    schema_version: "2.0.0-legacy-bridge",
    name: text(bodyName || chart.name || chart.userName, 40) || null,
    gender: text(chart.gender, 12) || null,
    pillars: {
      year: text(chart.year, 12),
      month: text(chart.month, 12),
      day: text(chart.day, 12),
      hour: chart.hourUnknown ? null : (text(chart.hour, 20) || null)
    },
    day_master: { stem: text(chart.dayMaster, 8) || null },
    ten_gods: plain(chart.tenGods),
    hidden_stems: plain(chart.hiddenStems),
    element_distribution: plain(chart.elements),
    element_strength: null,
    relations: plain(chart.relations),
    stars: plain(chart.stars),
    current_daeun: plain(chart.currentLuck),
    current_seun: plain(chart.yearFlow),
    current_wolun: null,
    current_ilun: null,
    flow: null,
    precision: null,
    person_model: plain(chart.person_model),
    uncertainty: {
      hour_pillar: chart.hourUnknown ? "unavailable" : "available",
      birth_time_unknown: !!chart.hourUnknown,
      daeun_transition: chart.hourUnknown ? "range" : "calculated",
      notes: chart.hourUnknown ? [
        "출생시간 미상: 시주 기반 해석은 확정하지 않습니다.",
        "대운 시작시점은 단일 확정값이 아니라 가능한 범위로 다룹니다."
      ] : []
    }
  };
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string")
    .slice(-10)
    .map(x => ({ role:x.role, content:x.content.trim().slice(0, 1800) }))
    .filter(x => x.content);
}

function extractQuestion(message) {
  const raw = typeof message === "string" ? message.trim() : "";
  if (!raw) return "";
  const marker = "\n질문:";
  const pos = raw.lastIndexOf(marker);
  return (pos >= 0 ? raw.slice(pos + marker.length).trim() : raw).slice(0, 1800);
}

function koreaDate(now = new Date()) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone:"Asia/Seoul", year:"numeric", month:"long", day:"numeric"
    }).format(now);
  } catch (_) {
    return now.toISOString().slice(0,10);
  }
}

function classifyIntent(q) {
  const s = String(q || "");
  if (/(궁합|상대|연애|사랑|결혼|재회|헤어|연락|인연)/.test(s)) return "relationship";
  if (/(돈|재물|투자|사업|매출|수입|대출|재정)/.test(s)) return "money";
  if (/(직업|취업|이직|회사|일|사업|진로|적성)/.test(s)) return "career";
  if (/(언제|올해|이번달|이번 달|오늘|시기|대운|세운|월운)/.test(s)) return "timing";
  if (/(성격|기질|장점|단점|나를|나는)/.test(s)) return "personality";
  return "general";
}

function evidenceBrief(f) {
  const parts = [];
  if (f?.day_master?.stem) parts.push(`일간 ${f.day_master.stem}`);
  if (f?.pillars?.month) parts.push(`월주 ${f.pillars.month}`);
  const mg = f?.ten_gods?.month?.god;
  if (mg) parts.push(`월주 십성 ${mg}`);
  if (f?.current_daeun?.ko || f?.current_daeun?.god) {
    parts.push(`현재 대운 ${f.current_daeun?.ko || ""} ${f.current_daeun?.god || ""}`.trim());
  }
  if (f?.current_seun?.pillar || f?.current_seun?.god) {
    parts.push(`세운 ${f.current_seun?.pillar || ""} ${f.current_seun?.god || ""}`.trim());
  }
  if (f?.current_wolun?.pillar || f?.current_wolun?.god) {
    parts.push(`월운 ${f.current_wolun?.pillar || ""} ${f.current_wolun?.god || ""}`.trim());
  }
  if (f?.current_ilun?.pillar || f?.current_ilun?.god) {
    parts.push(`일운 ${f.current_ilun?.pillar || ""} ${f.current_ilun?.god || ""}`.trim());
  }
  return parts.slice(0,8);
}

function chartContext(facts, intent) {
  const safe = JSON.stringify(facts);
  const brief = evidenceBrief(facts);
  return `
[귀인사주 chart_facts]
${safe.slice(0, 18000)}

[질문 분류]
${intent}

[우선 확인 가능한 근거]
${brief.length ? brief.map(x=>"- "+x).join("\n") : "- 핵심 근거를 chart_facts에서 직접 확인"}

중요:
- 위 JSON은 이미 계산된 사실입니다.
- 없는 필드는 추정하지 마세요.
- person_model은 원국 근거를 묶어놓은 해석 보조 모델입니다. 원국 계산값보다 우선하지 않습니다.
- element_distribution을 element_strength로 바꾸어 해석하지 마세요.
- uncertainty가 있으면 해당 부분의 확신도를 낮추세요.
- 질문 분류와 직접 관계없는 내용을 억지로 늘리지 마세요.
`;
}

function repeatedParagraphCount(s) {
  const rows = String(s||"").split(/\n{2,}/)
    .map(x=>x.replace(/\s+/g," ").trim())
    .filter(x=>x.length>=40);
  const seen=new Set(); let dup=0;
  for(const row of rows){
    const k=row.toLowerCase();
    if(seen.has(k))dup++;
    seen.add(k);
  }
  return dup;
}

function qualityIssues(answer) {
  const s = String(answer || "");
  const issues = [];
  if (!s.trim()) issues.push("empty");
  if (s.trim().length < 80) issues.push("too_short");
  if (/^#{1,6}\s/m.test(s) || /\*\*[^*]+\*\*/.test(s) || /__[^_]+__/.test(s)) issues.push("markdown");
  if (/사용자님|고객님|내담자님|회원님/.test(s)) issues.push("generic_honorific");
  if (/무조건\s*(이혼|파산|사고|수술|죽|망)/.test(s) ||
      /(반드시|확실히)\s*(이혼|파산|사고|수술|실패|합격|결혼)/.test(s)) {
    issues.push("deterministic_fear");
  }
  if (/(암|우울증|조현병|불임|심장병|당뇨)\s*(이다|입니다|걸린다|걸립니다|확정)/.test(s)) {
    issues.push("medical_diagnosis");
  }
  if (repeatedParagraphCount(s) > 0) issues.push("repeated_paragraph");
  const labels=[["한 가지",1],["두 가지",2],["세 가지",3],["네 가지",4],["다섯 가지",5]];
  const declared=labels.find(([label])=>s.includes(label));
  if(declared){
    const numbered=[...s.matchAll(/(?:^|\n)\s*(\d+)[.)]\s+/g)].map(m=>Number(m[1]));
    const circled=(s.match(/[①②③④⑤⑥⑦⑧⑨⑩]/g)||[]).length;
    const observed=numbered.length?Math.max(...numbered):circled;
    if(observed && observed!==declared[1]) issues.push("item_count_mismatch");
  }
  return [...new Set(issues)];
}

async function callOpenAI(env, messages, maxTokens, reqId) {
  const model=(env.CHAT_MODEL || "gpt-4o-mini").trim();
  const response=await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{
      "Authorization":`Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type":"application/json",
      "X-Request-ID":reqId
    },
    body:JSON.stringify({model,messages,max_tokens:maxTokens,temperature:0.7})
  });

  let data=null;
  try{data=await response.json();}catch(_){}
  if(!response.ok){
    console.error("OpenAI request failed",{requestId:reqId,status:response.status,code:data?.error?.code||null});
    const err=new Error("ai_request_failed"); err.status=response.status; throw err;
  }
  const answer=data?.choices?.[0]?.message?.content?.trim();
  if(!answer)throw new Error("empty_ai_response");
  return {answer,model};
}

async function idempotencyGet(env,key){
  if(!key || !env.AI_IDEMPOTENCY || typeof env.AI_IDEMPOTENCY.get!=="function")return null;
  try{
    const raw=await env.AI_IDEMPOTENCY.get("chat:"+key);
    return raw?JSON.parse(raw):null;
  }catch(_){return null;}
}

async function idempotencyPut(env,key,value){
  if(!key || !env.AI_IDEMPOTENCY || typeof env.AI_IDEMPOTENCY.put!=="function")return;
  try{
    await env.AI_IDEMPOTENCY.put("chat:"+key,JSON.stringify(value),{expirationTtl:3600});
  }catch(_){}
}

async function generateAnswer(env,facts,history,question,reqId) {
  const intent=classifyIntent(question);
  const messages=[
    {role:"system",content:SYSTEM_PROMPT},
    {role:"system",content:`현재 서버 기준 날짜는 ${koreaDate()}입니다. 날짜가 필요한 질문은 이 날짜를 기준으로 답하세요.`},
    {role:"system",content:chartContext(facts,intent)},
    ...history,
    {role:"user",content:question}
  ];

  const first=await callOpenAI(env,messages,1350,reqId);
  const issues=qualityIssues(first.answer);
  const repairable=issues.filter(x=>[
    "too_short","markdown","generic_honorific","deterministic_fear",
    "medical_diagnosis","repeated_paragraph","item_count_mismatch"
  ].includes(x));

  if(!repairable.length){
    return {answer:first.answer,model:first.model,intent,quality:{repaired:false,issues}};
  }

  const repairMessages=[
    {role:"system",content:SYSTEM_PROMPT},
    {role:"system",content:chartContext(facts,intent)},
    {role:"user",content:
`아래 답변은 품질검사에서 문제가 발견됐습니다.
새로운 명리 사실을 추가하지 말고 chart_facts와 person_model 범위만 사용해서 다시 작성하세요.
문제: ${repairable.join(", ")}

원래 질문:
${question}

수정할 답변:
${first.answer.slice(0,7500)}

최종 답변만 출력하세요.`}
  ];

  const repaired=await callOpenAI(env,repairMessages,1350,reqId+"_repair");
  return {
    answer:repaired.answer,
    model:repaired.model,
    intent,
    quality:{repaired:true,issues,remaining:qualityIssues(repaired.answer)}
  };
}

export default {
  async fetch(request,env){
    const serverReqId=requestId();
    const url=new URL(request.url);
    const originHeader=request.headers.get("Origin")||"";
    const allowedOrigin=pickOrigin(request);

    if(originHeader && !allowedOrigin){
      return json({error:"origin_not_allowed",requestId:serverReqId},403,"https://gwiinsaju.com");
    }
    const origin=allowedOrigin||"https://gwiinsaju.com";

    if(request.method==="OPTIONS"){
      return new Response(null,{status:204,headers:corsHeaders(origin)});
    }

    if(request.method==="GET" && (url.pathname==="/" || url.pathname==="/health")){
      return json({
        ok:true,
        service:"guiin-saju-api",
        version:WORKER_VERSION,
        answerSchemaVersion:ANSWER_SCHEMA_VERSION,
        chatEnabled:env.AI_CHAT_ENABLED!=="false",
        idempotencyStore:!!env.AI_IDEMPOTENCY
      },200,origin);
    }

    if(request.method==="POST" && url.pathname==="/api/chat"){
      try{
        if(env.AI_CHAT_ENABLED==="false"){
          return json({error:"chat_temporarily_disabled",requestId:serverReqId},503,origin);
        }
        if(!env.OPENAI_API_KEY){
          return json({error:"server_configuration_error",requestId:serverReqId},500,origin);
        }

        let body;
        try{body=await request.json();}
        catch(_){return json({error:"invalid_json",requestId:serverReqId},400,origin);}

        const clientRequestId=safeClientRequestId(
          request.headers.get("X-Idempotency-Key") || body.requestId
        );

        if(clientRequestId){
          const cached=await idempotencyGet(env,clientRequestId);
          if(cached?.ok && cached?.answer){
            return json({...cached,replayed:true},200,origin);
          }
        }

        const rawMessage=typeof body.message==="string"?body.message.trim():"";
        if(!rawMessage)return json({error:"message_required",requestId:serverReqId},400,origin);
        if(rawMessage.length>9000)return json({error:"message_too_long",requestId:serverReqId},400,origin);

        const question=extractQuestion(rawMessage);
        if(!question)return json({error:"question_required",requestId:serverReqId},400,origin);

        const facts=normalizeChart(body.chart,body.name);
        if(!facts)return json({error:"valid_chart_required",requestId:serverReqId},400,origin);

        const history=cleanHistory(body.history);
        const result=await generateAnswer(env,facts,history,question,serverReqId);

        const payload={
          ok:true,
          requestId:serverReqId,
          clientRequestId,
          answer:result.answer,
          model:result.model,
          intent:result.intent,
          quality:result.quality,
          schemaVersion:facts.schema_version,
          answerSchemaVersion:ANSWER_SCHEMA_VERSION,
          chargeSafe:true
        };

        await idempotencyPut(env,clientRequestId,payload);
        return json(payload,200,origin);

      }catch(error){
        console.error("Worker error",{
          requestId:serverReqId,
          message:error?.message||String(error),
          status:error?.status||null
        });
        const code=
          error?.message==="empty_ai_response"?"empty_ai_response":
          error?.message==="ai_request_failed"?"ai_request_failed":
          "internal_server_error";
        return json({error:code,requestId:serverReqId},code==="internal_server_error"?500:502,origin);
      }
    }

    return json({error:"not_found",requestId:serverReqId},404,origin);
  }
};
