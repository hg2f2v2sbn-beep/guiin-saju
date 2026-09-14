"use strict";

/**
 * Guest → 회원 승계 계획.
 * 실제 DB 트랜잭션은 서버 구현에서 이 계획 순서대로 수행한다.
 */
function planGuestConversion({guestSessionId, userId}) {
  if (!guestSessionId) throw new Error("guest_session_required");
  if (!userId) throw new Error("user_required");

  return [
    {step:1, action:"lock_guest_session", guestSessionId},
    {step:2, action:"verify_not_converted_to_other_user", guestSessionId, userId},
    {step:3, action:"move_profiles", guestSessionId, userId},
    {step:4, action:"move_chart_snapshots", guestSessionId, userId},
    {step:5, action:"move_conversations", guestSessionId, userId},
    {step:6, action:"move_reports", guestSessionId, userId},
    {step:7, action:"merge_entitlements", guestSessionId, userId},
    {step:8, action:"merge_wallet", guestSessionId, userId},
    {step:9, action:"merge_usage_quota", guestSessionId, userId},
    {step:10, action:"mark_guest_converted", guestSessionId, userId},
    {step:11, action:"write_audit_log", guestSessionId, userId}
  ];
}

function mergeWalletBalance(userBalance, guestBalance) {
  const u = Number(userBalance), g = Number(guestBalance);
  if (![u,g].every(Number.isInteger) || u < 0 || g < 0) throw new Error("invalid_balance");
  return u + g;
}

function mergeLifetimeQuota({userUsed=0, guestUsed=0, limit=3}) {
  const u=Number(userUsed), g=Number(guestUsed), l=Number(limit);
  if (![u,g,l].every(Number.isInteger) || u<0 || g<0 || l<0) throw new Error("invalid_quota");
  // 무료 3회를 회원가입으로 다시 얻지 못하게 보수적으로 합산 후 상한 적용.
  return {used:Math.min(l,u+g), limit:l, remaining:Math.max(0,l-Math.min(l,u+g))};
}

function entitlementMergeKey(x={}) {
  return [String(x.entitlement_type||x.type||""),String(x.resource_key??x.resourceKey??"")].join("|");
}

function dedupeEntitlements(userRows=[], guestRows=[]) {
  const map=new Map();
  for(const row of [...userRows,...guestRows]) {
    const key=entitlementMergeKey(row);
    if (!key.startsWith("|")) map.set(key,row);
  }
  return [...map.values()];
}

module.exports = {
  planGuestConversion, mergeWalletBalance, mergeLifetimeQuota,
  entitlementMergeKey, dedupeEntitlements
};
