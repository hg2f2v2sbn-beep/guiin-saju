"use strict";
const assert=require("assert");
const S=require("./server-session.js");
const O=require("./server-ownership.js");
function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}
ok("valid user bearer",()=>{const t="usr_"+"a".repeat(40);assert.strictEqual(S.requireBearerHeader("Bearer "+t),t)});
ok("revoked session inactive",()=>{assert.strictEqual(S.sessionIsActive({expires_at:new Date(Date.now()+10000).toISOString(),revoked_at:"x"}),false)});
ok("user subject preferred",()=>{assert.deepStrictEqual(S.resolveSubject({userSession:{id:"s",user_id:"u"},guestSession:{id:"g"}}),{type:"user",id:"u",sessionId:"s"})});
ok("ownership columns user",()=>{assert.strictEqual(O.subjectColumns({type:"user",id:"u"}).user_id,"u")});
ok("guest cannot access user resource",()=>{assert.strictEqual(O.resourceOwnedBy({user_id:"u"},{type:"guest",id:"g"}),false)});
console.log("\nUnified auth/session contracts: ALL PASS");
