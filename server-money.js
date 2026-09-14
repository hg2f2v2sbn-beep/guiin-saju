"use strict";

/**
 * 귀인사주 서버 권한형 지갑/무료쿼터 계획 모듈.
 * 실제 DB 실행 전에 상태 전이와 금액/수량 조건을 한 곳에서 검증한다.
 */
const C = require("./server-contracts.js");

function subjectKey({userId, guestSessionId}) {
  if (userId) return {type:"user", id:String(userId)};
  if (guestSessionId) return {type:"guest", id:String(guestSessionId)};
  throw new Error("subject_required");
}

function buildFreeQuotaReservation(input) {
  const s = subjectKey(input || {});
  const used = Number(input.usedCount || 0);
  const limit = Number(input.limitCount ?? 3);
  if (!C.canUseQuota(used, limit, 1)) throw new Error("free_quota_exhausted");
  return {
    mode:"free_quota",
    subject_type:s.type,
    subject_id:s.id,
    quota_key:"ai_chat_free",
    period_key:String(input.periodKey || "lifetime"),
    amount:1,
    used_before:used,
    used_after:used+1,
    limit_count:limit
  };
}

function buildWalletReservation(input) {
  const s = subjectKey(input || {});
  const amount = C.normalizeCredits(input.amount ?? 1);
  const balance = Number(input.balance);
  if (!C.canSpendWallet(balance, amount)) throw new Error("insufficient_wallet_balance");
  return {
    mode:"wallet",
    subject_type:s.type,
    subject_id:s.id,
    amount,
    balance_before:balance,
    balance_after:balance-amount,
    request_id:String(input.requestId || ""),
    idempotency_key:C.requireIdempotencyKey(input.idempotencyKey)
  };
}

function planAiCharge(input) {
  if (input?.freeRemaining > 0) {
    return {
      source:"free_quota",
      amount:1,
      reserve_required:true,
      final_charge_on:"AI_SUCCESS_AND_STORED"
    };
  }
  const wallet = Number(input?.walletBalance || 0);
  if (wallet >= 1) {
    return {
      source:"wallet",
      amount:1,
      reserve_required:true,
      final_charge_on:"AI_SUCCESS_AND_STORED"
    };
  }
  return {
    source:"none",
    amount:0,
    reserve_required:false,
    final_charge_on:null,
    blocked_reason:"no_quota_or_wallet"
  };
}

function shouldReleaseReservation(aiState) {
  return [
    "FAILED_RETRYABLE","FAILED_FINAL","RELEASED"
  ].includes(String(aiState || ""));
}

function shouldSpendReservation(aiState, durableStored) {
  return String(aiState || "") === "STORED" && durableStored === true;
}

function validateLedgerInvariant({balanceBefore, delta, balanceAfter}) {
  const b=Number(balanceBefore), d=Number(delta), a=Number(balanceAfter);
  if (![b,d,a].every(Number.isInteger)) return false;
  if (a < 0) return false;
  return b + d === a;
}

module.exports = {
  subjectKey, buildFreeQuotaReservation, buildWalletReservation, planAiCharge,
  shouldReleaseReservation, shouldSpendReservation, validateLedgerInvariant
};
