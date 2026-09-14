"use strict";

const CODE_GATES=Object.freeze([
  "ENGINE_GOLDEN",
  "ENGINE_UNCERTAINTY",
  "EXPERT_INTERPRETATION",
  "COMPATIBILITY",
  "FLOW",
  "AI_QUALITY",
  "AI_IDEMPOTENCY",
  "AI_NO_LOSS",
  "SESSION_AUTH",
  "OWNERSHIP_ISOLATION",
  "GUEST_ACCOUNT_LINK",
  "PROFILE_CONVERSATION_CRUD",
  "SERVER_USAGE_BRIDGE",
  "SERVER_AUTHORITY_TRANSITION",
  "WALLET_RESERVE_FINALIZE",
  "FREE_QUOTA_RESERVE_FINALIZE",
  "PAYMENT_ORDER_VERIFY",
  "ENTITLEMENT_IDEMPOTENCY",
  "WEBHOOK_RECOVERY",
  "REFUND_RECOVERY",
  "PURCHASE_RESTORE",
  "SECURITY_ORIGIN_RATE_LOG",
  "SESSION_CSRF_ADMIN_MFA",
  "AUDIT_BACKUP_RECOVERY",
  "FAILURE_SAFETY_100",
  "LEGAL_FAIL_CLOSED"
]);

const EXTERNAL_GATES=Object.freeze([
  "D1_STAGING_DEPLOYED",
  "STAGING_E2E_PASSED",
  "REAL_LOGIN_PROVIDER_VERIFIED",
  "SERVER_CHART_AUTHORITY_VERIFIED",
  "PG_TEST_VERIFIED",
  "INICIS_WEBHOOK_SIGNATURE_VERIFIED",
  "MERCHANT_CONTACT_READY",
  "ECOMMERCE_REPORTING_STATUS_CONFIRMED",
  "PRIVACY_CONTACT_READY",
  "PROCESSOR_LIST_CONFIRMED",
  "OVERSEAS_TRANSFER_DISCLOSURE_CONFIRMED",
  "UNDER14_POLICY_CONFIRMED",
  "LEGAL_REVIEW_COMPLETED",
  "BACKUP_RESTORE_DRILL_PASSED"
]);

function normalizeState(v){
  const s=String(v||"MISSING").toUpperCase();
  return ["PASS","FAIL","MISSING","PENDING"].includes(s)?s:"MISSING";
}

function evaluateFinalLaunch({codeChecks={},externalChecks={},paymentsFlag=false}={}){
  const code=CODE_GATES.map(k=>({key:k,state:normalizeState(codeChecks[k]),source:"code"}));
  const external=EXTERNAL_GATES.map(k=>({key:k,state:normalizeState(externalChecks[k]),source:"external"}));

  const codeFailed=code.filter(x=>x.state!=="PASS");
  const externalFailed=external.filter(x=>x.state!=="PASS");
  const codeReady=codeFailed.length===0;
  const externalReady=externalFailed.length===0;
  const paymentsAllowed=codeReady && externalReady && paymentsFlag===true;

  return {
    codeReady,
    externalReady,
    launchReady:codeReady&&externalReady,
    paymentsAllowed,
    codeFailed:codeFailed.map(x=>x.key),
    externalFailed:externalFailed.map(x=>x.key),
    checks:[...code,...external]
  };
}

function productionDecision(report){
  if(!report?.codeReady)return {allowed:false,reason:"code_gate_failed"};
  if(!report?.externalReady)return {allowed:false,reason:"external_gate_failed"};
  if(!report?.paymentsAllowed)return {allowed:false,reason:"payment_flag_off"};
  return {allowed:true,reason:null};
}

function summary(report){
  return {
    codeReady:!!report?.codeReady,
    externalReady:!!report?.externalReady,
    launchReady:!!report?.launchReady,
    paymentsAllowed:!!report?.paymentsAllowed,
    codeBlockers:report?.codeFailed||[],
    externalBlockers:report?.externalFailed||[]
  };
}

module.exports={CODE_GATES,EXTERNAL_GATES,normalizeState,evaluateFinalLaunch,productionDecision,summary};
