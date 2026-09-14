"use strict";

/**
 * 귀인사주 서버 식별/세션 계약.
 * 실제 비밀키/DB는 Worker에서 주입하고, 여기서는 입력 검증과 상태 규칙만 정의한다.
 */
const TOKEN_PREFIX = "gst_";
const USER_TOKEN_PREFIX = "usr_";

function normalizeToken(v, prefix) {
  const s = String(v || "").trim();
  if (!s.startsWith(prefix)) throw new Error("invalid_token_prefix");
  if (s.length < prefix.length + 24 || s.length > 256) throw new Error("invalid_token_length");
  if (!/^[A-Za-z0-9._:-]+$/.test(s)) throw new Error("invalid_token_chars");
  return s;
}

function requireGuestToken(v) {
  return normalizeToken(v, TOKEN_PREFIX);
}

function requireUserToken(v) {
  return normalizeToken(v, USER_TOKEN_PREFIX);
}

function sessionSubject({userId, guestSessionId}) {
  if (userId) return {type:"user", id:String(userId)};
  if (guestSessionId) return {type:"guest", id:String(guestSessionId)};
  throw new Error("subject_required");
}

function canConvertGuest({guestSessionId, userId, guestAlreadyConvertedTo}) {
  if (!guestSessionId || !userId) return false;
  if (!guestAlreadyConvertedTo) return true;
  return String(guestAlreadyConvertedTo) === String(userId);
}

function sanitizeDisplayName(v) {
  const s = String(v || "").trim().replace(/\s+/g, " ");
  if (!s) return null;
  return s.slice(0, 40);
}

function authMode(headers = {}) {
  const auth = String(headers.authorization || headers.Authorization || "").trim();
  const guest = String(headers["x-guiin-guest"] || headers["X-Guiin-Guest"] || "").trim();
  if (/^Bearer\s+/i.test(auth)) return "user";
  if (guest) return "guest";
  return "anonymous";
}

module.exports = {
  TOKEN_PREFIX, USER_TOKEN_PREFIX,
  requireGuestToken, requireUserToken,
  sessionSubject, canConvertGuest, sanitizeDisplayName, authMode
};
