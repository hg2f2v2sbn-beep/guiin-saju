"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("worker-v3-data-foundation.js","utf8");
for(const x of [
  "/api/profiles","/api/conversations",
  "/messages","guest_session_required","paymentsEnabled:false"
]) assert(s.includes(x),x+" missing");
assert(s.includes("INSERT OR IGNORE INTO messages"));
console.log("Worker v3 data foundation static regression: ALL PASS");
