"use strict";

const MODES=Object.freeze({
  NORMAL:"NORMAL",
  READ_ONLY:"READ_ONLY",
  AI_DISABLED:"AI_DISABLED",
  PAYMENTS_DISABLED:"PAYMENTS_DISABLED",
  MAINTENANCE:"MAINTENANCE"
});

function stateMap(rows=[]){
  return Object.fromEntries((rows||[]).map(x=>[String(x.state_key),String(x.state_value)]));
}

function runtimeDecision({states={},route="",method="GET"}){
  const maintenance=states.MAINTENANCE_MODE==="true";
  const readOnly=states.READ_ONLY_MODE==="true";
  const aiOff=states.AI_DISABLED==="true";
  const paymentsOff=states.PAYMENTS_DISABLED!=="false"; // fail closed by default
  const write=["POST","PUT","PATCH","DELETE"].includes(String(method).toUpperCase());

  if(maintenance && route!=="/health")
    return {allowed:false,status:503,error:"maintenance_mode",mode:MODES.MAINTENANCE};

  if(aiOff && route==="/api/chat")
    return {allowed:false,status:503,error:"ai_temporarily_disabled",mode:MODES.AI_DISABLED};

  if(readOnly && write && route!=="/api/session/guest")
    return {allowed:false,status:503,error:"read_only_mode",mode:MODES.READ_ONLY};

  if(paymentsOff && route.startsWith("/api/orders") && write)
    return {allowed:false,status:503,error:"payments_disabled",mode:MODES.PAYMENTS_DISABLED};

  return {allowed:true,status:200,error:null,mode:MODES.NORMAL};
}

function paymentSafetyDecision({launchReady,paymentFlag,dbReady,pgVerified}){
  const failed=[];
  if(launchReady!==true)failed.push("launch_gate");
  if(paymentFlag!==true)failed.push("payment_flag");
  if(dbReady!==true)failed.push("database");
  if(pgVerified!==true)failed.push("pg_verification");
  return {enabled:failed.length===0,failed};
}

function shouldTripCircuit({recentFailures=0,threshold=5}){
  const n=Number(recentFailures),t=Number(threshold);
  return Number.isFinite(n)&&Number.isFinite(t)&&t>0&&n>=t;
}

module.exports={MODES,stateMap,runtimeDecision,paymentSafetyDecision,shouldTripCircuit};
