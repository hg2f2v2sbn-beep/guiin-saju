"use strict";
const assert=require("assert"),S=require("./server-security.js"),L=require("./server-safe-logging.js");
function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}

ok("origin allowlist",()=>{
  assert.strictEqual(S.originAllowed("https://gwiinsaju.com"),true);
  assert.strictEqual(S.originAllowed("https://evil.example"),false);
});
ok("sensitive routes require session",()=>{
  assert.strictEqual(S.requiresSession("/api/me/purchases","GET"),true);
  assert.strictEqual(S.requiresSession("/api/session/guest","POST"),false);
});
ok("AI body limit larger than normal but bounded",()=>{
  assert.strictEqual(S.bodyLimit("/api/chat"),65536);
  assert(S.bodyLimit("/api/profiles")<65536);
});
ok("logs redact token and PII fields",()=>{
  const x=S.safeLogMetadata({authorization:"Bearer secret",email:"a@b.com",birth_year:1991,nested:{phone:"01012345678",safe:"ok"}});
  assert.strictEqual(x.authorization,"[REDACTED]");
  assert.strictEqual(x.email,"[REDACTED]");
  assert.strictEqual(x.birth_year,"[REDACTED]");
  assert.strictEqual(x.nested.phone,"[REDACTED]");
  assert.strictEqual(x.nested.safe,"ok");
});
ok("admin is allowlist only",()=>{
  assert.strictEqual(S.adminAllowed({subject:{type:"user",id:"u1"},adminIds:["u1"]}),true);
  assert.strictEqual(S.adminAllowed({subject:{type:"guest",id:"u1"},adminIds:["u1"]}),false);
});
ok("safe log object itself has no raw auth token",()=>{
  const x=L.requestLog({requestId:"r",method:"POST",path:"/api/chat",status:200,metadata:{authorization:"Bearer abcdefghijklmnop"}});
  assert.strictEqual(L.containsForbiddenPII(JSON.stringify(x)),false);
});
console.log("\nSecurity hardening v1: ALL PASS");
