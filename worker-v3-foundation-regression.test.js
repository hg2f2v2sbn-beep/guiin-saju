"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("worker-v3-foundation.js","utf8");
for(const x of [
  "/api/session/guest","/api/me/usage",
  "guest_sessions","usage_quotas","wallet_accounts",
  "paymentsEnabled:false","server_runtime_unavailable"
])assert(s.includes(x),x+" missing");
assert(!s.includes("NEW_PAYMENTS_ENABLED = true"));
console.log("Worker v3 foundation static regression: ALL PASS");
