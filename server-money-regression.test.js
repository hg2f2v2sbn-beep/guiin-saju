"use strict";
const assert=require("assert"),C=require("./server-contracts.js"),M=require("./server-money.js");
function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}
ok("무료 reserve는 reserved만 증가",()=>{const x=M.buildFreeQuotaReservation({guestSessionId:"g1",usedCount:2,reservedCount:0,limitCount:3});assert.strictEqual(x.used_after,3);assert.strictEqual(x.reserved_after,1)});
ok("예약된 무료횟수도 가용량에서 제외",()=>assert.throws(()=>M.buildFreeQuotaReservation({guestSessionId:"g1",usedCount:2,reservedCount:1,limitCount:3}),/free_quota_exhausted/));
ok("지갑 reserve는 balance 유지",()=>{const x=M.buildWalletReservation({userId:"u1",balance:4,reservedBalance:1,amount:1,requestId:"r1",idempotencyKey:"chat_1234567890"});assert.strictEqual(x.balance_after,4);assert.strictEqual(x.reserved_after,2)});
ok("지갑 부족 차단",()=>assert.throws(()=>M.buildWalletReservation({userId:"u1",balance:1,reservedBalance:1,amount:1,requestId:"r1",idempotencyKey:"chat_1234567890"}),/insufficient_wallet_balance/));
ok("STORED+durable만 spend",()=>{assert.strictEqual(M.shouldSpendReservation("STORED",true),true);assert.strictEqual(M.shouldSpendReservation("AI_SUCCESS",true),false)});
ok("wallet spend/release",()=>{assert.deepStrictEqual(M.walletAfterSpend({balance:5,reservedBalance:2,amount:1}),{balance:4,reserved_balance:1});assert.deepStrictEqual(M.walletAfterRelease({balance:5,reservedBalance:2,amount:1}),{balance:5,reserved_balance:1})});
ok("quota spend/release",()=>{assert.deepStrictEqual(M.quotaAfterSpend({usedCount:1,reservedCount:1,amount:1,limitCount:3}),{used_count:2,reserved_count:0,limit_count:3});assert.deepStrictEqual(M.quotaAfterRelease({usedCount:1,reservedCount:1,amount:1,limitCount:3}),{used_count:1,reserved_count:0,limit_count:3})});
ok("AI 상태 전이",()=>{let s="CREATED";s=C.nextAiState(s,"reserve");s=C.nextAiState(s,"start");s=C.nextAiState(s,"ai_success");s=C.nextAiState(s,"validate");s=C.nextAiState(s,"store");s=C.nextAiState(s,"spend");assert.strictEqual(s,"SPENT")});
console.log("\nServer money authority v2: ALL PASS");
