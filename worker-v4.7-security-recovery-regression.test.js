"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v4.7-security-recovery-preview.js","utf8");
for(const x of ["4.7-security-recovery-preview","paymentLaunchGate","adminGate","absolute_expires_at","idle_timeout_seconds","paymentLaunchReady","paymentLaunchFailed","LEGAL_READY","PG_VERIFIED"])assert(s.includes(x),x+" missing");
console.log("Worker v4.7 security recovery preview: ALL PASS");
