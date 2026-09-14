/**
 * 귀인사주 Flow v2
 * 현재 실제 날짜를 기준으로 원국 → 대운 → 연운(세운) → 월운 → 일운을 한 구조로 제공합니다.
 * 기존 flow-timeline.js를 삭제하지 않고 차세대 데이터층으로 추가합니다.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./saju-engine-v2-patch.js"));
  } else {
    root.GuiinFlowV2 = factory(root.GuiinSaju);
  }
})(typeof self !== "undefined" ? self : this, function (S) {
  "use strict";

  if (!S || typeof S.flowForDate !== "function") {
    throw new Error("GuiinSaju v2 engine is required");
  }

  const VERSION = "2.0.0";

  function finite(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function birthInput(chart) {
    const i = chart?.input || {};
    return {
      year: finite(i.year),
      month: finite(i.month),
      day: finite(i.day),
      hour: i.hourUnknown ? 12 : finite(i.hour ?? 12),
      minute: i.hourUnknown ? 0 : finite(i.minute ?? 0),
      hourUnknown: !!i.hourUnknown,
      dayBoundary: i.dayBoundary || "23"
    };
  }

  function exactAgeYears(chart, referenceDate) {
    const b = birthInput(chart);
    if (![b.year,b.month,b.day].every(Number.isFinite)) return null;

    const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate || Date.now());
    // 현재 핵심엔진과 맞추기 위해 modern KST 기준. 역사적 timezone 정밀화는 별도 Gate.
    const birthMs = Date.UTC(b.year, b.month - 1, b.day, b.hour || 12, b.minute || 0) - 9 * 3600000;
    return (ref.getTime() - birthMs) / (365.2425 * 86400000);
  }

  function currentLuck(chart, referenceDate) {
    const age = exactAgeYears(chart, referenceDate);
    if (age == null || typeof S.currentLuckAtAge !== "function") return null;
    return S.currentLuckAtAge(chart?.luck || [], age);
  }

  function referenceParts(referenceDate) {
    const d = referenceDate instanceof Date ? referenceDate : new Date(referenceDate || Date.now());
    // Asia/Seoul 날짜부품
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(d);
    const get = type => Number(parts.find(x => x.type === type)?.value);
    return { year:get("year"), month:get("month"), day:get("day") };
  }

  function currentContext(chart, referenceDate) {
    if (!chart?.pillars?.day) throw new Error("valid chart required");

    const p = referenceParts(referenceDate);
    const b = birthInput(chart);
    const dayStem = chart?.pillars?.day?.stemIndex ?? chart?.pillars?.day?.stem;

    const flow = S.flowForDate(
      p.year, p.month, p.day,
      dayStem,
      12, 0,
      { dayBoundary:b.dayBoundary }
    );

    const luck = currentLuck(chart, referenceDate);
    const basePillars = chart.pillars;

    const seunRelations =
      typeof S.relationsWithTransit === "function"
        ? S.relationsWithTransit(basePillars, flow.pillars.year)
        : [];

    const wolunRelations =
      typeof S.relationsWithTransit === "function"
        ? S.relationsWithTransit(basePillars, flow.pillars.month)
        : [];

    const ilunRelations =
      typeof S.relationsWithTransit === "function"
        ? S.relationsWithTransit(basePillars, flow.pillars.day)
        : [];

    return {
      schema_version: VERSION,
      reference_date: p,
      exact_age_years: exactAgeYears(chart, referenceDate),
      uncertainty: chart?.uncertainty || null,
      natal: {
        year: chart.pillars.year?.ko || null,
        month: chart.pillars.month?.ko || null,
        day: chart.pillars.day?.ko || null,
        hour: chart.pillars.hour?.ko || null
      },
      current_daeun: luck,
      current_seun: {
        pillar: flow.pillars.year?.ko || null,
        god: flow.gods.year || null,
        stage: flow.stages.year || null,
        relations_to_natal: seunRelations
      },
      current_wolun: {
        pillar: flow.pillars.month?.ko || null,
        god: flow.gods.month || null,
        stage: flow.stages.month || null,
        relations_to_natal: wolunRelations
      },
      current_ilun: {
        pillar: flow.pillars.day?.ko || null,
        god: flow.gods.day || null,
        stage: flow.stages.day || null,
        relations_to_natal: ilunRelations
      }
    };
  }

  function sevenDayContext(chart, referenceDate) {
    const start = referenceDate instanceof Date ? new Date(referenceDate) : new Date(referenceDate || Date.now());
    const rows = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      rows.push(currentContext(chart, d));
    }
    return rows;
  }

  return {
    VERSION,
    exactAgeYears,
    currentLuck,
    currentContext,
    sevenDayContext
  };
});
