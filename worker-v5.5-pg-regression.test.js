"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v5.5-pg-test-preview.js","utf8");
for(const x of ["5.5-pg-test-preview","verifyWebhookRequest","PG_TEST_WEBHOOK_SECRET","signature_invalid","inicis_signature_adapter_not_configured"])assert(s.includes(x),x+" missing");
console.log("Worker v5.5 PG test preview: ALL PASS");
