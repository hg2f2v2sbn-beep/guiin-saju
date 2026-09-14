"use strict";
const assert=require("assert");
const Launch=require("./server-launch-gate.js");
const Money=require("./server-money.js");
const Accounting=require("./server-accounting.js");
const Payment=require("./server-payment.js");
const Ent=require("./server-entitlement.js");
const Refund=require("./server-refund.js");
const Recon=require("./server-reconciliation.js");
const Runtime=require("./server-runtime-guard.js");
const Recovery=require("./server-recovery-policy.js");
const Session=require("./server-session-security.js");
const Authz=require("./server-authz-security.js");
const Security=require("./server-security.js");
const Restore=require("./server-purchase-restore.js");

function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("AI no-loss invariant",()=>{
  assert.strictEqual(Money.shouldSpendReservation("AI_SUCCESS",true),false);
  assert.strictEqual(Money.shouldSpendReservation("STORED",true),true);
  assert.strictEqual(Money.shouldReleaseReservation("FAILED_RETRYABLE"),true);
});

ok("wallet reserve does not reduce balance",()=>{
  const x=Money.buildWalletReservation({userId:"u1",balance:3,reservedBalance:0,amount:1,requestId:"r1",idempotencyKey:"idem_123456789012"});
  assert.strictEqual(x.balance_after,3);
  assert.strictEqual(x.reserved_after,1);
});

ok("server price and verified payment required",()=>{
  const product={id:"p",product_code:"LIFETIME_SAJU",product_type:"report",name:"평생사주",price_amount:5900,currency:"KRW",benefits_json:'{"entitlement":"lifetime_saju"}'};
  const order=Payment.createOrderPlan({subject:{type:"guest",id:"g"},product,idempotencyKey:"order_123456789012"});
  assert.strictEqual(order.amount,5900);
  assert.strictEqual(Payment.verifyPaymentFacts({order:{amount:5900,currency:"KRW"},providerPayment:{amount:5900,currency:"KRW",status:"PAID"}}).ok,true);
  assert.strictEqual(Ent.fulfillmentAllowed({orderState:"PAID",paymentState:"VERIFIED",verified:true}),true);
});

ok("refund used clover blocked",()=>{
  const x=Refund.refundEligibility({orderState:"FULFILLED",paymentState:"VERIFIED",benefit:{kind:"wallet_credit"},creditsGranted:2,creditsConsumed:1});
  assert.strictEqual(x.allowed,false);
});

ok("reconciliation catches paid-not-fulfilled",()=>{
  assert.strictEqual(Recon.detectPaymentIssue({order:{state:"PAID"},payment:{state:"VERIFIED"},entitlements:[],walletLedger:[]}).issue,"PAID_NOT_FULFILLED");
});

ok("runtime payment fail-closed",()=>{
  assert.strictEqual(Runtime.runtimeDecision({states:{},route:"/api/orders",method:"POST"}).error,"payments_disabled");
});

ok("security and session protections",()=>{
  assert.strictEqual(Security.originAllowed("https://evil.example"),false);
  const now=Date.now();
  const row={last_seen_at:new Date(now-120000).toISOString(),created_at:new Date(now-120000).toISOString(),expires_at:new Date(now+60000).toISOString(),idle_timeout_seconds:60};
  assert.strictEqual(Session.sessionDecision(row,now).active,false);
  assert.strictEqual(Authz.adminDecision({subject:{type:"guest",id:"x"},adminSecurity:null}).allowed,false);
});

ok("purchase restore is account-bound summary",()=>{
  const x=Restore.restoreSummary({orders:[{state:"FULFILLED"}],entitlements:[{state:"ACTIVE",entitlement_type:"lifetime_saju"}],walletLedger:[]});
  assert.strictEqual(x.fulfilled_order_count,1);
  assert.strictEqual(x.active_entitlements.length,1);
});

ok("data integrity issues are launch blockers",()=>{
  assert.deepStrictEqual(Recovery.integrityIssues({walletNegative:1}),["wallet_negative"]);
});

ok("launch gate fails when legal and PG missing",()=>{
  const synthetic=Launch.REQUIRED_GATES
    .filter(([k])=>!["legal_ready","pg_verified"].includes(k))
    .map(([gate_key,category])=>({gate_key,category,state:"PASS"}));
  const report=Launch.evaluate(synthetic);
  assert.strictEqual(report.ready,false);
  assert(report.failed.includes("legal_ready"));
  assert(report.failed.includes("pg_verified"));
  assert.strictEqual(Launch.paymentMayEnable(report),false);
});

ok("launch gate only passes when all required gates pass",()=>{
  const all=Launch.REQUIRED_GATES.map(([gate_key,category])=>({gate_key,category,state:"PASS"}));
  const report=Launch.evaluate(all);
  assert.strictEqual(report.ready,true);
  assert.strictEqual(report.failed_count,0);
  assert.strictEqual(Launch.paymentMayEnable(report),true);
});

console.log("\nLaunch Gate E2E v1: ALL PASS");
