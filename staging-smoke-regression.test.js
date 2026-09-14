"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("staging-e2e-smoke.mjs","utf8");
for(const x of ["/health","/api/staging/readiness","/api/final-launch/readiness","/api/session/guest","/api/me/usage","GUIIN_STAGING_BASE_URL"])assert(s.includes(x),x+" missing");
assert(s.includes('launchReady===true'));
console.log("Staging smoke script: ALL PASS");
