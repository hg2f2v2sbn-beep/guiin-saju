"use strict";
const assert=require("assert"),G=require("./server-runtime-guard.js"),R=require("./server-recovery-policy.js");
function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}
ok("payments fail closed by default",()=>assert.strictEqual(G.runtimeDecision({states:{},route:"/api/orders",method:"POST"}).error,"payments_disabled"));
ok("maintenance blocks non-health",()=>assert.strictEqual(G.runtimeDecision({states:{MAINTENANCE_MODE:"true"},route:"/api/chat",method:"POST"}).error,"maintenance_mode"));
ok("read only blocks writes",()=>assert.strictEqual(G.runtimeDecision({states:{READ_ONLY_MODE:"true",PAYMENTS_DISABLED:"false"},route:"/api/profiles",method:"POST"}).error,"read_only_mode"));
ok("AI switch blocks AI only",()=>assert.strictEqual(G.runtimeDecision({states:{AI_DISABLED:"true",PAYMENTS_DISABLED:"false"},route:"/api/chat",method:"POST"}).error,"ai_temporarily_disabled"));
ok("payment gate requires everything",()=>assert.strictEqual(G.paymentSafetyDecision({launchReady:true,paymentFlag:true,dbReady:true,pgVerified:false}).enabled,false));
ok("transient failures retry",()=>assert.strictEqual(R.classifyFailure({code:"upstream_timeout"}).retry,true));
ok("security failures do not retry",()=>assert.strictEqual(R.classifyFailure({code:"signature_invalid"}).retry,false));
ok("money failure becomes critical",()=>assert.strictEqual(R.incidentSeverity({className:"transient",moneyAffected:true}),"critical"));
ok("rollback requires reversible safe state",()=>assert.strictEqual(R.rollbackDecision({newVersionHealthy:false,oldVersionAvailable:true,migrationReversible:true,dataIntegrityOkay:true}).rollback,true));
ok("integrity violations enumerated",()=>assert.deepStrictEqual(R.integrityIssues({walletNegative:1,paidNotFulfilled:2}),["wallet_negative","paid_not_fulfilled"]));
console.log("Reliability failure safety v1: ALL PASS");
