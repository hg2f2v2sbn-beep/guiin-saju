const ALLOWED_ORIGINS = new Set([
  "https://gwiinsaju.com",
  "https://www.gwiinsaju.com",
  "https://hg2f2v2sbn-beep.github.io"
]);

const SYSTEM_PROMPT = `
당신은 '귀인사주'의 AI 사주 상담가입니다.

[절대 규칙]
- 전달받은 chart_facts는 귀인사주 계산엔진이 이미 계산한 사실입니다.
- 명식을 다시 계산하거나, 없는 십성·신살·합충형파해·대운·세운을 추측해서 만들지 마세요.
- element_distribution은 오행 "분포"입니다. 이것만 보고 특정 오행이 실제로 강하다/약하다고 단정하지 마세요.
- 출생시간이 없으면 시주를 추정하지 말고, 시주가 필요한 부분의 확신도를 낮추세요.
- 사용자가 말하지 않은 과거 사건·직업·연애·가족사를 실제 있었던 일처럼 지어내지 마세요.
- 신살 하나나 일간 한 글자만으로 사람 전체를 단정하지 마세요.
- 미래는 확정 사건이 아니라 경향·가능성·활용법으로 설명하세요.
- 질병, 임신, 사망, 사고, 이혼, 파산, 합격, 투자수익 같은 중요한 결과를 확정하지 마세요.
- 의료·법률·투자 판단을 사주로 대신하지 마세요.

[해석 방식]
- 질문의 핵심부터 답하세요.
- 가능하면 서로 다른 근거 2개 이상을 연결한 뒤 해석하세요.
- 근거가 서로 반대라면 한쪽을 지우지 말고 "어떤 상황에서 어느 성향이 나타나는지" 설명하세요.
- 명리 용어를 쓰면 바로 쉬운 말로 풀어주세요.
- 장점만 나열하지 말고, 과해질 때의 약점과 현실적인 조정법까지 함께 주세요.
- 같은 표현과 같은 조언을 반복하지 마세요.
- 일반론보다 현재 chart_facts에서 확인되는 근거를 우선하세요.
- 근거가 부족하면 부족하다고 말하세요.

[문체]
- 한국어로 자연스럽고 따뜻하게, 오래 알고 지낸 사람처럼 현실적으로 말하세요.
- 실제 이름이 있으면 필요한 지점에서만 이름+님으로 부르고, 없으면 호칭을 생략하세요.
- 사용자님·고객님·내담자님·회원님·당신 같은 일반 호칭은 피하세요.
- 짧은 문단으로 모바일에서 읽기 쉽게 작성하세요.
- ###, **, __ 같은 마크다운 장식은 사용하지 마세요.
`;

function requestId() {
  try {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  } catch (_) {}
  return "req_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

function pickOrigin(request) {
  const origin = request.headers.get("Origin") || "";
  return ALLOWED_ORIGINS.has(origin) ? origin : "";
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
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
  return chart && ["year", "month", "day"].every(
    key => typeof chart[key] === "string" && chart[key].trim().length > 0
  );
}

function hasV2Pillars(chart) {
  return chart?.pillars &&
    ["year", "month", "day"].every(key => typeof chart.pillars[key] === "string" && chart.pillars[key].trim());
}

function validChart(chart) {
  return !!chart && typeof chart === "object" && (hasLegacyPillars(chart) || hasV2Pillars(chart));
}

function normalizeChart(chart, bodyName) {
  if (!validChart(chart)) return null;

  // 이미 v2 chart_facts 형태면 필요한 필드만 안전하게 복사한다.
  if (hasV2Pillars(chart)) {
    return {
      schema_version: text(chart.schema_version, 30) || "2.0.0",
      name: text(bodyName || chart.name, 40) || null,
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
      element_strength: null,
      relations: plain(chart.relations),
      stars: plain(chart.stars),
      twelve_stages: plain(chart.twelve_stages),
      daeun: plain(chart.daeun),
      current_daeun: plain(chart.current_daeun),
      current_seun: plain(chart.current_seun),
      uncertainty: plain(chart.uncertainty)
    };
  }

  // 현재 index.html이 보내는 기존 payload를 v2 의미로 정규화한다.
  return {
    schema_version: "2.0.0-legacy-bridge",
    name: text(bodyName || chart.name || chart.userName, 40) || null,
    pillars: {
      year: text(chart.year, 12),
      month: text(chart.month, 12),
      day: text(chart.day, 12),
      hour: chart.hourUnknown ? null : (text(chart.hour, 20) || null)
    },
    day_master: {
      stem: text(chart.dayMaster, 8) || null
    },
    ten_gods: plain(chart.tenGods),
    hidden_stems: plain(chart.hiddenStems),
    element_distribution: plain(chart.elements),
    element_strength: null,
    relations: plain(chart.relations),
    stars: plain(chart.stars),
    current_daeun: plain(chart.currentLuck),
    current_seun: plain(chart.yearFlow),
    uncertainty: {
      hour_pillar: chart.hourUnknown ? "unavailable" : "available",
      birth_time_unknown: !!chart.hourUnknown,
      daeun_transition: chart.hourUnknown ? "approximate" : "calculated",
      notes: chart.hourUnknown
        ? [
            "출생시간 미상: 시주 기반 해석은 확정하지 않습니다.",
            "대운 시작시점은 단일 확정값보다 낮은 확신도로 다룹니다."
          ]
        : []
    }
  };
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string")
    .slice(-8)
    .map(x => ({
      role: x.role,
      content: x.content.trim().slice(0, 1500)
    }))
    .filter(x => x.content);
}

function extractQuestion(message) {
  const raw = typeof message === "string" ? message.trim() : "";
  if (!raw) return "";

  // 현재 index.html은 긴 안내문 뒤 마지막에 "질문: ..."을 붙인다.
  // 안내문은 서버 SYSTEM_PROMPT로 이동했으므로 실제 질문만 추출한다.
  const marker = "\n질문:";
  const pos = raw.lastIndexOf(marker);
  const q = pos >= 0 ? raw.slice(pos + marker.length).trim() : raw;
  return q.slice(0, 1600);
}

function koreaDate(now = new Date()) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(now);
  } catch (_) {
    return now.toISOString().slice(0, 10);
  }
}

function chartContext(facts) {
  // 모델이 다시 계산하지 않고 사실을 읽도록 구조화 JSON 그대로 전달한다.
  const safe = JSON.stringify(facts);
  return `
[귀인사주 chart_facts]
${safe.slice(0, 14000)}

중요:
- 위 JSON은 이미 계산된 사실입니다.
- 없는 필드는 추정하지 마세요.
- element_distribution을 element_strength로 바꾸어 해석하지 마세요.
- uncertainty가 있으면 해당 부분의 확신도를 낮추세요.
`;
}

function qualityIssues(answer) {
  const s = String(answer || "");
  const issues = [];

  if (!s.trim()) issues.push("empty");
  if (/^#{1,6}\s/m.test(s) || /\*\*[^*]+\*\*/.test(s) || /__[^_]+__/.test(s)) {
    issues.push("markdown");
  }
  if (/무조건\s*(이혼|파산|사고|수술|죽|망)/.test(s) ||
      /(반드시|확실히)\s*(이혼|파산|사고|수술|실패|합격|결혼)/.test(s)) {
    issues.push("deterministic_fear");
  }
  if (/(암|우울증|조현병|불임|심장병|당뇨)\s*(이다|입니다|걸린다|걸립니다|확정)/.test(s)) {
    issues.push("medical_diagnosis");
  }

  const labels = [["한 가지",1],["두 가지",2],["세 가지",3],["네 가지",4],["다섯 가지",5]];
  const declared = labels.find(([label]) => s.includes(label));
  if (declared) {
    const numbered = [...s.matchAll(/(?:^|\n)\s*(\d+)[.)]\s+/g)].map(m => Number(m[1]));
    const observed = numbered.length ? Math.max(...numbered) : 0;
    if (observed && observed !== declared[1]) issues.push("item_count_mismatch");
  }

  return [...new Set(issues)];
}

async function callOpenAI(env, messages, maxTokens, reqId) {
  const model = (env.CHAT_MODEL || "gpt-4o-mini").trim();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "X-Request-ID": reqId
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens
    })
  });

  let data = null;
  try { data = await response.json(); }
  catch (_) {}

  if (!response.ok) {
    console.error("OpenAI request failed", {
      requestId: reqId,
      status: response.status,
      code: data?.error?.code || null
    });
    const err = new Error("ai_request_failed");
    err.status = response.status;
    throw err;
  }

  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("empty_ai_response");
  return { answer, model };
}

async function generateAnswer(env, facts, history, question, reqId) {
  const dateSystem = `현재 서버 기준 날짜는 ${koreaDate()}입니다. 날짜가 필요한 질문은 이 날짜를 기준으로 답하세요.`;
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: dateSystem },
    { role: "system", content: chartContext(facts) },
    ...history,
    { role: "user", content: question }
  ];

  const first = await callOpenAI(env, messages, 1200, reqId);
  const issues = qualityIssues(first.answer);

  // 심각하거나 사용자에게 바로 보이는 형식 오류만 1회 자동 수정.
  const repairable = issues.filter(x =>
    ["markdown", "deterministic_fear", "medical_diagnosis", "item_count_mismatch"].includes(x)
  );

  if (!repairable.length) {
    return { answer: first.answer, model: first.model, quality: { repaired: false, issues } };
  }

  const repairMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: chartContext(facts) },
    {
      role: "user",
      content:
`아래 답변을 같은 질문에 대한 답으로 다시 작성하세요.
새로운 명리 사실을 추가하지 말고 chart_facts 근거 범위만 사용하세요.
수정해야 할 문제: ${repairable.join(", ")}
마크다운 장식 없이 자연스러운 일반 텍스트로 작성하세요.

질문:
${question}

수정할 답변:
${first.answer.slice(0, 7000)}`
    }
  ];

  const repaired = await callOpenAI(env, repairMessages, 1200, reqId + "_repair");
  return {
    answer: repaired.answer,
    model: repaired.model,
    quality: { repaired: true, issues, remaining: qualityIssues(repaired.answer) }
  };
}

export default {
  async fetch(request, env) {
    const reqId = requestId();
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin") || "";
    const allowedOrigin = pickOrigin(request);

    // 브라우저 Origin이 명시되어 있는데 허용목록 밖이면 preflight부터 거부한다.
    if (originHeader && !allowedOrigin) {
      return json({ error: "origin_not_allowed", requestId: reqId }, 403, "https://gwiinsaju.com");
    }

    const origin = allowedOrigin || "https://gwiinsaju.com";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({
        ok: true,
        service: "guiin-saju-api",
        version: "2.0-chat-bridge",
        chatEnabled: env.AI_CHAT_ENABLED !== "false"
      }, 200, origin);
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      try {
        if (env.AI_CHAT_ENABLED === "false") {
          return json({ error: "chat_temporarily_disabled", requestId: reqId }, 503, origin);
        }

        if (!env.OPENAI_API_KEY) {
          return json({ error: "server_configuration_error", requestId: reqId }, 500, origin);
        }

        let body;
        try {
          body = await request.json();
        } catch (_) {
          return json({ error: "invalid_json", requestId: reqId }, 400, origin);
        }

        const rawMessage = typeof body.message === "string" ? body.message.trim() : "";
        if (!rawMessage) return json({ error: "message_required", requestId: reqId }, 400, origin);

        // 기존 프론트의 안내문 래퍼까지 받을 수 있도록 충분히 허용하되,
        // 실제 모델에는 extractQuestion() 결과만 보낸다.
        if (rawMessage.length > 9000) {
          return json({ error: "message_too_long", requestId: reqId }, 400, origin);
        }

        const question = extractQuestion(rawMessage);
        if (!question) return json({ error: "question_required", requestId: reqId }, 400, origin);

        const facts = normalizeChart(body.chart, body.name);
        if (!facts) return json({ error: "valid_chart_required", requestId: reqId }, 400, origin);

        const history = cleanHistory(body.history);
        const result = await generateAnswer(env, facts, history, question, reqId);

        return json({
          ok: true,
          requestId: reqId,
          answer: result.answer,
          model: result.model,
          quality: result.quality,
          schemaVersion: facts.schema_version
        }, 200, origin);

      } catch (error) {
        console.error("Worker error", {
          requestId: reqId,
          message: error?.message || String(error),
          status: error?.status || null
        });

        const code =
          error?.message === "empty_ai_response" ? "empty_ai_response" :
          error?.message === "ai_request_failed" ? "ai_request_failed" :
          "internal_server_error";

        return json({ error: code, requestId: reqId }, code === "internal_server_error" ? 500 : 502, origin);
      }
    }

    return json({ error: "not_found", requestId: reqId }, 404, origin);
  }
};
