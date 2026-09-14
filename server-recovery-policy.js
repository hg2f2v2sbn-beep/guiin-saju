"use strict";

function classifyFailure(input={}){
  const code=String(input.code||"unknown");
  if(/timeout|network|upstream/i.test(code))return {class:"transient",retry:true};
  if(/rate_limited/i.test(code))return {class:"throttle",retry:true};
  if(/amount_mismatch|currency_mismatch|signature|auth/i.test(code))return {class:"security",retry:false};
  if(/schema|constraint|integrity/i.test(code))return {class:"data_integrity",retry:false};
  if(/insufficient|no_quota|not_refundable/i.test(code))return {class:"business_rule",retry:false};
  return {class:"unknown",retry:false};
}

function retryPlan({attempt=0,baseSeconds=30,maxSeconds=3600,maxAttempts=6}){
  const a=Math.max(0,Number(attempt)||0);
  if(a>=maxAttempts)return {retry:false,delay_seconds:null,next_attempt:a};
  return {retry:true,delay_seconds:Math.min(maxSeconds,baseSeconds*Math.pow(2,a)),next_attempt:a+1};
}

function incidentSeverity({className,moneyAffected=false,personalDataRisk=false}){
  if(personalDataRisk)return "critical";
  if(moneyAffected)return "critical";
  if(className==="security"||className==="data_integrity")return "critical";
  if(className==="transient")return "warning";
  return "info";
}

function rollbackDecision({newVersionHealthy,oldVersionAvailable,migrationReversible,dataIntegrityOkay}){
  if(newVersionHealthy)return {rollback:false,reason:"healthy"};
  if(!oldVersionAvailable)return {rollback:false,reason:"no_previous_version"};
  if(!dataIntegrityOkay)return {rollback:false,reason:"manual_recovery_required"};
  if(migrationReversible!==true)return {rollback:false,reason:"migration_not_reversible"};
  return {rollback:true,reason:"safe_to_rollback"};
}

function integrityIssues({
  walletNegative=0,
  walletReservedOverBalance=0,
  quotaReservedNegative=0,
  fulfilledWithoutPayment=0,
  paidNotFulfilled=0,
  storedAiWithoutResult=0,
  spentAiWithoutResult=0
}={}){
  const issues=[];
  if(walletNegative>0)issues.push("wallet_negative");
  if(walletReservedOverBalance>0)issues.push("wallet_reserved_over_balance");
  if(quotaReservedNegative>0)issues.push("quota_reserved_negative");
  if(fulfilledWithoutPayment>0)issues.push("fulfilled_without_payment");
  if(paidNotFulfilled>0)issues.push("paid_not_fulfilled");
  if(storedAiWithoutResult>0)issues.push("stored_ai_without_result");
  if(spentAiWithoutResult>0)issues.push("spent_ai_without_result");
  return issues;
}

module.exports={classifyFailure,retryPlan,incidentSeverity,rollbackDecision,integrityIssues};
