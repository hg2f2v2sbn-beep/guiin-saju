/**
 * 귀인사주 Golden Chart regression tests
 * 목적:
 * - 사주 계산 핵심 결과가 코드 정리/리팩터링 중 조용히 바뀌는 것을 방지
 * - 현재 지원하는 양력/음력/윤달/일주경계/절기 근사 계산을 자동 점검
 *
 * 실행: node golden-chart.test.js
 */
"use strict";

const assert = require("assert");
const S = require("./saju-engine.js");

function ok(label, fn) {
  try {
    fn();
    console.log("PASS", label);
  } catch (err) {
    console.error("FAIL", label);
    throw err;
  }
}

function calc(input) {
  return S.calculate(Object.assign({
    name: "TEST",
    gender: "여",
    calendar: "양력",
    hour: 12,
    minute: 0,
    hourUnknown: false,
    dayBoundary: "23",
    trueSolarApply: false
  }, input));
}

function kstMinutes(x) {
  return Date.UTC(x.year, x.month - 1, x.day, x.hour, x.minute) / 60000;
}

ok("2026 음력 1월 1일 → 2026-02-17", () => {
  const x = S.lunarToSolar(2026, 1, 1, false);
  assert.deepStrictEqual([x.year, x.month, x.day], [2026, 2, 17]);
});

ok("2027 음력 1월 1일 → 2027-02-07", () => {
  const x = S.lunarToSolar(2027, 1, 1, false);
  assert.deepStrictEqual([x.year, x.month, x.day], [2027, 2, 7]);
});

ok("2028 음력 1월 1일 → 2028-01-27", () => {
  const x = S.lunarToSolar(2028, 1, 1, false);
  assert.deepStrictEqual([x.year, x.month, x.day], [2028, 1, 27]);
});

ok("2028 윤5월 1일 → 2028-06-23", () => {
  const x = S.lunarToSolar(2028, 5, 1, true);
  assert.deepStrictEqual([x.year, x.month, x.day], [2028, 6, 23]);
});

ok("대표 일진 2026-02-17 = 임술", () => {
  assert.strictEqual(calc({year: 2026, month: 2, day: 17}).pillars.day.ko, "임술");
});

ok("대표 일진 2027-02-07 = 정사", () => {
  assert.strictEqual(calc({year: 2027, month: 2, day: 7}).pillars.day.ko, "정사");
});

ok("대표 일진 2028-01-27 = 신해", () => {
  assert.strictEqual(calc({year: 2028, month: 1, day: 27}).pillars.day.ko, "신해");
});

ok("23시 일주 변경 옵션에서 22:59와 23:00의 일주가 달라진다", () => {
  const before = calc({
    year: 1991, month: 11, day: 23, hour: 22, minute: 59, dayBoundary: "23"
  });
  const after = calc({
    year: 1991, month: 11, day: 23, hour: 23, minute: 0, dayBoundary: "23"
  });
  assert.notStrictEqual(before.pillars.day.ko, after.pillars.day.ko);
});

ok("자정 변경 옵션에서는 같은 날짜 22:59와 23:00의 일주가 같다", () => {
  const before = calc({
    year: 1991, month: 11, day: 23, hour: 22, minute: 59, dayBoundary: "00"
  });
  const after = calc({
    year: 1991, month: 11, day: 23, hour: 23, minute: 0, dayBoundary: "00"
  });
  assert.strictEqual(before.pillars.day.ko, after.pillars.day.ko);
});

ok("출생시간 미상은 시주를 확정하지 않는다", () => {
  const x = calc({
    year: 1991, month: 11, day: 23,
    hourUnknown: true
  });
  assert.strictEqual(x.pillars.hour, null);
});

ok("출생시간 미상 경고가 계산 결과에 포함된다", () => {
  const x = calc({
    year: 1991, month: 11, day: 23,
    hourUnknown: true
  });
  const rows = x.calculation && x.calculation.boundaryDiagnostics || [];
  assert(rows.some(r => r && r.type === "hour-unknown"));
});

/*
 * 24절기 현재 엔진은 저정밀 근사 계산이다.
 * 정밀 역서 교체 전까지는 대표값이 KASI 공개값과 ±15분 범위를 넘지 않는지
 * 회귀검사만 수행한다. 이 테스트는 "정밀 계산 완료"를 의미하지 않는다.
 */
const termSamples = [
  // year, term index, expected KST [month, day, hour, minute]
  [2026, 2, [2, 4, 5, 2]],   // 입춘
  [2026, 8, [5, 5, 20, 49]], // 입하
  [2026, 14, [8, 7, 20, 43]],// 입추
  [2027, 2, [2, 4, 10, 46]], // 입춘
  [2028, 2, [2, 4, 16, 31]]  // 입춘
];

for (const [year, index, exp] of termSamples) {
  ok(`${year} ${S.SOLAR_TERM_NAMES[index]} 절기시각 ±15분 회귀`, () => {
    const got = S.solarTermInfo(year, index).kst;
    const gotMin = kstMinutes(got);
    const expMin = Date.UTC(year, exp[0] - 1, exp[1], exp[2], exp[3]) / 60000;
    const diff = Math.abs(gotMin - expMin);
    assert(
      diff <= 15,
      `${year} ${S.SOLAR_TERM_NAMES[index]} 오차 ${diff}분 (허용 15분)`
    );
  });
}

ok("핵심 API가 노출되어 있다", () => {
  [
    "calculate",
    "lunarToSolar",
    "flowForDate",
    "solarTermInfo",
    "relationsWithTransit",
    "boundaryDiagnostics"
  ].forEach(name => assert.strictEqual(typeof S[name], "function", `${name} missing`));
});

console.log("\nGolden Chart baseline: ALL PASS");
console.log("주의: 절입 정밀도·역사적 timezone/DST·해외 timezone은 다음 정밀화 단계의 별도 Gate 대상입니다.");
