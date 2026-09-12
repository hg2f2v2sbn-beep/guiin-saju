const ALLOWED_ORIGINS = new Set([
  "https://gwiinsaju.com",
  "https://www.gwiinsaju.com",
  "https://hg2f2v2sbn-beep.github.io"
]);

const SYSTEM_PROMPT = `
당신은 '귀인사주'의 AI 사주 상담가입니다.
- 전달받은 chart는 귀인사주 엔진이 이미 계산한 확정 명식입니다.
- 명식을 다시 계산하거나 임의로 수정하지 마세요.
- chart에 없는 정보를 사실처럼 만들지 마세요.
- 한국어로 자연스럽고 쉽게, 질문의 핵심부터 답하세요.
- 명리학 용어는 바로 쉬운 말로 설명하세요.
- 장점과 주의점을 균형 있게 설명하고 같은 표현을 반복하지 마세요.
- 운세는 확정된 미래가 아닌 명리학적 경향과 가능성으로 설명하세요.
- 의료·법률·투자 등의 중요한 판단을 사주만으로 단정하지 마세요.
`;

function corsHeaders(origin) {
  const h = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
  if (origin) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...corsHeaders(origin)
    }
  });
}

function allowedOrigin(origin) {
  return !origin || ALLOWED_ORIGINS.has(origin);
}

function validChart(chart) {
  if (!chart || typeof chart !== "object") return false;
  return ["year", "month", "day", "hour"].every(
    key => typeof chart[key] === "string" && chart[key].trim().length > 0
  );
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string")
    .slice(-12)
    .map(x => ({ role: x.role, content: x.content.slice(0, 2000) }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (!allowedOrigin(origin)) {
      return json({ error: "origin_not_allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({ ok: true, service: "guiin-saju-api" }, 200, origin);
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      try {
        if (!env.OPENAI_API_KEY) {
          return json({ error: "server_configuration_error" }, 500, origin);
        }

        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400, origin);
        }

        const message = typeof body.message === "string" ? body.message.trim() : "";
        if (!message) return json({ error: "message_required" }, 400, origin);
        if (message.length > 800) return json({ error: "message_too_long" }, 400, origin);
        if (!validChart(body.chart)) return json({ error: "valid_chart_required" }, 400, origin);

        const chart = body.chart;
        const chartContext = `
[귀인사주 엔진이 계산한 확정 명식]
년주: ${chart.year}
월주: ${chart.month}
일주: ${chart.day}
시주: ${chart.hour}
위 명식은 이미 계산이 끝난 값입니다. 그대로 사용하고 다시 계산하지 마세요.
`;

        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: chartContext },
          ...cleanHistory(body.history),
          { role: "user", content: message }
        ];

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-5.4-mini",
            messages,
            max_completion_tokens: 900
          })
        });

        const data = await response.json();
        if (!response.ok) {
          console.error("OpenAI request failed", response.status);
          return json({ error: "ai_request_failed" }, 502, origin);
        }

        const answer = data?.choices?.[0]?.message?.content?.trim();
        if (!answer) return json({ error: "empty_ai_response" }, 502, origin);

        return json({ ok: true, answer }, 200, origin);
      } catch (error) {
        console.error("Worker error", error);
        return json({ error: "internal_server_error" }, 500, origin);
      }
    }

    return json({ error: "not_found" }, 404, origin);
  }
};
