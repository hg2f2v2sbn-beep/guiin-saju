"use strict";
const assert=require("assert");
const T=require("./server-ai-transaction.js");

function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("begin plan owns request by subject",()=>{
  const x=T.beginPlan({subject:{type:"guest",id:"g1"},idempotencyKey:"idem_123456789012",requestId:"r1"});
  assert.strictEqual(x.guest_session_id,"g1");
  assert.strictEqual(x.user_id,null);
  assert.strictEqual(x.state,"PROCESSING");
});
ok("success store still cannot charge",()=>{
  const x=T.successStorePlan({aiRequestId:"a1",requestId:"r1",answer:"ok"});
  assert.strictEqual(x.final_state,"STORED");
  assert.strictEqual(x.may_charge,false);
});
ok("failed AI never charges",()=>{
  const x=T.failurePlan({state:"PROCESSING",retryable:true});
  assert.strictEqual(x.to_state,"FAILED_RETRYABLE");
  assert.strictEqual(x.may_charge,false);
});
ok("replay returns stored answer",()=>{
  const x=T.replayDecision({requestRow:{state:"STORED"},resultRow:{response_text:"saved"}});
  assert.deepStrictEqual(x,{kind:"replay",answer:"saved"});
});
ok("charge requires stored result and explicit accounting enable",()=>{
  assert.strictEqual(T.canFinalizeCharge({aiState:"STORED",resultExists:true,serverAccountingEnabled:false}),false);
  assert.strictEqual(T.canFinalizeCharge({aiState:"STORED",resultExists:true,serverAccountingEnabled:true}),true);
  assert.strictEqual(T.canFinalizeCharge({aiState:"AI_SUCCESS",resultExists:true,serverAccountingEnabled:true}),false);
});
console.log("\nAI transaction v1 contracts: ALL PASS");
