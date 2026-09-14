"use strict";
const assert=require("assert"),E=require("./external-gate-evaluator.js");
const all=Object.fromEntries(E.EXTERNAL_GATES.map(k=>[k,"PASS"]));
assert.strictEqual(E.evaluate(all).ready,true);
const no={...all,PG_TEST_VERIFIED:"PENDING"};
assert.strictEqual(E.evaluate(no).ready,false);
assert.strictEqual(E.canEnableProductionPayments({codeReady:true,externalChecks:no,newPaymentsEnabled:true}).allowed,false);
assert.strictEqual(E.canEnableProductionPayments({codeReady:true,externalChecks:all,newPaymentsEnabled:false}).reason,"payment_flag_off");
console.log("External gate evaluator: ALL PASS");
