"use strict";
const assert=require("assert");
const C=require("./server-chart-authority.js");
const A=require("./server-ai-persistence.js");

function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("chart snapshot starts unverified",()=>{
  const x=C.chartSnapshotDraft({
    subject:{type:"guest",id:"g1"},
    normalizedInput:{calendar:"양력",year:1991,month:11,day:23,hourUnknown:true},
    chartFacts:{pillars:{year:"신미",month:"기해",day:"정유"}},
    ruleVersion:"2026-09-14-v2"
  });
  assert.strictEqual(x.verification_state,"CLIENT_FACTS_UNVERIFIED");
  assert.strictEqual(C.mayUseAsAuthoritativeFacts(x),false);
});
ok("only server-engine-verified is authoritative",()=>{
  assert.strictEqual(C.mayUseAsAuthoritativeFacts({verification_state:"SERVER_ENGINE_VERIFIED"}),true);
  assert.strictEqual(C.aiPromptTrustLabel({verification_state:"SERVER_INPUT_VERIFIED"}),"server_input_verified_client_facts");
});
ok("AI result must be durably stored before accounting",()=>{
  assert.strictEqual(A.shouldChargeNow({resultStored:false,serverAccountingEnabled:true}),false);
  assert.strictEqual(A.shouldChargeNow({resultStored:true,serverAccountingEnabled:false}),false);
  assert.strictEqual(A.shouldChargeNow({resultStored:true,serverAccountingEnabled:true}),true);
});
ok("AI idempotency replay only successful states",()=>{
  assert.strictEqual(A.canReplayRequest({state:"STORED"}),true);
  assert.strictEqual(A.canReplayRequest({state:"FAILED_RETRYABLE"}),false);
});
console.log("\nChart authority + AI persistence v1: ALL PASS");
