"use strict";
const assert=require("assert"),A=require("./server-accounting.js");
function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}
ok("flags off",()=>assert.strictEqual(A.selectSource({freeUsed:0,freeLimit:3,walletBalance:5}).reason,"accounting_disabled"));
ok("free preferred",()=>assert.strictEqual(A.selectSource({freeEnabled:true,walletEnabled:true,freeUsed:1,freeLimit:3,walletBalance:5}).source,"free_quota"));
ok("wallet fallback",()=>assert.strictEqual(A.selectSource({freeEnabled:true,walletEnabled:true,freeUsed:3,freeLimit:3,walletBalance:5,walletReserved:1}).source,"wallet"));
ok("stored durable spend",()=>assert.deepStrictEqual(A.finalizeDecision({source:"wallet",aiState:"STORED",durableResultStored:true}),{action:"spend"}));
ok("failure release",()=>assert.deepStrictEqual(A.finalizeDecision({source:"free_quota",aiState:"FAILED_RETRYABLE"}),{action:"release"}));
ok("success requires finalize",()=>{assert.strictEqual(A.mayReturnPaidSuccess({aiState:"STORED",durableResultStored:true,finalizeAction:"spend",finalizeSucceeded:true}),true);assert.strictEqual(A.mayReturnPaidSuccess({aiState:"STORED",durableResultStored:true,finalizeAction:"spend",finalizeSucceeded:false}),false)});
console.log("\nServer accounting v2: ALL PASS");
