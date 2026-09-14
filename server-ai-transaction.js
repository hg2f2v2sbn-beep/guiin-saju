"use strict";

const SUCCESS_FLOW = Object.freeze([
  "CREATED","PROCESSING","AI_SUCCESS","VALIDATING","STORED"
]);

function normalizeSubject(subject) {
  if (!subject || !["user","guest"].includes(subject.type) || !subject.id) {
    throw new Error("subject_required");
  }
  return {
    user_id: subject.type === "user" ? String(subject.id) : null,
    guest_session_id: subject.type === "guest" ? String(subject.id) : null
  };
}

function beginPlan({subject, conversationId, chartSnapshotId, idempotencyKey, requestId, modelId, promptVersion}) {
  const own = normalizeSubject(subject);
  const idem = String(idempotencyKey || "").trim();
  const req = String(requestId || "").trim();
  if (idem.length < 12 || idem.length > 200) throw new Error("invalid_idempotency_key");
  if (!req) throw new Error("request_id_required");
  return {
    ...own,
    conversation_id: conversationId ? String(conversationId) : null,
    chart_snapshot_id: chartSnapshotId ? String(chartSnapshotId) : null,
    idempotency_key: idem,
    request_id: req,
    request_type: "AI_CHAT",
    state: "PROCESSING",
    model_id: modelId ? String(modelId).slice(0,100) : null,
    prompt_version: promptVersion ? String(promptVersion).slice(0,100) : null
  };
}

function successStorePlan({aiRequestId, requestId, answer, quality, conversationId, chartSnapshotId}) {
  if (!aiRequestId) throw new Error("ai_request_id_required");
  if (!requestId) throw new Error("request_id_required");
  const a = String(answer || "").trim();
  if (!a) throw new Error("answer_required");

  return {
    result: {
      ai_request_id: String(aiRequestId),
      request_id: String(requestId),
      response_text: a,
      quality_json: JSON.stringify(quality || null),
      conversation_id: conversationId ? String(conversationId) : null,
      chart_snapshot_id: chartSnapshotId ? String(chartSnapshotId) : null
    },
    final_state: "STORED",
    may_charge: false,
    reason: "server_accounting_disabled"
  };
}

function failurePlan({state, retryable = true}) {
  const current = String(state || "PROCESSING");
  if (["STORED","SPENT","RELEASED","FAILED_FINAL"].includes(current)) {
    throw new Error("terminal_or_stored_state");
  }
  return {
    from_state: current,
    to_state: retryable ? "FAILED_RETRYABLE" : "FAILED_FINAL",
    may_charge: false
  };
}

function replayDecision({requestRow, resultRow}) {
  if (!requestRow) return {kind:"new"};
  if (resultRow && ["STORED","SPENT"].includes(String(requestRow.state || ""))) {
    return {kind:"replay", answer:String(resultRow.response_text || "")};
  }
  if (["PROCESSING","AI_SUCCESS","VALIDATING"].includes(String(requestRow.state || ""))) {
    return {kind:"in_progress"};
  }
  if (requestRow.state === "FAILED_RETRYABLE") return {kind:"retry"};
  if (["FAILED_FINAL","RELEASED"].includes(String(requestRow.state || ""))) return {kind:"blocked"};
  return {kind:"retry"};
}

function canFinalizeCharge({aiState, resultExists, serverAccountingEnabled}) {
  return aiState === "STORED" && resultExists === true && serverAccountingEnabled === true;
}

module.exports = {
  SUCCESS_FLOW, normalizeSubject, beginPlan, successStorePlan,
  failurePlan, replayDecision, canFinalizeCharge
};
