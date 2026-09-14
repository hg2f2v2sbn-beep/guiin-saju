"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v5.6-legal-failure-gate-preview.js","utf8");
for(const x of ["5.6-legal-failure-gate-preview","legalReadiness","/api/legal/readiness","TERMS_APPROVED","ECOMMERCE_REPORTING_STATUS_CONFIRMED","LEGAL_REVIEW_COMPLETED"])assert(s.includes(x),x+" missing");
console.log("Worker v5.6 legal failure gate: ALL PASS");
