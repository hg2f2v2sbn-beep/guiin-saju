"use strict";
const REQUIRED_FLAGS={AI_CHAT_ENABLED:"true",NEW_PAYMENTS_ENABLED:"false",SERVER_WALLET_ENABLED:"false",SERVER_FREE_QUOTA_ENABLED:"false"};
function validateStagingConfig(env={}){
  const missing=[],unsafe=[];
  if(String(env.ENVIRONMENT||"")!=="staging")missing.push("ENVIRONMENT=staging");
  if(!env.DB)missing.push("DB");
  if(!env.OPENAI_API_KEY)missing.push("OPENAI_API_KEY");
  for(const[k,v]of Object.entries(REQUIRED_FLAGS)){
    const actual=String(env[k]??"");
    if(actual!==v){if(v==="false"&&actual==="true")unsafe.push(k);else missing.push(k)}
  }
  return{ready:missing.length===0&&unsafe.length===0,missing,unsafe};
}
function publicReadiness(env={}){
  const r=validateStagingConfig(env);
  return{environment:String(env.ENVIRONMENT||"unknown"),databaseReady:!!env.DB,aiKeyPresent:!!env.OPENAI_API_KEY,
    paymentsDisabled:String(env.NEW_PAYMENTS_ENABLED)!=="true",
    walletAccountingDisabled:String(env.SERVER_WALLET_ENABLED)!=="true",
    freeQuotaAccountingDisabled:String(env.SERVER_FREE_QUOTA_ENABLED)!=="true",
    stagingReady:r.ready,missing:r.missing,unsafe:r.unsafe};
}
module.exports={REQUIRED_FLAGS,validateStagingConfig,publicReadiness};
