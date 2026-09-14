"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("worker-v4-integrated-preview.js","utf8");
for(const x of ['"/api/chat"','"/api/session/guest"','"/api/me/usage"','"/api/profiles"','"/api/conversations"',"databaseReady:dbReady(env)","serverAccountingReady:false","paymentsEnabled:false","serverCharged:false","OPENAI_API_KEY","AI_IDEMPOTENCY"])assert(s.includes(x),x+" missing");
assert(s.indexOf('url.pathname==="/api/chat"') < s.indexOf('if(!dbReady(env))return json'));
assert(!s.includes("NEW_PAYMENTS_ENABLED===true"));
console.log("Integrated worker preview regression: ALL PASS");
