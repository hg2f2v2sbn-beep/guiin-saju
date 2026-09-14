"use strict";

const VERIFICATION = Object.freeze({
  CLIENT_FACTS_UNVERIFIED: "CLIENT_FACTS_UNVERIFIED",
  SERVER_INPUT_VERIFIED: "SERVER_INPUT_VERIFIED",
  SERVER_ENGINE_VERIFIED: "SERVER_ENGINE_VERIFIED"
});

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map(k => JSON.stringify(k)+":"+stableStringify(value[k])).join(",") + "}";
}

function normalizeInput(x = {}) {
  const calendar = String(x.calendar || "양력");
  const year = Number(x.year ?? x.birth_year);
  const month = Number(x.month ?? x.birth_month);
  const day = Number(x.day ?? x.birth_day);
  const hourUnknown = !!(x.hourUnknown ?? x.hour_unknown);

  if (!["양력","음력"].includes(calendar)) throw new Error("invalid_calendar");
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error("invalid_year");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("invalid_month");
  if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error("invalid_day");

  let hour = null, minute = null;
  if (!hourUnknown) {
    hour = Number(x.hour ?? x.birth_hour);
    minute = Number(x.minute ?? x.birth_minute ?? 0);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("invalid_hour");
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error("invalid_minute");
  }

  return {
    calendar,
    lunar_leap_month: !!(x.leapMonth ?? x.lunar_leap_month),
    year, month, day,
    hour_unknown: hourUnknown,
    hour, minute,
    gender: x.gender ? String(x.gender).slice(0,12) : null,
    timezone: String(x.timezone || "Asia/Seoul").slice(0,64),
    day_boundary: String(x.dayBoundary ?? x.day_boundary ?? "23"),
    true_solar_time: !!(x.trueSolarApply ?? x.true_solar_time),
    longitude: x.longitude == null ? null : Number(x.longitude)
  };
}

function chartSnapshotDraft({subject, profileId, normalizedInput, chartFacts, uncertainty, engineVersion, ruleVersion}) {
  if (!subject || !["user","guest"].includes(subject.type) || !subject.id) throw new Error("subject_required");
  if (!chartFacts || typeof chartFacts !== "object") throw new Error("chart_facts_required");
  const input = normalizeInput(normalizedInput);
  return {
    user_id: subject.type === "user" ? String(subject.id) : null,
    guest_session_id: subject.type === "guest" ? String(subject.id) : null,
    profile_id: profileId ? String(profileId) : null,
    normalized_input_json: stableStringify(input),
    chart_facts_json: stableStringify(chartFacts),
    uncertainty_json: stableStringify(uncertainty || null),
    calculation_engine_version: engineVersion ? String(engineVersion).slice(0,80) : null,
    calculation_rule_version: String(ruleVersion || "unknown").slice(0,80),
    verification_state: VERIFICATION.CLIENT_FACTS_UNVERIFIED
  };
}

function mayUseAsAuthoritativeFacts(snapshot) {
  return snapshot?.verification_state === VERIFICATION.SERVER_ENGINE_VERIFIED;
}

function aiPromptTrustLabel(snapshot) {
  if (mayUseAsAuthoritativeFacts(snapshot)) return "server_engine_verified";
  if (snapshot?.verification_state === VERIFICATION.SERVER_INPUT_VERIFIED) return "server_input_verified_client_facts";
  return "client_facts_unverified";
}

module.exports = {
  VERIFICATION, stableStringify, normalizeInput, chartSnapshotDraft,
  mayUseAsAuthoritativeFacts, aiPromptTrustLabel
};
