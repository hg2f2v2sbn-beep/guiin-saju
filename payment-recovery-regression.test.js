"use strict";
const assert=require("assert");
const R=require("./server-refund.js"),Q=require("./server-reconciliation.js"),P=require("./server-purchase-restore.js");
function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}

ok("unused clover can be refund candidate",()=>{
  const x=R.refundEligibility({orderState:"FULFILLED",paymentState:"VERIFIED",benefit:{kind:"wallet_credit"},creditsGranted:2,creditsConsumed:0});
  assert.strictEqual(x.allowed,true);
});
ok("used clover blocks auto refund",()=>{
  const x=R.refundEligibility({orderState:"FULFILLED",paymentState:"VERIFIED",benefit:{kind:"wallet_credit"},creditsGranted:2,creditsConsumed:1});
  assert.strictEqual(x.allowed,false);assert.strictEqual(x.reason,"wallet_credit_already_used");
});
ok("refund amount must match provider",()=>{
  assert.strictEqual(R.verifyRefund({refund:{amount:5900,currency:"KRW"},providerRefund:{amount:5900,currency:"KRW",status:"REFUNDED"}}).ok,true);
  assert.strictEqual(R.verifyRefund({refund:{amount:5900,currency:"KRW"},providerRefund:{amount:100,currency:"KRW",status:"REFUNDED"}}).reason,"refund_amount_mismatch");
});
ok("webhook exponential retry capped",()=>{
  assert.deepStrictEqual(Q.nextWebhookRetry({retryCount:0}),{retry_count:1,delay_seconds:60});
  assert.strictEqual(Q.nextWebhookRetry({retryCount:99}).delay_seconds,3600);
});
ok("detect paid but not fulfilled",()=>{
  const x=Q.detectPaymentIssue({order:{state:"PAID"},payment:{state:"VERIFIED"},entitlements:[],walletLedger:[]});
  assert.strictEqual(x.issue,"PAID_NOT_FULFILLED");
});
ok("detect refund entitlement leak",()=>{
  const x=Q.detectRefundIssue({refund:{state:"VERIFIED"},order:{state:"REFUNDED"},payment:{state:"REFUNDED"},activeEntitlements:[{id:"e"}]});
  assert.strictEqual(x.issue,"REFUNDED_ENTITLEMENT_STILL_ACTIVE");
});
ok("purchase restore summarizes",()=>{
  const x=P.restoreSummary({orders:[{state:"FULFILLED"}],entitlements:[{state:"ACTIVE",entitlement_type:"lifetime_saju"}],walletLedger:[{kind:"PURCHASE",delta:2},{kind:"AI_CHAT",delta:-1}]});
  assert.strictEqual(x.fulfilled_order_count,1);assert.strictEqual(x.wallet_purchase_credits,2);assert.strictEqual(x.wallet_spent_credits,1);
});
console.log("\nPayment recovery v1: ALL PASS");
