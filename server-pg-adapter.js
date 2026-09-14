"use strict";
const PROVIDERS=new Set(["inicis","mock"]);
function normalizeProvider(v){const p=String(v||"").trim().toLowerCase();if(!PROVIDERS.has(p))throw new Error("unsupported_pg_provider");return p}
function testPaymentRequest({provider,order,returnUrl}){
  const p=normalizeProvider(provider);
  if(!order?.id)throw new Error("order_required");
  if(!Number.isInteger(Number(order.amount))||Number(order.amount)<=0)throw new Error("invalid_order_amount");
  if(String(order.currency||"KRW")!=="KRW")throw new Error("unsupported_currency");
  const url=String(returnUrl||"");
  if(!/^https:\/\/(www\.)?gwiinsaju\.com\//.test(url))throw new Error("invalid_return_url");
  return{provider:p,order_id:String(order.id),amount:Number(order.amount),currency:"KRW",test_mode:true,return_url:url};
}
function verifiedProviderPayment({order,providerResult}){
  if(!order||!providerResult)throw new Error("payment_verification_input_required");
  const amount=Number(providerResult.amount),currency=String(providerResult.currency||"");
  const paid=String(providerResult.status||"").toUpperCase()==="PAID";
  const tx=String(providerResult.provider_tx_id||providerResult.tx_id||"").trim();
  if(!paid)return{ok:false,reason:"provider_not_paid"};
  if(amount!==Number(order.amount))return{ok:false,reason:"amount_mismatch"};
  if(currency!==String(order.currency||"KRW"))return{ok:false,reason:"currency_mismatch"};
  if(!tx)return{ok:false,reason:"provider_tx_id_missing"};
  return{ok:true,provider_tx_id:tx,amount,currency};
}
module.exports={PROVIDERS,normalizeProvider,testPaymentRequest,verifiedProviderPayment};
