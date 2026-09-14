/**
 * 귀인사주 v2 계산/해석 계약층
 * 기존 saju-engine.js의 계산 결과를 AI/리포트/궁합/운세 공통 구조로 정규화합니다.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.GuiinEngineContract = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const CONTRACT_VERSION = "2.0.0";
  const CALCULATION_RULE_VERSION = "guiin-calc-contract-2026-09-14";

  function plain(v) {
    if (v == null) return v;
    return JSON.parse(JSON.stringify(v));
  }

  function pillarKo(p) {
    if (!p) return null;
    return p.ko || `${p.stem || ""}${p.branch || ""}` || null;
  }

  function finiteNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function findCurrentLuckHalfOpen(luckRows, exactAgeYears) {
    const age = finiteNumber(exactAgeYears);
    if (!Array.isArray(luckRows) || age == null) return null;

    for (let i = 0; i < luckRows.length; i++) {
      const row = luckRows[i];
      const start = finiteNumber(row?.fromAgeExact ?? row?.fromAge);
      const nextStart = finiteNumber(luckRows[i + 1]?.fromAgeExact ?? luckRows[i + 1]?.fromAge);
      const fallbackEnd = finiteNumber(row?.toAgeExact ?? row?.toAge);
      const end = nextStart != null ? nextStart : fallbackEnd;
      if (start == null || end == null) continue;
      if (age >= start && age < end) return plain(row);
    }
    return null;
  }

  function buildUncertainty(chart) {
    const input = chart?.input || {};
    const diagnostics = chart?.calculation?.boundaryDiagnostics || [];
    const list = Array.isArray(diagnostics) ? diagnostics : [];
    const out = {
      hour_pillar: input.hourUnknown ? "unavailable" : "available",
      birth_time_unknown: !!input.hourUnknown,
      daeun_transition: input.hourUnknown ? "approximate" : "calculated",
      solar_term_boundary: "normal",
      day_boundary: "normal",
      historical_timezone: "not_verified",
      overseas_timezone: "not_verified",
      notes: []
    };

    for (const d of list) {
      const type = String(d?.type || "");
      if (type === "hour-unknown") {
        out.hour_pillar = "unavailable";
        out.birth_time_unknown = true;
      }
      if (/solar|term|jie/i.test(type)) out.solar_term_boundary = "near_boundary";
      if (/day|midnight|23/i.test(type)) out.day_boundary = "near_boundary";
      if (d?.message) out.notes.push(String(d.message));
    }

    if (input.hourUnknown) {
      out.notes.push("출생시간 미상: 시주 기반 해석은 확정하지 않습니다.");
      out.notes.push("대운 시작시점은 단일 확정값보다 범위/낮은 확신도로 다룹니다.");
    }

    out.notes = [...new Set(out.notes)];
    return out;
  }

  function chartFacts(chart) {
    if (!chart || !chart.pillars?.year || !chart.pillars?.month || !chart.pillars?.day) {
      throw new Error("valid_chart_required");
    }

    const tenGods = {};
    const hiddenStems = {};
    for (const key of ["year", "month", "day", "hour"]) {
      const p = chart.pillars[key];
      if (!p) {
        tenGods[key] = null;
        hiddenStems[key] = null;
        continue;
      }
      tenGods[key] = {
        pillar: pillarKo(p),
        stem: p.stem ?? null,
        branch: p.branch ?? null,
        god: p.god ?? null
      };
      hiddenStems[key] = plain(p.hiddenStems ?? p.hidden ?? p.jijanggan ?? p.hiddenStem ?? null);
    }

    return {
      schema_version: CONTRACT_VERSION,
      calculation_rule_version: CALCULATION_RULE_VERSION,
      calculation_engine_version:
        chart?.calculation?.engineVersion ??
        chart?.method?.engineVersion ??
        chart?.evidence?.engineVersion ??
        null,
      pillars: {
        year: pillarKo(chart.pillars.year),
        month: pillarKo(chart.pillars.month),
        day: pillarKo(chart.pillars.day),
        hour: pillarKo(chart.pillars.hour)
      },
      day_master: {
        stem: chart?.dayMaster?.stem ?? chart?.pillars?.day?.stem ?? null,
        element: chart?.dayMaster?.el ?? null,
        yin_yang: chart?.dayMaster?.yin ?? null
      },
      ten_gods: tenGods,
      hidden_stems: hiddenStems,
      element_distribution: plain(chart?.elCount ?? chart?.elements ?? null),
      element_strength: null,
      relations: plain(chart?.relations ?? []),
      stars: plain(chart?.stars ?? null),
      twelve_stages: plain(chart?.twelveStages ?? null),
      foundational_extras: plain(chart?.extras ?? null),
      daeun: plain(chart?.luck ?? []),
      daeun_start: {
        age_exact: finiteNumber(chart?.startAgeExact),
        age_display: finiteNumber(chart?.startAge),
        gap_days: finiteNumber(chart?.startGapDays),
        text: chart?.startAgeText ?? null,
        forward: typeof chart?.forward === "boolean" ? chart.forward : null
      },
      uncertainty: buildUncertainty(chart)
    };
  }

  function canonicalCalculationInput(input) {
    const x = input || {};
    return {
      calendar: x.calendar ?? "양력",
      lunar_leap_month: !!x.leapMonth,
      year: finiteNumber(x.year),
      month: finiteNumber(x.month),
      day: finiteNumber(x.day),
      hour_unknown: !!x.hourUnknown,
      hour: x.hourUnknown ? null : finiteNumber(x.hour),
      minute: x.hourUnknown ? null : finiteNumber(x.minute ?? 0),
      gender: x.gender ?? x.sex ?? null,
      timezone: x.timezone ?? "Asia/Seoul",
      day_boundary: x.dayBoundary ?? "23",
      true_solar_time: !!x.trueSolarApply,
      longitude: x.trueSolarApply ? finiteNumber(x.longitude) : null,
      calculation_rule_version: CALCULATION_RULE_VERSION
    };
  }

  return {
    CONTRACT_VERSION,
    CALCULATION_RULE_VERSION,
    chartFacts,
    buildUncertainty,
    findCurrentLuckHalfOpen,
    canonicalCalculationInput
  };
});
