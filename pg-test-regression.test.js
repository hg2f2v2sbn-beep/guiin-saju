"use strict";
const assert=require("assert"),P=require("./server-pg-adapter.js");
const o={id:"o1",amount:5900,currency:"KRW"};
assert.strictEqual(P.testPaymentRequest({provider:"mock",order:o,returnUrl:"https://gwiinsaju.com/payment/return"}).amount,5900);
assert.strictEqual(P.verifiedProviderPayment({order:o,providerResult:{status:"PAID",amount:5900,currency:"KRW",provider_tx_id:"tx1"}}).ok,true);
assert.strictEqual(P.verifiedProviderPayment({order:o,providerResult:{status:"PAID",amount:5901,currency:"KRW",provider_tx_id:"tx1"}}).reason,"amount_mismatch");
console.log("PG test adapter v1: ALL PASS");
