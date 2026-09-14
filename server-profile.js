"use strict";

/**
 * 귀인사주 프로필/명식 스냅샷 계약.
 * 서버 저장 전 입력 정규화와 소유권/중복 방지 규칙을 한 곳에 모은다.
 */
function int(v, min, max, name) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`invalid_${name}`);
  return n;
}

function bool(v) { return !!v; }

function text(v, max = 80) {
  const s = String(v ?? "").trim().replace(/\s+/g, " ");
  return s ? s.slice(0, max) : null;
}

function normalizeProfileInput(x = {}) {
  const hourUnknown = bool(x.hourUnknown ?? x.hour_unknown);
  const calendar = text(x.calendar, 10) || "양력";
  if (!["양력","음력"].includes(calendar)) throw new Error("invalid_calendar");

  const out = {
    label: text(x.label, 40),
    display_name: text(x.displayName ?? x.display_name ?? x.name, 40),
    calendar,
    lunar_leap_month: bool(x.leapMonth ?? x.lunar_leap_month),
    birth_year: int(x.year ?? x.birth_year, 1900, 2100, "birth_year"),
    birth_month: int(x.month ?? x.birth_month, 1, 12, "birth_month"),
    birth_day: int(x.day ?? x.birth_day, 1, 31, "birth_day"),
    birth_hour: hourUnknown ? null : int(x.hour ?? x.birth_hour ?? 12, 0, 23, "birth_hour"),
    birth_minute: hourUnknown ? null : int(x.minute ?? x.birth_minute ?? 0, 0, 59, "birth_minute"),
    hour_unknown: hourUnknown,
    gender: text(x.gender ?? x.sex, 12),
    timezone: text(x.timezone, 64) || "Asia/Seoul",
    day_boundary: text(x.dayBoundary ?? x.day_boundary, 8) || "23",
    true_solar_time: bool(x.trueSolarApply ?? x.true_solar_time),
    longitude: null
  };

  if (!["23","00"].includes(out.day_boundary)) throw new Error("invalid_day_boundary");

  if (out.true_solar_time) {
    const lon = Number(x.longitude);
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error("invalid_longitude");
    out.longitude = lon;
  }

  return out;
}

function canonicalChartInput(profile) {
  const p = normalizeProfileInput(profile);
  return {
    calendar: p.calendar,
    lunar_leap_month: p.lunar_leap_month,
    year: p.birth_year,
    month: p.birth_month,
    day: p.birth_day,
    hour_unknown: p.hour_unknown,
    hour: p.birth_hour,
    minute: p.birth_minute,
    gender: p.gender,
    timezone: p.timezone,
    day_boundary: p.day_boundary,
    true_solar_time: p.true_solar_time,
    longitude: p.longitude
  };
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map(k => JSON.stringify(k)+":"+stableStringify(value[k])).join(",") + "}";
}

function snapshotPayload({profile, chartFacts, uncertainty, engineVersion, ruleVersion}) {
  if (!chartFacts || typeof chartFacts !== "object") throw new Error("chart_facts_required");
  const canonical = canonicalChartInput(profile);
  return {
    normalized_input_json: stableStringify(canonical),
    chart_facts_json: stableStringify(chartFacts),
    uncertainty_json: stableStringify(uncertainty || null),
    calculation_engine_version: text(engineVersion, 80),
    calculation_rule_version: text(ruleVersion, 80) || "unknown"
  };
}

function canAccessOwnedResource({resourceUserId, resourceGuestId, userId, guestSessionId}) {
  if (resourceUserId && userId && String(resourceUserId) === String(userId)) return true;
  if (resourceGuestId && guestSessionId && String(resourceGuestId) === String(guestSessionId)) return true;
  return false;
}

module.exports = {
  normalizeProfileInput, canonicalChartInput, stableStringify,
  snapshotPayload, canAccessOwnedResource
};
