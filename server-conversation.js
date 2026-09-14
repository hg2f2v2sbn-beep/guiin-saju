"use strict";

/**
 * 귀인사주 상담 대화 저장 계약.
 */
const ALLOWED_ROLES = new Set(["user","assistant","system"]);

function cleanText(v, max) {
  const s = String(v ?? "").trim();
  if (!s) throw new Error("content_required");
  return s.slice(0, max);
}

function normalizeMessage(x = {}) {
  const role = String(x.role || "").trim();
  if (!ALLOWED_ROLES.has(role)) throw new Error("invalid_role");
  return {
    role,
    content: cleanText(x.content, 12000),
    request_id: x.requestId ? String(x.requestId).slice(0, 200) : null
  };
}

function defaultConversationTitle(firstUserMessage) {
  const s = String(firstUserMessage || "").replace(/\s+/g, " ").trim();
  if (!s) return "사주 상담";
  return s.slice(0, 28) + (s.length > 28 ? "…" : "");
}

function compactHistory(messages = [], maxChars = 9000) {
  const rows = messages
    .filter(x => x && (x.role === "user" || x.role === "assistant"))
    .map(normalizeMessage);

  const out = [];
  let total = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const cost = rows[i].content.length + 20;
    if (out.length && total + cost > maxChars) break;
    out.unshift(rows[i]);
    total += cost;
  }
  return out;
}

function summaryInput(messages = [], throughMessageId = null) {
  const compact = compactHistory(messages, 14000);
  return {
    messages: compact,
    through_message_id: throughMessageId ? String(throughMessageId) : null,
    instruction:
      "사실만 요약하고, 사용자가 말하지 않은 사건을 추가하지 마세요. 선호·질문 맥락·이미 확인된 계산 근거만 남기세요."
  };
}

module.exports = {
  ALLOWED_ROLES, normalizeMessage, defaultConversationTitle,
  compactHistory, summaryInput
};
