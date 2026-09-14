"use strict";

const TERMINAL = new Set(["SPENT","RELEASED","FAILED_FINAL"]);

function createAiRequestDraft({subject, conversationId, chartSnapshotId, idempotencyKey, modelId, promptVersion}) {
  if (!subject || !["user","guest"].includes(subject.type) || !subject.id) throw new Error("subject_required");
  const key = String(idempotencyKey || "").trim();
  if (key.length < 12 || key.length > 200) throw new Error("invalid_idempotency_key");
  return {
    user_id: subject.type === "user" ? String(subject.id) : null,
    guest_session_id: subject.type === "guest" ? String(subject.id) : null,
    conversation_id: conversationId ? String(conversationId) : null,
    chart_snapshot_id: chartSnapshotId ? String(chartSnapshotId) : null,
    request_type: "AI_CHAT",
    idempotency_key: key,
    state: "PROCESSING",
    model_id: modelId ? String(modelId).slice(0,100) : null,
    prompt_version: promptVersion ? String(promptVersion).slice(0,100) : null
  };
}

function durableResultDraft({aiRequestId, requestId, answer, responseJson, quality, chartSnapshotId, conversationId}) {
  if (!aiRequestId) throw new Error("ai_request_id_required");
  if (!requestId) throw new Error("request_id_required");
  const text = String(answer || "").trim();
  if (!text) throw new Error("answer_required");
  return {
    ai_request_id: String(aiRequestId),
    request_id: String(requestId),
    response_text: text,
    response_json: JSON.stringify(responseJson || null),
    quality_json: JSON.stringify(quality || null),
    chart_snapshot_id: chartSnapshotId ? String(chartSnapshotId) : null,
    conversation_id: conversationId ? String(conversationId) : null
  };
}

function finalStateAfterStore({stored, chargeMode}) {
  if (!stored) return "FAILED_RETRYABLE";
  if (chargeMode === "none") return "STORED";
  if (chargeMode === "reserved") return "STORED";
  throw new Error("invalid_charge_mode");
}

function canReplayRequest(row) {
  return !!row && ["AI_SUCCESS","VALIDATING","STORED","SPENT"].includes(String(row.state || ""));
}

function shouldChargeNow({resultStored, serverAccountingEnabled}) {
  return resultStored === true && serverAccountingEnabled === true;
}

function terminalState(state) {
  return TERMINAL.has(String(state || ""));
}

module.exports = {
  createAiRequestDraft, durableResultDraft, finalStateAfterStore,
  canReplayRequest, shouldChargeNow, terminalState
};
