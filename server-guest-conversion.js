"use strict";

/**
 * Guest → 회원 승계 v2.
 * 회원가입/로그인으로 무료횟수나 클로버가 리셋되지 않으며,
 * 진행 중 예약이 있으면 전환을 잠시 막아 돈 상태를 보존한다.
 */
function planGuestConversion({guestSessionId,userId}){
  if(!guestSessionId)throw new Error("guest_session_required");
  if(!userId)throw new Error("user_required");
  return [
    {step:1,action:"verify_guest_ownership"},
    {step:2,action:"verify_not_converted_to_other_user"},
    {step:3,action:"block_if_active_reservations"},
    {step:4,action:"merge_wallet"},
    {step:5,action:"merge_usage_quota"},
    {step:6,action:"move_orders"},
    {step:7,action:"move_entitlements"},
    {step:8,action:"move_profiles"},
    {step:9,action:"move_chart_snapshots"},
    {step:10,action:"move_conversations"},
    {step:11,action:"move_reports"},
    {step:12,action:"move_consents"},
    {step:13,action:"move_ai_requests"},
    {step:14,action:"move_wallet_ledger"},
    {step:15,action:"mark_guest_converted_and_revoked"},
    {step:16,action:"write_account_link_event"},
    {step:17,action:"restore_server_state"}
  ].map(x=>({...x,guestSessionId,userId}));
}

function canBeginConversion({convertedUserId,requestedUserId,activeWalletReservations=0,activeQuotaReservations=0}){
  if(convertedUserId && String(convertedUserId)!==String(requestedUserId))
    return {allowed:false,reason:"guest_already_linked_to_other_user"};
  if(Number(activeWalletReservations)>0||Number(activeQuotaReservations)>0)
    return {allowed:false,reason:"active_reservation_exists"};
  return {allowed:true,reason:null};
}

function mergeWallet({userBalance=0,userReserved=0,guestBalance=0,guestReserved=0}){
  const v=[userBalance,userReserved,guestBalance,guestReserved].map(Number);
  if(!v.every(Number.isInteger)||v.some(x=>x<0))throw new Error("invalid_wallet");
  if(v[1]>v[0]||v[3]>v[2])throw new Error("invalid_reserved_balance");
  if(v[1]||v[3])throw new Error("active_reservation_exists");
  return {balance:v[0]+v[2],reserved_balance:0};
}

function mergeLifetimeQuota({userUsed=0,userReserved=0,guestUsed=0,guestReserved=0,limit=3}){
  const u=Number(userUsed),ur=Number(userReserved),g=Number(guestUsed),gr=Number(guestReserved),l=Number(limit);
  if(![u,ur,g,gr,l].every(Number.isInteger)||[u,ur,g,gr,l].some(x=>x<0))throw new Error("invalid_quota");
  if(ur||gr)throw new Error("active_reservation_exists");
  const used=Math.min(l,u+g);
  return {used,reserved:0,limit:l,remaining:Math.max(0,l-used)};
}

function linkReplayDecision(row,userId){
  if(!row)return "new";
  if(String(row.user_id)!==String(userId))return "conflict";
  if(row.state==="COMPLETED")return "replay";
  if(row.state==="PROCESSING")return "in_progress";
  return "retry";
}

module.exports={planGuestConversion,canBeginConversion,mergeWallet,mergeLifetimeQuota,linkReplayDecision};
