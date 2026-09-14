"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("worker-v3-unified-foundation.js","utf8");
for(const x of ["/api/session/guest","/api/auth/status","/api/me/usage","/api/me/entitlements","/api/auth/convert-guest","/api/profiles","/api/conversations","paymentsEnabled:false"])assert(s.includes(x),x+" missing");
assert(s.includes("guest_already_converted"));
assert(s.includes("INSERT OR IGNORE INTO messages"));
console.log("Worker v3.2 unified static regression: ALL PASS");
