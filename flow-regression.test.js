/**
 * 귀인사주 Flow regression tests
 * 실행: node flow-regression.test.js
 */
"use strict";

const assert = require("assert");
const S = require("./saju-engine.js");
const F = require("./flow-timeline.js");

function ok(label, fn) {
  try {
    fn();
    console.log("PASS", label);
  } catch (err) {
    console.error("FAIL", label);
    throw err;
  }
}

const chart = S.calculate({
  name: "TEST",
  gender: "여",
  calendar: "양력",
  year: 1991,
  month: 11,
  day: 23,
  hour: 7,
  minute: 40,
  hourUnknown: false,
  dayBoundary: "23",
  trueSolarApply: false
});

ok("2026 연운 데이터가 병오로 계산된다", () => {
  const x = F.yearData(chart, 2026);
  assert.strictEqual(x.year, 2026);
  assert.strictEqual(x.pillar, "병오");
});

ok("2026 현재 대운을 하나 찾는다", () => {
  const x = F.activeLuck(chart, 2026);
  assert(x && typeof x.ko === "string" && x.ko.length === 2);
});

ok("12개월 월운 데이터가 12개 생성된다", () => {
  const rows = F.monthRange(chart, 2026);
  assert.strictEqual(rows.length, 12);
  assert.deepStrictEqual(rows.map(x => x.month), [1,2,3,4,5,6,7,8,9,10,11,12]);
});

ok("12년 연운 범위가 요청한 개수만큼 생성된다", () => {
  const rows = F.yearRange(chart, 2026, 12);
  assert.strictEqual(rows.length, 12);
  assert.strictEqual(rows[0].year, 2026);
  assert.strictEqual(rows[11].year, 2037);
});

ok("같은 명식·같은 연도는 핵심 flow 데이터가 안정적이다", () => {
  const a = F.yearData(chart, 2026);
  const b = F.yearData(chart, 2026);
  assert.strictEqual(a.pillar, b.pillar);
  assert.strictEqual(a.god, b.god);
  assert.deepStrictEqual(a.relationTypes, b.relationTypes);
});

ok("대운 경계는 정확값 우선으로 판정하는 API 형태를 유지한다", () => {
  const luck = F.activeLuck(chart, 2026);
  assert(luck);
  assert(Number.isFinite(Number(luck.fromAgeExact)));
  assert(Number.isFinite(Number(luck.toAgeExact)));
  assert(Number(luck.fromAgeExact) < Number(luck.toAgeExact));
});

ok("필수 Flow API가 노출되어 있다", () => {
  ["render","activeLuck","yearData","monthData","yearRange","monthRange","relationTypes"]
    .forEach(name => assert.strictEqual(typeof F[name], "function", `${name} missing`));
});

console.log("\nFlow baseline: ALL PASS");
console.log("주의: 절입 기준 월운 전환·정확 대운 timestamp·timezone 정밀화는 다음 단계의 별도 Gate 대상입니다.");
