"use strict";

const MODES=Object.freeze({
  LEGACY:"LEGACY",
  SHADOW:"SHADOW",
  SERVER:"SERVER"
});

function normalizeMode(v){
  const m=String(v||MODES.LEGACY).toUpperCase();
  if(!Object.values(MODES).includes(m))throw new Error("invalid_authority_mode");
  return m;
}

function decideUsage({mode,serverUsage,legacyUsage}){
  const m=normalizeMode(mode);
  if(m===MODES.SERVER){
    if(!serverUsage)throw new Error("server_usage_required");
    return {source:"server",usage:serverUsage};
  }
  if(m===MODES.SHADOW){
    return {source:"legacy",usage:legacyUsage||null,shadow:serverUsage||null};
  }
  return {source:"legacy",usage:legacyUsage||null};
}

function compareUsage(serverUsage,legacyUsage){
  if(!serverUsage||!legacyUsage)return {comparable:false,differences:[]};
  const fields=[
    ["free.remaining",serverUsage?.free?.remaining,legacyUsage?.free?.remaining],
    ["wallet.available",serverUsage?.wallet?.available,legacyUsage?.wallet?.available]
  ];
  const differences=fields
    .filter(([,a,b])=>Number(a)!==Number(b))
    .map(([field,a,b])=>({field,server:Number(a),legacy:Number(b)}));
  return {comparable:true,match:differences.length===0,differences};
}

function canSwitchToServer({stagingReady,usageReadable,accountRestoreReady,legacyComparisonHealthy}){
  const failed=[];
  if(stagingReady!==true)failed.push("staging_not_ready");
  if(usageReadable!==true)failed.push("usage_unreadable");
  if(accountRestoreReady!==true)failed.push("account_restore_not_ready");
  if(legacyComparisonHealthy!==true)failed.push("shadow_comparison_failed");
  return {ready:failed.length===0,failed};
}

module.exports={MODES,normalizeMode,decideUsage,compareUsage,canSwitchToServer};
