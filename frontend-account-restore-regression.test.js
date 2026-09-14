"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("guiin-account-restore.js","utf8");
for(const x of ["completeVerifiedLogin","verified_user_token_required","/api/auth/link-guest","restoreCurrentAccount","setGuestToken(\"\")"])assert(s.includes(x),x+" missing");
const clearPos=s.indexOf('setGuestToken("")');
const linkPos=s.indexOf('/api/auth/link-guest');
assert(clearPos>linkPos,"guest token must only clear after link path");
console.log("Frontend account restore v1: ALL PASS");
