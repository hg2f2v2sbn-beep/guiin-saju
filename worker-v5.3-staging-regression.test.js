"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v5.3-staging-preview.js","utf8");
for(const x of ["5.3-staging-preview","stagingReadiness","/api/staging/readiness","NEW_PAYMENTS_ENABLED","SERVER_WALLET_ENABLED","SERVER_FREE_QUOTA_ENABLED"])assert(s.includes(x),x+" missing");
console.log("Worker v5.3 staging preview: ALL PASS");
