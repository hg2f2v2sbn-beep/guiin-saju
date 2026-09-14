"use strict";
function planGuestConversion({guestSessionId,userId}){
  if(!guestSessionId)throw new Error("guest_session_required");
  if(!userId)throw new Error("user_required");
  return [
    {step:1,action:"verify_guest_ownership",guestSessionId,userId},
    {step:2,action:"verify_not_converted_to_other_user",guestSessionId,userId},
    {step:3,action:"block_if_active_reservations",guestSessionId,userId},
    {step:4,action:"move_profiles",guestSessionId,userId},
    {step:5,action:"move_chart_snapshots",guestSessionId,userId},
    {step:6,action:"move_conversations",guestSessionId,userId},
    {step:7,action:"move_reports",guestSessionId,userId},
    {step:8,action:"merge_entitlements",guestSessionId,userId},
    {step:9,action:"merge_wallet",guestSessionId,userId},
    {step:10,action:"merge_usage_quota",guestSessionId,userId},
    {step:11,action:"move_orders",guestSessionId,userId},
    {step:12,action:"move_consents",guestSessionId,userId},
    {step:13,action:"move_ai_requests",guestSessionId,userId},
    {step:14,action:"move_wallet_ledger",guestSessionId,userId},
    {step:15,action:"mark_guest_converted",guestSessionId,userId},
    {step:16,action:"write_audit_log",guestSessionId,userId}
  ];
}
function canBeginConversion({convertedUserId,requestedUserId,activeWalletReservations=0,activeQuotaReservations=0}){
  if(convertedUserId&&String(convertedUserId)!==String(requestedUserId))
    return{allowed:false,reason:"guest_already_linked_to_other_user"};
  if(Number(activeWalletReservations)>0||Number(activeQuotaReservations)>0)
    return{allowed:false,reason:"active_reservation_exists"};
  return{allowed:true,reason:null};
}
function mergeWallet({userBalance=0,userReserved=0,guestBalance=0,guestReserved=0}){
  const v=[userBalance,userReserved,guestBalance,guestReserved].map(Number);
  if(!v.every(Number.isInteger)||v.some(x=>x<0))throw new Error("invalid_wallet");
  if(v[1]>v[0]||v[3]>v[2])throw new Error("invalid_reserved_balance");
  if(v[1]||v[3])throw new Error("active_reservation_exists");
  return{balance:v[0]+v[2],reserved_balance:0};
}
function mergeWalletBalance(userBalance,guestBalance){
  return mergeWallet({userBalance,guestBalance,userReserved:0,guestReserved:0}).balance;
}
function mergeLifetimeQuota({userUsed=0,userReserved=0,guestUsed=0,guestReserved=0,limit=3}={}){
  const u=Number(userUsed),ur=Number(userReserved),g=Number(guestUsed),gr=Number(guestReserved),l=Number(limit);
  if(![u,ur,g,gr,l].every(Number.isInteger)||[u,ur,g,gr,l].some(x=>x<0))throw new Error("invalid_quota");
  if(ur||gr)throw new Error("active_reservation_exists");
  const used=Math.min(l,u+g);
  return{used,reserved:0,limit:l,remaining:Math.max(0,l-used)};
}
function entitlementMergeKey(x={}){return[String(x.entitlement_type||x.type||""),String(x.resource_key??x.resourceKey??"")].join("|")}
function dedupeEntitlements(userRows=[],guestRows=[]){
  const map=new Map();
  for(const row of [...userRows,...guestRows]){const k=entitlementMergeKey(row);if(!k.startsWith("|"))map.set(k,row)}
  return[...map.values()];
}
function linkReplayDecision(row,userId){
  if(!row)return"new";
  if(String(row.user_id)!==String(userId))return"conflict";
  if(row.state==="COMPLETED")return"replay";
  if(row.state==="PROCESSING")return"in_progress";
  return"retry";
}
module.exports={planGuestConversion,canBeginConversion,mergeWallet,mergeWalletBalance,mergeLifetimeQuota,entitlementMergeKey,dedupeEntitlements,linkReplayDecision};
