"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v4.4-payment-foundation-preview.js","utf8");
for(const x of [
  "4.4-payment-foundation-preview","paymentEnabled","createOrder","ownedOrder",
  "processVerifiedPayment","fulfillOrder","provider_payment_reused",
  "payment_amount_mismatch","payments_disabled"
])assert(s.includes(x),x+" missing");
assert(s.includes('env.NEW_PAYMENTS_ENABLED==="true"'));
assert(!s.includes('url.pathname==="/api/payment/verify"'));
console.log("Worker v4.4 payment foundation: ALL PASS");
