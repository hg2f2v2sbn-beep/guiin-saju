"use strict";

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

function normalize(v){
  const s=String(v||"MISSING").toUpperCase();
  return ["PASS","FAIL","MISSING","PENDING"].includes(s)?s:"MISSING";
}

function evaluate(checks={}){
  const rows=EXTERNAL_GATES.map(k=>({key:k,state:normalize(checks[k])}));
  const failed=rows.filter(x=>x.state!=="PASS").map(x=>x.key);
  return {ready:failed.length===0,failed,checks:rows};
}

function canEnableProductionPayments({codeReady,externalChecks,newPaymentsEnabled}={}){
  const ext=evaluate(externalChecks);
  if(codeReady!==true)return {allowed:false,reason:"code_not_ready",external:ext};
  if(!ext.ready)return {allowed:false,reason:"external_gates_incomplete",external:ext};
  if(newPaymentsEnabled!==true)return {allowed:false,reason:"payment_flag_off",external:ext};
  return {allowed:true,reason:null,external:ext};
}

module.exports={EXTERNAL_GATES,normalize,evaluate,canEnableProductionPayments};
