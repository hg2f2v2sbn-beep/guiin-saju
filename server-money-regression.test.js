"use strict";
const assert=require("assert");
const C=require("./server-contracts.js");
const M=require("./server-money.js");

function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("무료 3회 남았을 때 quota 예약 가능",()=>{
  const x=M.buildFreeQuotaReservation({guestSessionId:"g1",usedCount:2,limitCount:3});
  assert.strictEqual(x.used_after,3);
});
ok("무료 3회 소진 후 차단",()=>{
  assert.throws(()=>M.buildFreeQuotaReservation({guestSessionId:"g1",usedCount:3,limitCount:3}),/free_quota_exhausted/);
});
ok("지갑 잔액보다 많이 예약 불가",()=>{
  assert.throws(()=>M.buildWalletReservation({userId:"u1",balance:0,amount:1,requestId:"r1",idempotencyKey:"chat_1234567890"}),/insufficient_wallet_balance/);
});
ok("지갑 예약은 성공 전 최종차감하지 않음",()=>{
  const p=M.planAiCharge({freeRemaining:0,walletBalance:4});
  assert.strictEqual(p.source,"wallet");
  assert.strictEqual(p.final_charge_on,"AI_SUCCESS_AND_STORED");
});
ok("AI 실패 상태는 예약 release 대상",()=>{
  assert.strictEqual(M.shouldReleaseReservation("FAILED_RETRYABLE"),true);
  assert.strictEqual(M.shouldReleaseReservation("FAILED_FINAL"),true);
});
ok("STORED + durable 저장일 때만 spend",()=>{
  assert.strictEqual(M.shouldSpendReservation("STORED",true),true);
  assert.strictEqual(M.shouldSpendReservation("AI_SUCCESS",true),false);
  assert.strictEqual(M.shouldSpendReservation("STORED",false),false);
});
ok("ledger 합계 불변식",()=>{
  assert.strictEqual(M.validateLedgerInvariant({balanceBefore:5,delta:-1,balanceAfter:4}),true);
  assert.strictEqual(M.validateLedgerInvariant({balanceBefore:5,delta:-1,balanceAfter:3}),false);
});
ok("AI 상태 전이 reserve→processing→success→validate→stored→spent",()=>{
  let s="CREATED";
  s=C.nextAiState(s,"reserve");
  s=C.nextAiState(s,"start");
  s=C.nextAiState(s,"ai_success");
  s=C.nextAiState(s,"validate");
  s=C.nextAiState(s,"store");
  s=C.nextAiState(s,"spend");
  assert.strictEqual(s,"SPENT");
});
ok("잘못된 AI 상태전이 차단",()=>{
  assert.throws(()=>C.nextAiState("CREATED","spend"),/invalid_ai_state_transition/);
});
console.log("\nServer money authority v1: ALL PASS");
