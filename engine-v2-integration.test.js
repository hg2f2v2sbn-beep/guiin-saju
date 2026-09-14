"use strict";

/**
 * 실제 현재 saju-engine.js + v2 patch 통합 회귀 테스트
 * GitHub Actions에서 실행됩니다.
 */
const assert = require("assert");
const S = require("./saju-engine-v2-patch.js");

function ok(label, fn) {
  try { fn(); console.log("PASS", label); }
  catch (err) { console.error("FAIL", label); throw err; }
}

ok("v2 patch가 실제 계산엔진에 적용된다", () => {
  const x = S.calculate({
    name:"TEST", gender:"여", calendar:"양력",
    year:1991, month:11, day:23,
    hour:7, minute:40, hourUnknown:false,
    dayBoundary:"23", trueSolarApply:false
  });
  assert.strictEqual(x.calculation.engineVersion, "6.1.0-master-v2");
  assert.strictEqual(S.ENGINE_VERSION, "6.1.0-master-v2");
});

ok("시간미상은 후보 일주와 대운 시작범위를 만든다", () => {
  const x = S.calculate({
    name:"TEST", gender:"여", calendar:"양력",
    year:1991, month:11, day:23,
    hourUnknown:true,
    dayBoundary:"23", trueSolarApply:false
  });

  const u = x?.uncertainty?.unknown_time_candidates;
  assert(u, "unknown_time_candidates missing");
  assert(Array.isArray(u.day_pillar_candidates));
  assert(u.day_pillar_candidates.length >= 1);
  assert(u.daeun_start_age_range);
  assert(Number.isFinite(u.daeun_start_age_range.min));
  assert(Number.isFinite(u.daeun_start_age_range.max));
  assert(u.daeun_start_age_range.max >= u.daeun_start_age_range.min);
});

ok("23시 경계일 후보는 하나의 확정 일주로 숨기지 않는다", () => {
  const x = S.calculate({
    name:"TEST", gender:"여", calendar:"양력",
    year:1991, month:11, day:23,
    hourUnknown:true,
    dayBoundary:"23", trueSolarApply:false
  });

  const u = x.uncertainty.unknown_time_candidates;
  assert.strictEqual(u.day_pillar_ambiguous, true);
  assert(u.day_pillar_candidates.includes("정유"));
  assert(u.day_pillar_candidates.includes("무술"));
});

ok("절입 30분 이내는 외부검증 Gate로 올라간다", () => {
  const x = S.calculate({
    name:"TEST", gender:"여", calendar:"양력",
    year:2026, month:5, day:5,
    hour:20, minute:40, hourUnknown:false,
    dayBoundary:"23", trueSolarApply:false
  });

  assert.strictEqual(
    x.calculation.precision.solar_term_external_validation_required,
    true
  );
  assert(
    x.calculation.boundaryDiagnostics.some(d => d.type === "solar-term-precision-gate"),
    "solar-term-precision-gate missing"
  );
});

ok("대운 경계는 [시작,다음시작)", () => {
  const rows = [
    {ko:"갑자",fromAgeExact:5,toAgeExact:15},
    {ko:"을축",fromAgeExact:15,toAgeExact:25}
  ];
  assert.strictEqual(S.currentLuckAtAge(rows,14.999).ko,"갑자");
  assert.strictEqual(S.currentLuckAtAge(rows,15).ko,"을축");
});

console.log("\nEngine v2 integration: ALL PASS");
