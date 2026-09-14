"use strict";
const assert=require("assert"),S=require("./server-session-security.js"),A=require("./server-authz-security.js"),O=require("./server-ops-safety.js");const now=Date.now();
function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}
ok("active session",()=>assert.strictEqual(S.sessionDecision({created_at:new Date(now-1000).toISOString(),last_seen_at:new Date(now-1000).toISOString(),expires_at:new Date(now+60000).toISOString(),absolute_expires_at:new Date(now+120000).toISOString(),idle_timeout_seconds:60},now).active,true));
ok("idle expiry",()=>assert.strictEqual(S.sessionDecision({created_at:new Date(now-120000).toISOString(),last_seen_at:new Date(now-120000).toISOString(),expires_at:new Date(now+60000).toISOString(),idle_timeout_seconds:60},now).reason,"idle_expired"));
ok("CSRF cookie",()=>assert.strictEqual(A.csrfRequired({authMode:"cookie",method:"POST"}),true));
ok("MFA gate",()=>assert.strictEqual(A.adminDecision({subject:{type:"user",id:"u1"},adminSecurity:{user_id:"u1",mfa_required:1,access_enabled:1,mfa_verified_at:new Date(now-60000).toISOString()},nowMs:now}).allowed,true));
ok("launch fail closed",()=>assert.strictEqual(O.launchGate({authentication:true}).ready,false));
console.log("Security hardening v2: ALL PASS");
