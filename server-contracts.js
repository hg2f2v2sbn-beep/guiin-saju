"use strict";

const ORDER_STATES = Object.freeze([
  "CREATED","PAYMENT_PENDING","PAID","ENTITLEMENT_GRANTED","FULFILLED",
  "CANCELLED","FAILED","REFUNDED","PARTIALLY_REFUNDED"
]);

const PAYMENT_STATES = Object.freeze([
  "CREATED","PENDING","APPROVED","FAILED","CANCELLED","REFUNDED","PARTIALLY_REFUNDED"
]);

const ENTITLEMENT_STATES = Object.freeze([
  "ACTIVE","REVOKED","EXPIRED"
]);

const AI_REQUEST_STATES = Object.freeze([
  "CREATED","RESERVED","PROCESSING","AI_SUCCESS","VALIDATING","STORED",
  "SPENT","RELEASED","FAILED_RETRYABLE","FAILED_FINAL"
]);

const REPORT_STATES = Object.freeze([
  "NOT_STARTED","QUEUED","GENERATING","VALIDATING","READY",
  "FAILED_RETRYABLE","FAILED_FINAL"
]);

const WALLET_RESERVATION_STATES = Object.freeze([
  "RESERVED","SPENT","RELEASED","EXPIRED"
]);

const FEATURE_FLAGS = Object.freeze([
  "AI_CHAT_ENABLED","AI_REPORT_ENABLED","NEW_PAYMENTS_ENABLED","SOCIAL_LOGIN_ENABLED",
  "SERVER_WALLET_ENABLED","SERVER_FREE_QUOTA_ENABLED"
]);

function requireIdempotencyKey(value) {
  const key = String(value || "").trim();
  if (key.length < 12 || key.length > 200) throw new Error("invalid_idempotency_key");
  if (!/^[A-Za-z0-9._:-]+$/.test(key)) throw new Error("invalid_idempotency_key");
  return key;
}

function normalizeMoney(amount, currency = "KRW") {
  const a = Number(amount);
  if (!Number.isInteger(a) || a < 0) throw new Error("invalid_amount");
  const c = String(currency || "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) throw new Error("invalid_currency");
  return { amount:a, currency:c };
}

function normalizeCredits(amount) {
  const a = Number(amount);
  if (!Number.isInteger(a) || a <= 0 || a > 1000000) throw new Error("invalid_credit_amount");
  return a;
}

function canSpendWallet(balance, amount = 1) {
  const b = Number(balance), a = Number(amount);
  return Number.isInteger(b) && Number.isInteger(a) && b >= a && a > 0;
}

function quotaRemaining(used, limit) {
  const u = Number(used), l = Number(limit);
  if (!Number.isInteger(u) || !Number.isInteger(l) || u < 0 || l < 0) {
    throw new Error("invalid_quota");
  }
  return Math.max(0, l - u);
}

function canUseQuota(used, limit, amount = 1) {
  const a = Number(amount);
  if (!Number.isInteger(a) || a <= 0) return false;
  return quotaRemaining(used, limit) >= a;
}

function nextAiState(current, event) {
  const map = {
    CREATED:{reserve:"RESERVED",fail:"FAILED_FINAL"},
    RESERVED:{start:"PROCESSING",release:"RELEASED",fail:"FAILED_RETRYABLE"},
    PROCESSING:{ai_success:"AI_SUCCESS",release:"RELEASED",fail:"FAILED_RETRYABLE"},
    AI_SUCCESS:{validate:"VALIDATING",release:"RELEASED",fail:"FAILED_RETRYABLE"},
    VALIDATING:{store:"STORED",release:"RELEASED",fail:"FAILED_RETRYABLE"},
    STORED:{spend:"SPENT",release:"RELEASED"},
    FAILED_RETRYABLE:{reserve:"RESERVED",fail:"FAILED_FINAL"},
    SPENT:{},
    RELEASED:{},
    FAILED_FINAL:{}
  };
  const next = map[current]?.[event];
  if (!next) throw new Error("invalid_ai_state_transition");
  return next;
}

function nextWalletReservationState(current, event) {
  const map = {
    RESERVED:{spend:"SPENT",release:"RELEASED",expire:"EXPIRED"},
    SPENT:{},
    RELEASED:{},
    EXPIRED:{}
  };
  const next = map[current]?.[event];
  if (!next) throw new Error("invalid_wallet_reservation_transition");
  return next;
}

module.exports = {
  ORDER_STATES, PAYMENT_STATES, ENTITLEMENT_STATES,
  AI_REQUEST_STATES, REPORT_STATES, WALLET_RESERVATION_STATES, FEATURE_FLAGS,
  requireIdempotencyKey, normalizeMoney, normalizeCredits,
  canSpendWallet, quotaRemaining, canUseQuota,
  nextAiState, nextWalletReservationState
};
