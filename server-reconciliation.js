"use strict";

function webhookDecision(existing){
  if(!existing)return {action:"insert_and_process"};
  if(existing.state==="PROCESSED")return {action:"ack_replay"};
  if(existing.state==="PROCESSING")return {action:"ack_in_progress"};
  if(existing.state==="FAILED")return {action:"retry"};
  return {action:"retry"};
}

function nextWebhookRetry({retryCount=0,baseSeconds=60,maxSeconds=3600}){
  const n=Math.max(0,Number(retryCount)||0);
  const sec=Math.min(maxSeconds,baseSeconds*Math.pow(2,n));
  return {retry_count:n+1,delay_seconds:sec};
}

function detectPaymentIssue({order,payment,entitlements=[],walletLedger=[]}){
  if(!order)return {issue:"ORDER_MISSING",severity:"critical"};
  if(payment?.state==="VERIFIED" && order.state==="CREATED")
    return {issue:"PAYMENT_VERIFIED_ORDER_NOT_PAID",severity:"critical"};
  if(payment?.state==="VERIFIED" && order.state==="PAID" &&
     entitlements.length===0 && walletLedger.length===0)
    return {issue:"PAID_NOT_FULFILLED",severity:"critical"};
  if(order.state==="FULFILLED" && !payment)
    return {issue:"FULFILLED_WITHOUT_PAYMENT",severity:"critical"};
  return null;
}

function detectRefundIssue({refund,order,payment,activeEntitlements=[],walletPurchaseDelta=0}){
  if(refund?.state==="VERIFIED" && order?.state!=="REFUNDED")
    return {issue:"REFUND_VERIFIED_ORDER_NOT_REFUNDED",severity:"critical"};
  if(refund?.state==="VERIFIED" && activeEntitlements.length>0)
    return {issue:"REFUNDED_ENTITLEMENT_STILL_ACTIVE",severity:"critical"};
  if(refund?.state==="VERIFIED" && walletPurchaseDelta>0)
    return {issue:"REFUNDED_WALLET_CREDIT_NOT_REVERSED",severity:"critical"};
  if(refund?.state==="FAILED" && order?.state==="REFUND_PENDING")
    return {issue:"REFUND_FAILED_ORDER_STUCK",severity:"warning"};
  return null;
}

function recoveryAction(issueType){
  const map={
    PAYMENT_VERIFIED_ORDER_NOT_PAID:"mark_paid_then_fulfill",
    PAID_NOT_FULFILLED:"fulfill_idempotently",
    REFUND_VERIFIED_ORDER_NOT_REFUNDED:"finalize_refund",
    REFUNDED_ENTITLEMENT_STILL_ACTIVE:"revoke_entitlement",
    REFUNDED_WALLET_CREDIT_NOT_REVERSED:"reverse_unused_wallet_credit",
    REFUND_FAILED_ORDER_STUCK:"restore_fulfilled_or_manual_review"
  };
  return map[String(issueType||"")]||"manual_review";
}

module.exports={webhookDecision,nextWebhookRetry,detectPaymentIssue,detectRefundIssue,recoveryAction};
