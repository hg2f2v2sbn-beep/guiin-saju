"use strict";

function restoreSummary({orders=[],entitlements=[],walletLedger=[]}){
  const fulfilledOrders=orders.filter(x=>x&&x.state==="FULFILLED");
  const activeEntitlements=entitlements.filter(x=>x&&x.state==="ACTIVE");
  const creditPurchases=walletLedger.filter(x=>x&&x.kind==="PURCHASE"&&Number(x.delta)>0);
  const creditSpends=walletLedger.filter(x=>x&&Number(x.delta)<0);

  return {
    fulfilled_order_count:fulfilledOrders.length,
    active_entitlements:activeEntitlements.map(x=>({
      type:String(x.entitlement_type||""),
      resource_key:x.resource_key??null,
      order_id:x.order_id??null
    })),
    wallet_purchase_credits:creditPurchases.reduce((a,x)=>a+Number(x.delta||0),0),
    wallet_spent_credits:Math.abs(creditSpends.reduce((a,x)=>a+Number(x.delta||0),0))
  };
}

function restoreAllowed(subject){
  return !!subject && ["user","guest"].includes(subject.type) && !!subject.id;
}

module.exports={restoreSummary,restoreAllowed};
