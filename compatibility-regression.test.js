/**
 * 귀인사주 Compatibility regression tests
 * 실행: node compatibility-regression.test.js
 */
"use strict";

const assert = require("assert");
const S = require("./saju-engine.js");
const C = require("./compatibility-interpreter.js");

function ok(label, fn) {
  try {
    fn();
    console.log("PASS", label);
  } catch (err) {
    console.error("FAIL", label);
    throw err;
  }
}

function chart(name, year, month, day, hour, gender) {
  return S.calculate({
    name,
    gender: gender || "여",
    calendar: "양력",
    year, month, day, hour,
    minute: 0,
    hourUnknown: false,
    dayBoundary: "23",
    trueSolarApply: false
  });
}

const A = chart("A", 1991, 11, 23, 7, "여");
const B = chart("B", 1993, 3, 10, 15, "남");

const AB = C.build(A, B, 80);
const BA = C.build(B, A, 80);

ok("궁합 build 결과가 존재한다", () => {
  assert(AB && AB.meta && Array.isArray(AB.sections));
  assert(AB.sections.length > 0);
});

ok("A+B와 B+A의 오행 거리 값은 같다", () => {
  assert.strictEqual(AB.meta.elementDistance, BA.meta.elementDistance);
});

ok("A+B와 B+A의 결합/긴장 raw signal은 같다", () => {
  assert.strictEqual(AB.meta.combineSignal, BA.meta.combineSignal);
  assert.strictEqual(AB.meta.tensionSignal, BA.meta.tensionSignal);
});

ok("A+B와 B+A의 관계 유형 집합은 같다", () => {
  const a = [...AB.meta.relationTypes].sort();
  const b = [...BA.meta.relationTypes].sort();
  assert.deepStrictEqual(a, b);
});

ok("Pair Swap 시 교차 십성이 정확히 뒤집힌다", () => {
  assert.strictEqual(AB.meta.crossTenGod.aSeesB, BA.meta.crossTenGod.bSeesA);
  assert.strictEqual(AB.meta.crossTenGod.bSeesA, BA.meta.crossTenGod.aSeesB);
});

ok("같은 두 명식을 반복 분석하면 핵심 meta가 안정적이다", () => {
  const again = C.build(A, B, 80);
  assert.deepStrictEqual(AB.meta, again.meta);
});

ok("섹션에 undefined 문자열이 노출되지 않는다", () => {
  const text = JSON.stringify(AB.sections);
  assert(!text.includes("undefined"));
});

ok("필수 궁합 API가 노출되어 있다", () => {
  ["build", "pick", "pct", "dayBranchRelation", "relationSignals", "crossTenGod"]
    .forEach(name => assert.strictEqual(typeof C[name], "function", `${name} missing`));
});

console.log("\nCompatibility baseline: ALL PASS");
console.log("주의: 이 테스트는 현재 raw 관계 계산의 회귀 방지용이며, 2세대 궁합 해석 품질을 보증하는 테스트는 아닙니다.");
