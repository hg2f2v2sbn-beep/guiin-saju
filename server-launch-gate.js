"use strict";

const REQUIRED_GATES=Object.freeze([
  ["engine_golden","calculation"],
  ["engine_uncertainty","calculation"],
  ["compatibility_regression","interpretation"],
  ["flow_regression","interpretation"],
  ["ai_quality_gate","ai"],
  ["ai_idempotency","ai"],
  ["ai_no_loss","ai"],
  ["server_session","auth"],
  ["ownership_isolation","auth"],
  ["guest_to_user_restore","auth"],
  ["free_quota_atomicity","money"],
  ["wallet_reserve_spend_release","money"],
  ["order_server_price","payment"],
  ["payment_idempotency","payment"],
  ["entitlement_idempotency","payment"],
  ["webhook_recovery","payment"],
  ["refund_recovery","payment"],
  ["purchase_restore","payment"],
  ["origin_allowlist","security"],
  ["rate_limit","security"],
  ["log_redaction","security"],
  ["session_expiry","security"],
  ["admin_mfa_gate","security"],
  ["secret_scan","security"],
  ["audit_integrity","operations"],
  ["backup_verified","operations"],
  ["restore_drill","operations"],
  ["integrity_checks","operations"],
  ["legal_ready","launch"],
  ["pg_verified","launch"]
]);

function normalizeResult(x){
  if(!x||!x.gate_key)throw new Error("gate_key_required");
  return {
    gate_key:String(x.gate_key),
    category:String(x.category||"other"),
    required:x.required!==false,
    state:String(x.state||"UNKNOWN").toUpperCase(),
    details:x.details||null
  };
}

function evaluate(results=[]){
  const map=new Map(results.map(x=>{const n=normalizeResult(x);return[n.gate_key,n]}));
  const evaluated=REQUIRED_GATES.map(([key,category])=>{
    const x=map.get(key);
    if(!x)return {gate_key:key,category,required:true,state:"MISSING",details:null};
    return {...x,category};
  });
  const failed=evaluated.filter(x=>x.required&&x.state!=="PASS");
  const passed=evaluated.filter(x=>x.required&&x.state==="PASS");
  return {
    ready:failed.length===0,
    passed_count:passed.length,
    failed_count:failed.length,
    failed:failed.map(x=>x.gate_key),
    results:evaluated
  };
}

function paymentMayEnable(report){
  return !!report && report.ready===true && report.failed_count===0;
}

function summarizeByCategory(report){
  const out={};
  for(const r of report?.results||[]){
    out[r.category] ||= {pass:0,fail:0};
    if(r.state==="PASS")out[r.category].pass++;
    else out[r.category].fail++;
  }
  return out;
}

module.exports={REQUIRED_GATES,normalizeResult,evaluate,paymentMayEnable,summarizeByCategory};
