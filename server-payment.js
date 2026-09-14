"use strict";

const ORDER_STATES = Object.freeze({
  CREATED:"CREATED",
  PAYMENT_PENDING:"PAYMENT_PENDING",
  PAID:"PAID",
  FULFILLED:"FULFILLED",
  REFUND_PENDING:"REFUND_PENDING",
  REFUNDED:"REFUNDED",
  CANCELLED:"CANCELLED",
  PAYMENT_FAILED:"PAYMENT_FAILED"
});

const PAYMENT_STATES = Object.freeze({
  INITIATED:"INITIATED",
  VERIFIED:"VERIFIED",
  FAILED:"FAILED",
  REFUNDED:"REFUNDED",
  PARTIALLY_REFUNDED:"PARTIALLY_REFUNDED"
});

function requireMoney(v,name="amount"){
  const n=Number(v);
  if(!Number.isInteger(n)||n<0)throw new Error(`invalid_${name}`);
  return n;
}

function productSnapshot(product){
  if(!product||!product.id||!product.product_code)throw new Error("product_required");
  return {
    product_id:String(product.id),
    product_code:String(product.product_code),
    product_type:String(product.product_type||""),
    name:String(product.name||"").slice(0,120),
    price_amount:requireMoney(product.price_amount,"price"),
    currency:String(product.currency||"KRW"),
    benefits:typeof product.benefits_json==="string"
      ? JSON.parse(product.benefits_json||"{}")
      : (product.benefits_json||{})
  };
}

function createOrderPlan({subject,product,chartSnapshotId,idempotencyKey}){
  if(!subject||!["user","guest"].includes(subject.type)||!subject.id)throw new Error("subject_required");
  const key=String(idempotencyKey||"").trim();
  if(key.length<12||key.length>200)throw new Error("invalid_idempotency_key");
  const snap=productSnapshot(product);
  return {
    user_id:subject.type==="user"?String(subject.id):null,
    guest_session_id:subject.type==="guest"?String(subject.id):null,
    product_id:snap.product_id,
    chart_snapshot_id:chartSnapshotId?String(chartSnapshotId):null,
    idempotency_key:key,
    state:ORDER_STATES.CREATED,
    product_snapshot_json:JSON.stringify(snap),
    amount:snap.price_amount,
    currency:snap.currency
  };
}

function verifyPaymentFacts({order,providerPayment}){
  if(!order||!providerPayment)return {ok:false,reason:"missing_payment_facts"};
  const expectedAmount=requireMoney(order.amount,"order_amount");
  const approvedAmount=requireMoney(providerPayment.amount,"approved_amount");
  if(expectedAmount!==approvedAmount)return {ok:false,reason:"amount_mismatch"};
  if(String(order.currency||"KRW")!==String(providerPayment.currency||"KRW"))
    return {ok:false,reason:"currency_mismatch"};
  if(String(providerPayment.status||"").toUpperCase()!=="PAID")
    return {ok:false,reason:"provider_not_paid"};
  return {ok:true};
}

function benefitPlan(productSnapshot){
  const snap=typeof productSnapshot==="string"?JSON.parse(productSnapshot):productSnapshot;
  const code=String(snap?.product_code||"");
  const b=snap?.benefits||{};
  if(code==="LIFETIME_SAJU")return {kind:"entitlement",entitlement_type:"lifetime_saju",resource_key:null};
  if(code==="PREMIUM_COMPAT")return {kind:"entitlement",entitlement_type:"premium_compat",resource_key:null};
  if(/^CLOVER_/.test(code)){
    const credits=Number(b.credits||0);
    if(!Number.isInteger(credits)||credits<=0)throw new Error("invalid_credit_benefit");
    return {kind:"wallet_credit",credits};
  }
  throw new Error("unknown_product_benefit");
}

function refundEffect({benefit,creditsSpent=0}){
  if(!benefit)throw new Error("benefit_required");
  if(benefit.kind==="entitlement")return {revoke_entitlement:true,refund_allowed:true};
  if(benefit.kind==="wallet_credit"){
    const spent=Number(creditsSpent||0);
    if(!Number.isInteger(spent)||spent<0)throw new Error("invalid_credits_spent");
    return {
      revoke_entitlement:false,
      refund_allowed:spent===0,
      reason:spent===0?null:"wallet_credit_already_used"
    };
  }
  throw new Error("invalid_benefit_kind");
}

function webhookReplayDecision(existing){
  if(!existing)return "process";
  if(existing.state==="PROCESSED")return "replay_success";
  if(existing.state==="PROCESSING")return "in_progress";
  return "retry";
}

module.exports={
  ORDER_STATES,PAYMENT_STATES,requireMoney,productSnapshot,createOrderPlan,
  verifyPaymentFacts,benefitPlan,refundEffect,webhookReplayDecision
};
