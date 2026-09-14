"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v4.5-payment-recovery-preview.js","utf8");
for(const x of [
  "4.5-payment-recovery-preview","purchaseRestoreSnapshot","findPaymentRecoveryIssues",
  "findRefundRecoveryIssues","recordReconciliationRun","/api/me/purchases","/api/me/restore-summary"
])assert(s.includes(x),x+" missing");
assert(!s.includes('url.pathname==="/api/admin/reconcile"'));
assert(!s.includes('url.pathname==="/api/refunds/execute"'));
console.log("Worker v4.5 recovery preview: ALL PASS");
