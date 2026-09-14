"use strict";
const assert = require("assert");
const E = require("./guiin-engine-contract.js");
const Q = require("./guiin-quality-gate.js");
const S = require("./server-contracts.js");

function ok(label, fn) {
  try { fn(); console.log("PASS", label); }
  catch (err) { console.error("FAIL", label); throw err; }
}

ok("대운 선택은 [start,nextStart)", () => {
  const rows = [
    {ko:"갑자",fromAgeExact:5,toAgeExact:15},
    {ko:"을축",fromAgeExact:15,toAgeExact:25}
  ];
  assert.strictEqual(E.findCurrentLuckHalfOpen(rows,14.999).ko,"갑자");
  assert.strictEqual(E.findCurrentLuckHalfOpen(rows,15).ko,"을축");
});

ok("시간미상 uncertainty는 단일 근사값이 아니라 범위", () => {
  const u=E.buildUncertainty({
    input:{hourUnknown:true},
    calculation:{boundaryDiagnostics:[]}
  });
  assert.strictEqual(u.hour_pillar,"unavailable");
  assert.strictEqual(u.daeun_transition,"range");
});

ok("오행 분포/강약 분리", () => {
  const f=E.chartFacts({
    input:{},
    pillars:{year:{ko:"신미"},month:{ko:"기해"},day:{ko:"정유"}},
    dayMaster:{stem:"정",el:"화",yin:"음"},
    elCount:{목:1,화:2,토:3,금:2,수:2},luck:[]
  });
  assert.deepStrictEqual(f.element_distribution,{목:1,화:2,토:3,금:2,수:2});
  assert.strictEqual(f.element_strength,null);
});

ok("항목 수 불일치 검출", () => {
  const r=Q.validatePlainText("세 가지를 볼게요.\n1. 하나\n2. 둘\n3. 셋\n4. 넷");
  assert.strictEqual(r.ok,false);
});

ok("공포 단정 차단", () => {
  const r=Q.validatePlainText("이 사주는 반드시 이혼합니다. 관계를 정리해야 합니다.");
  assert.strictEqual(r.ok,false);
});

ok("금액 정규화", () => {
  assert.deepStrictEqual(S.normalizeMoney(5900,"krw"),{amount:5900,currency:"KRW"});
});

console.log("\nGuiin v2 foundation contracts: ALL PASS");
