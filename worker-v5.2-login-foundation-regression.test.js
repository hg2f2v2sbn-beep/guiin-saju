"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v5.2-login-foundation-preview.js","utf8");
for(const x of ["5.2-login-foundation-preview","/api/auth/login/start","/api/auth/logout","provider_not_configured","createLoginState","revokeCurrentUserSession"])assert(s.includes(x),x+" missing");
assert(!s.includes('url.pathname==="/api/auth/provider/callback"'));
console.log("Worker v5.2 login foundation: ALL PASS");
