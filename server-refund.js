"use strict";

const REFUND_STATES=Object.freeze({
  REQUESTED:"REQUESTED",
  PROVIDER_PENDING:"PROVIDER_PENDING",
  VERIFIED:"VERIFIED",
  FAILED:"FAILED",
  MANUAL_REVIEW:"MANUAL_REVIEW"
});

function refundEligibility({orderState,paymentState,benefit,creditsGranted=0,creditsConsumed=0}){
  if(!["FULFILLED","PAID"].includes(String(orderState||"")))
    return {allowed:false,reason:"order_not_refundable_state"};
  if(!["VERIFIED","PARTIALLY_REFUNDED"].includes(String(paymentState||"")))
    return {allowed:false,reason:"payment_not_refundable_state"};

  if(benefit?.kind==="entitlement")
    return {allowed:true,action:"revoke_entitlement"};

  if(benefit?.kind==="wallet_credit"){
    const granted=Number(creditsGranted||0),consumed=Number(creditsConsumed||0);
    if(!Number.isInteger(granted)||!Number.isInteger(consumed)||granted<0||consumed<0||consumed>granted)
      throw new Error("invalid_wallet_credit_usage");
    if(consumed>0)return {allowed:false,reason:"wallet_credit_already_used"};
    return {allowed:true,action:"reverse_wallet_credit",credits:granted};
  }
  return {allowed:false,reason:"unknown_benefit"};
}

function createRefundPlan({paymentId,orderId,amount,currency="KRW",reason,idempotencyKey}){
  const a=Number(amount);
  const key=String(idempotencyKey||"").trim();
  if(!paymentId||!orderId)throw new Error("payment_and_order_required");
  if(!Number.isInteger(a)||a<=0)throw new Error("invalid_refund_amount");
  if(key.length<12||key.length>200)throw new Error("invalid_idempotency_key");
  return {
    payment_id:String(paymentId),
    order_id:String(orderId),
    amount:a,
    currency:String(currency),
    state:REFUND_STATES.REQUESTED,
    reason:String(reason||"").slice(0,500)||null,
    idempotency_key:key
  };
}

function verifyRefund({refund,providerRefund}){
  if(!refund||!providerRefund)return {ok:false,reason:"missing_refund_facts"};
  if(Number(refund.amount)!==Number(providerRefund.amount))return {ok:false,reason:"refund_amount_mismatch"};
  if(String(refund.currency)!==String(providerRefund.currency))return {ok:false,reason:"refund_currency_mismatch"};
  if(String(providerRefund.status||"").toUpperCase()!=="REFUNDED")return {ok:false,reason:"provider_not_refunded"};
  return {ok:true};
}

module.exports={REFUND_STATES,refundEligibility,createRefundPlan,verifyRefund};
