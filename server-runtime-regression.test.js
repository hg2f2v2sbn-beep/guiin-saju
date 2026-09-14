"use strict";
const assert=require("assert");
const A=require("./server-auth.js");
const X=require("./server-api-contracts.js");

function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("guest token format",()=>{
  assert.strictEqual(A.requireGuestToken("gst_"+"a".repeat(40)).startsWith("gst_"),true);
  assert.throws(()=>A.requireGuestToken("bad"),/invalid_token/);
});
ok("subject prefers user",()=>{
  assert.deepStrictEqual(A.sessionSubject({userId:"u1",guestSessionId:"g1"}),{type:"user",id:"u1"});
});
ok("guest conversion cannot move twice to another user",()=>{
  assert.strictEqual(A.canConvertGuest({guestSessionId:"g",userId:"u1",guestAlreadyConvertedTo:"u2"}),false);
  assert.strictEqual(A.canConvertGuest({guestSessionId:"g",userId:"u1",guestAlreadyConvertedTo:"u1"}),true);
});
ok("usage shape",()=>{
  assert.deepStrictEqual(X.usageShape({freeUsed:2,freeLimit:3,walletBalance:4}),{
    free:{used:2,limit:3,remaining:1},
    wallet:{balance:4}
  });
});
ok("route contract includes guest and usage",()=>{
  assert.strictEqual(X.ROUTES.GUEST_CREATE,"POST /api/session/guest");
  assert.strictEqual(X.ROUTES.USAGE_GET,"GET /api/me/usage");
});
console.log("\nServer runtime contract v1: ALL PASS");
