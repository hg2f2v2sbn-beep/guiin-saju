"use strict";
const assert=require("assert");
const P=require("./server-profile.js");
const C=require("./server-conversation.js");
const G=require("./server-guest-conversion.js");

function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("profile canonical ignores display name for chart identity",()=>{
  const a=P.canonicalChartInput({name:"A",calendar:"양력",year:1991,month:11,day:23,hour:7,minute:40,gender:"여"});
  const b=P.canonicalChartInput({name:"B",calendar:"양력",year:1991,month:11,day:23,hour:7,minute:40,gender:"여"});
  assert.deepStrictEqual(a,b);
});
ok("hour unknown removes hour/minute",()=>{
  const x=P.normalizeProfileInput({calendar:"양력",year:1991,month:11,day:23,hourUnknown:true});
  assert.strictEqual(x.birth_hour,null);assert.strictEqual(x.birth_minute,null);
});
ok("stable stringify key order",()=>{
  assert.strictEqual(P.stableStringify({b:1,a:2}),P.stableStringify({a:2,b:1}));
});
ok("ownership does not cross users",()=>{
  assert.strictEqual(P.canAccessOwnedResource({resourceUserId:"u1",userId:"u2"}),false);
  assert.strictEqual(P.canAccessOwnedResource({resourceGuestId:"g1",guestSessionId:"g1"}),true);
});
ok("conversation compaction keeps latest",()=>{
  const rows=Array.from({length:20},(_,i)=>({role:i%2?"assistant":"user",content:"x".repeat(600)+i}));
  const c=C.compactHistory(rows,2500);
  assert(c.length<20);
  assert(c[c.length-1].content.endsWith("19"));
});
ok("guest wallet merges without loss",()=>{
  assert.strictEqual(G.mergeWalletBalance(4,3),7);
});
ok("guest free quota cannot reset on signup",()=>{
  assert.deepStrictEqual(G.mergeLifetimeQuota({userUsed:1,guestUsed:2,limit:3}),{used:3,limit:3,remaining:0});
});
ok("guest conversion contains audit as last step",()=>{
  const p=G.planGuestConversion({guestSessionId:"g",userId:"u"});
  assert.strictEqual(p[p.length-1].action,"write_audit_log");
});
console.log("\nServer profile/conversation v1: ALL PASS");
