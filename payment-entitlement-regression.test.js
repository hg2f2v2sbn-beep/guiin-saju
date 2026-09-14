"use strict";
const assert=require("assert"),P=require("./server-payment.js"),E=require("./server-entitlement.js");
function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}

const product={id:"p1",product_code:"CLOVER_2",product_type:"wallet",name:"클로버 2개",price_amount:1650,currency:"KRW",benefits_json:'{"credits":2}'};

ok("order snapshots server product price",()=>{
  const x=P.createOrderPlan({subject:{type:"guest",id:"g"},product,idempotencyKey:"order_1234567890"});
  assert.strictEqual(x.amount,1650);assert.strictEqual(x.currency,"KRW");
});
ok("amount mismatch blocks payment",()=>{
  assert.strictEqual(P.verifyPaymentFacts({order:{amount:1650,currency:"KRW"},providerPayment:{amount:1100,currency:"KRW",status:"PAID"}}).reason,"amount_mismatch");
});
ok("provider paid exact amount verifies",()=>{
  assert.deepStrictEqual(P.verifyPaymentFacts({order:{amount:1650,currency:"KRW"},providerPayment:{amount:1650,currency:"KRW",status:"PAID"}}),{ok:true});
});
ok("clover benefit comes from product snapshot",()=>{
  assert.deepStrictEqual(P.benefitPlan(P.productSnapshot(product)),{kind:"wallet_credit",credits:2});
});
ok("entitlement only after verified payment",()=>{
  assert.strictEqual(E.fulfillmentAllowed({orderState:"PAID",paymentState:"VERIFIED",verified:true}),true);
  assert.strictEqual(E.fulfillmentAllowed({orderState:"PAID",paymentState:"INITIATED",verified:false}),false);
});
ok("used wallet credit blocks automatic refund",()=>{
  assert.strictEqual(P.refundEffect({benefit:{kind:"wallet_credit",credits:2},creditsSpent:1}).refund_allowed,false);
});
ok("processed webhook replays safely",()=>{
  assert.strictEqual(P.webhookReplayDecision({state:"PROCESSED"}),"replay_success");
});
console.log("\nPayment + entitlement v1: ALL PASS");
