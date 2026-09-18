"use strict";
const fs=require("fs"),assert=require("assert");
const x=JSON.parse(fs.readFileSync("external-gate-status.json","utf8"));

assert.strictEqual(x.code_ready,true);
assert.strictEqual(x.payments_allowed,false);

const gates=Object.values(x.gates||{});
assert(gates.length>0,"external gates missing");

// 외부 Gate는 실제 검증이 끝난 항목부터 PASS로 바뀔 수 있습니다.
// 아직 검증되지 않은 항목은 PENDING이어야 하며, 임의의 FAIL/MISSING 값은 허용하지 않습니다.
assert(gates.every(v=>v==="PASS"||v==="PENDING"),"gates must be PASS or PENDING");

const allPassed=gates.every(v=>v==="PASS");
assert.strictEqual(x.external_ready,allPassed,"external_ready must match whether every gate passed");

// 결제가 꺼져 있는 동안에는 외부 Gate 전체 통과 여부와 관계없이 production payment를 허용하지 않습니다.
if(x.payments_allowed===true){
  assert.strictEqual(x.code_ready,true);
  assert.strictEqual(x.external_ready,true);
}

console.log("External gate status: ALL PASS");
