"use strict";

const assert = require("assert");
const E = require("./guiin-engine-contract.js");

function ok(label, fn) {
  try { fn(); console.log("PASS", label); }
  catch (err) { console.error("FAIL", label); throw err; }
}

ok("대운 반열린구간 경계", () => {
  const rows = [
    {ko:"갑자",fromAgeExact:4.8,toAgeExact:14.8},
    {ko:"을축",fromAgeExact:14.8,toAgeExact:24.8}
  ];
  assert.strictEqual(E.findCurrentLuckHalfOpen(rows,14.7999).ko,"갑자");
  assert.strictEqual(E.findCurrentLuckHalfOpen(rows,14.8).ko,"을축");
});

ok("diagnostics의 text 필드도 uncertainty notes에 반영", () => {
  const u = E.buildUncertainty({
    input:{hourUnknown:false},
    calculation:{boundaryDiagnostics:[
      {type:"solar-term-boundary",text:"절입 경계입니다."}
    ]}
  });
  assert.strictEqual(u.solar_term_boundary,"near_boundary");
  assert(u.notes.includes("절입 경계입니다."));
});

ok("시간미상 후보 구조를 보존", () => {
  const u = E.buildUncertainty({
    input:{hourUnknown:true},
    uncertainty:{
      unknown_time_candidates:{
        day_pillar_candidates:["정유","무술"],
        day_pillar_ambiguous:true
      }
    },
    calculation:{boundaryDiagnostics:[]}
  });
  assert.strictEqual(u.hour_pillar,"unavailable");
  assert.strictEqual(u.daeun_transition,"range");
  assert.deepStrictEqual(u.unknown_time_candidates.day_pillar_candidates,["정유","무술"]);
});

console.log("\nEngine v2 contract regression: ALL PASS");
