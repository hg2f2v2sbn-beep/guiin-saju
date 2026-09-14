"use strict";

const ROUTES = Object.freeze({
  HEALTH: "GET /health",
  GUEST_CREATE: "POST /api/session/guest",
  USAGE_GET: "GET /api/me/usage",
  CHAT: "POST /api/chat",
  PROFILE_SAVE: "POST /api/profiles",
  PROFILE_LIST: "GET /api/profiles",
  ENTITLEMENTS_GET: "GET /api/me/entitlements"
});

function ok(data = {}) {
  return {ok:true, ...data};
}

function error(code, status = 400, extra = {}) {
  return {ok:false, error:String(code), status:Number(status), ...extra};
}

function usageShape({freeUsed = 0, freeLimit = 3, walletBalance = 0} = {}) {
  const used = Math.max(0, Number(freeUsed) || 0);
  const limit = Math.max(0, Number(freeLimit) || 0);
  const wallet = Math.max(0, Number(walletBalance) || 0);
  return {
    free: {
      used,
      limit,
      remaining: Math.max(0, limit - used)
    },
    wallet: {
      balance: wallet
    }
  };
}

function entitlementShape(rows = []) {
  return rows.map(x => ({
    type: String(x?.entitlement_type || x?.type || ""),
    resourceKey: x?.resource_key ?? x?.resourceKey ?? null,
    state: String(x?.state || "ACTIVE"),
    grantedAt: x?.granted_at ?? x?.grantedAt ?? null
  })).filter(x => x.type);
}

module.exports = { ROUTES, ok, error, usageShape, entitlementShape };
