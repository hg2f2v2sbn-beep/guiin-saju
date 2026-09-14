"use strict";

function grantPlan({subject,orderId,benefit,now}){
  if(!subject||!["user","guest"].includes(subject.type)||!subject.id)throw new Error("subject_required");
  if(!orderId)throw new Error("order_required");
  if(!benefit)throw new Error("benefit_required");
  const at=now||new Date().toISOString();

  if(benefit.kind==="entitlement"){
    return {
      kind:"entitlement",
      row:{
        user_id:subject.type==="user"?String(subject.id):null,
        guest_session_id:subject.type==="guest"?String(subject.id):null,
        order_id:String(orderId),
        entitlement_type:String(benefit.entitlement_type),
        resource_key:benefit.resource_key==null?null:String(benefit.resource_key),
        state:"ACTIVE",
        granted_at:at
      }
    };
  }
  if(benefit.kind==="wallet_credit"){
    const credits=Number(benefit.credits);
    if(!Number.isInteger(credits)||credits<=0)throw new Error("invalid_credits");
    return {kind:"wallet_credit",subject_type:subject.type,subject_id:String(subject.id),credits};
  }
  throw new Error("invalid_benefit_kind");
}

function revokePlan({benefit,entitlementState="ACTIVE"}){
  if(benefit?.kind==="entitlement")
    return {kind:"entitlement",action:entitlementState==="ACTIVE"?"revoke":"noop"};
  if(benefit?.kind==="wallet_credit")
    return {kind:"wallet_credit",action:"refund_only_if_unused"};
  throw new Error("invalid_benefit_kind");
}

function fulfillmentAllowed({orderState,paymentState,verified}){
  return orderState==="PAID" && paymentState==="VERIFIED" && verified===true;
}

module.exports={grantPlan,revokePlan,fulfillmentAllowed};
