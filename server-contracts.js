"use strict";

const ORDER_STATES = Object.freeze([
  "CREATED","PAYMENT_PENDING","PAID","ENTITLEMENT_GRANTED","FULFILLED",
  "CANCELLED","FAILED","REFUNDED","PARTIALLY_REFUNDED"
]);

const AI_REQUEST_STATES = Object.freeze([
  "CREATED","RESERVED","PROCESSING","AI_SUCCESS","VALIDATING","STORED",
  "SPENT","RELEASED","FAILED_RETRYABLE","FAILED_FINAL"
]);

const REPORT_STATES = Object.freeze([
  "NOT_STARTED","QUEUED","GENERATING","VALIDATING","READY",
  "FAILED_RETRYABLE","FAILED_FINAL"
]);

const FEATURE_FLAGS = Object.freeze([
  "AI_CHAT_ENABLED","AI_REPORT_ENABLED","NEW_PAYMENTS_ENABLED","SOCIAL_LOGIN_ENABLED"
]);

function requireIdempotencyKey(value) {
  const key = String(value || "").trim();
  if (key.length < 12 || key.length > 200) throw new Error("invalid_idempotency_key");
  return key;
}

function normalizeMoney(amount, currency = "KRW") {
  const a = Number(amount);
  if (!Number.isInteger(a) || a < 0) throw new Error("invalid_amount");
  const c = String(currency || "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) throw new Error("invalid_currency");
  return { amount:a, currency:c };
}

function canSpendWallet(balance, amount = 1) {
  const b = Number(balance), a = Number(amount);
  return Number.isInteger(b) && Number.isInteger(a) && b >= a && a > 0;
}

module.exports = {
  ORDER_STATES, AI_REQUEST_STATES, REPORT_STATES, FEATURE_FLAGS,
  requireIdempotencyKey, normalizeMoney, canSpendWallet
};
