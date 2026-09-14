"use strict";

const PROVIDERS=new Set(["kakao","naver","google","apple","email"]);

function normalizeProvider(v){
  const p=String(v||"").trim().toLowerCase();
  if(!PROVIDERS.has(p))throw new Error("unsupported_provider");
  return p;
}

function loginStatePlan({provider,guestSessionId,redirectPath="/",ttlSeconds=600}){
  const p=normalizeProvider(provider);
  const ttl=Number(ttlSeconds);
  if(!Number.isInteger(ttl)||ttl<60||ttl>1800)throw new Error("invalid_login_ttl");
  const path=String(redirectPath||"/");
  if(!path.startsWith("/")||path.startsWith("//"))throw new Error("invalid_redirect_path");
  return {provider:p,guest_session_id:guestSessionId?String(guestSessionId):null,redirect_path:path,ttl_seconds:ttl};
}

function verifiedIdentity(input={}){
  const provider=normalizeProvider(input.provider);
  if(input.verified!==true)throw new Error("provider_identity_not_verified");
  const providerUserId=String(input.provider_user_id||input.provider_subject||input.subject||"").trim();
  if(!providerUserId||providerUserId.length>240)throw new Error("provider_user_id_required");
  const email=String(input.email_normalized||input.email||"").trim().toLowerCase().slice(0,240)||null;
  return {provider,provider_user_id:providerUserId,email_normalized:email,email_verified:input.email_verified===true?1:0,verified:true};
}

function loginStateDecision(row,nowMs=Date.now()){
  if(!row)return {allowed:false,reason:"state_missing"};
  if(row.used_at)return {allowed:false,reason:"state_already_used"};
  const exp=Date.parse(String(row.expires_at||""));
  if(!Number.isFinite(exp)||exp<=nowMs)return {allowed:false,reason:"state_expired"};
  return {allowed:true,reason:null};
}

function identityDecision({identityRow,verified}){
  if(!verified?.verified)throw new Error("provider_identity_not_verified");
  if(!identityRow)return {action:"create_user_and_identity"};
  if(String(identityRow.provider)!==String(verified.provider)||
     String(identityRow.provider_user_id)!==String(verified.provider_user_id))
    return {action:"conflict"};
  return {action:"reuse_user",user_id:String(identityRow.user_id)};
}

function sessionPlan({userId,ttlDays=30}){
  const days=Number(ttlDays);
  if(!userId)throw new Error("user_required");
  if(!Number.isInteger(days)||days<1||days>90)throw new Error("invalid_session_ttl");
  return {user_id:String(userId),ttl_days:days,token_prefix:"usr_"};
}

module.exports={PROVIDERS,normalizeProvider,loginStatePlan,verifiedIdentity,loginStateDecision,identityDecision,sessionPlan};
