"use strict";
const assert=require("assert"),G=require("./server-guest-conversion.js"),A=require("./server-account-link.js");
function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}

ok("active reservations block conversion",()=>{
  assert.strictEqual(G.canBeginConversion({requestedUserId:"u",activeWalletReservations:1}).reason,"active_reservation_exists");
});
ok("wallet merge preserves all credits",()=>{
  assert.deepStrictEqual(G.mergeWallet({userBalance:3,guestBalance:2}),{balance:5,reserved_balance:0});
});
ok("signup never resets free quota",()=>{
  assert.deepStrictEqual(G.mergeLifetimeQuota({userUsed:1,guestUsed:2,limit:3}),{used:3,reserved:0,limit:3,remaining:0});
});
ok("already completed link replays",()=>{
  assert.strictEqual(G.linkReplayDecision({user_id:"u1",state:"COMPLETED"},"u1"),"replay");
});
ok("link requires authenticated user and guest possession",()=>{
  assert.throws(()=>A.validateLinkRequest({userSubject:{type:"guest",id:"g"},guestSession:{id:"g"},guestTokenPresented:true,idempotencyKey:"link_123456789012"}),/authenticated_user_required/);
});
console.log("Account link restore v1: ALL PASS");
