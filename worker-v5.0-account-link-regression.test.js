"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v5.0-account-link-preview.js","utf8");
for(const x of ["5.0-account-link-preview","/api/auth/link-guest","linkGuestToUser","activeGuestReservations","converted_to_user","account_link_events"])assert(s.includes(x),x+" missing");
assert(s.includes("user_session_required"));
assert(s.includes("guest_session_required"));
assert(s.includes("idempotency_key_required"));
console.log("Worker v5 account link preview: ALL PASS");
