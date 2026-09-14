#!/usr/bin/env node
const base=(process.env.GUIIN_STAGING_BASE_URL||"").replace(/\/+$/,"");
if(!base){
  console.error("GUIIN_STAGING_BASE_URL is required");
  process.exit(2);
}

const results=[];
async function check(name,fn){
  try{
    const detail=await fn();
    results.push({name,state:"PASS",detail});
    console.log("PASS",name);
  }catch(e){
    results.push({name,state:"FAIL",detail:String(e?.message||e)});
    console.error("FAIL",name,String(e?.message||e));
  }
}
async function jsonFetch(path,opts={}){
  const r=await fetch(base+path,opts);
  let d=null;try{d=await r.json()}catch(_){}
  if(!r.ok)throw new Error(`${path} HTTP ${r.status} ${JSON.stringify(d)}`);
  return {status:r.status,data:d,headers:r.headers};
}

let guestToken=null;

await check("health",async()=>{
  const {data}=await jsonFetch("/health");
  if(!data)throw new Error("empty health");
  return {version:data.version||data.workerVersion||null};
});

await check("staging readiness",async()=>{
  const {data}=await jsonFetch("/api/staging/readiness");
  if(data.ready!==true && data.stagingReady!==true)
    throw new Error(`staging not ready: ${JSON.stringify(data)}`);
  if(data.paymentsDisabled===false)throw new Error("payments unexpectedly enabled");
  return data;
});

await check("final launch remains blocked",async()=>{
  const {data}=await jsonFetch("/api/final-launch/readiness");
  if(data.launchReady===true)throw new Error("launchReady must remain false before external gates");
  return {launchReady:data.launchReady,externalFailed:data.externalFailed||[]};
});

await check("create guest session",async()=>{
  const {data}=await jsonFetch("/api/session/guest",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
  guestToken=data.guestToken||data.token||null;
  if(!guestToken)throw new Error("guest token missing");
  return {guestId:data.guestId||null};
});

await check("read guest usage",async()=>{
  if(!guestToken)throw new Error("guest token unavailable");
  const {data}=await jsonFetch("/api/me/usage",{headers:{"X-Guiin-Guest":guestToken}});
  if(!data?.usage && !data?.free && !data?.wallet)throw new Error("usage payload missing");
  return data;
});

const failed=results.filter(x=>x.state!=="PASS");
console.log(JSON.stringify({base,passed:results.length-failed.length,failed:failed.length,results},null,2));
process.exit(failed.length?1:0);
