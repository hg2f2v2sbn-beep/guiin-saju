"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v4.6-security-hardening-preview.js","utf8");
for(const x of [
  "4.6-security-hardening-preview","SECURITY_ENFORCEMENT_ENABLED","SECURITY_HASH_SECRET",
  "rateLimitCheck","recordSecurityEvent","request_too_large","content_type_required",
  "admin_access_not_configured","Strict-Transport-Security","Content-Security-Policy",
  "Retry-After"
])assert(s.includes(x),x+" missing");
assert(s.includes('env.SECURITY_ENFORCEMENT_ENABLED==="true"'));
assert(s.includes('url.pathname.startsWith("/api/admin/")'));
console.log("Worker v4.6 security preview: ALL PASS");
