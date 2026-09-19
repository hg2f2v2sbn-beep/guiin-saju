"use strict";

const assert=require("assert");
const fs=require("fs");
const vm=require("vm");

function ok(label,fn){
  try{fn();console.log("PASS",label);}
  catch(e){console.error("FAIL",label);throw e;}
}

const runtimeSrc=fs.readFileSync("guiin-runtime-config.js","utf8");
const context={globalThis:null};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(runtimeSrc,context,{filename:"guiin-runtime-config.js"});
const R=context.GuiinRuntimeConfig;

ok("runtime config exists",()=>{
  assert(R);
  assert.strictEqual(R.VERSION,"runtime-env-v1");
});
ok("active environment is staging",()=>{
  assert.strictEqual(R.activeEnvironment(),"staging");
  assert.strictEqual(R.apiBase(),"https://guiin-saju-api-staging.blue-wls.workers.dev");
});
ok("production is fail-closed",()=>{
  assert.strictEqual(R.productionVerified(),false);
  assert.strictEqual(R.candidateBase("production"),"https://guiin-saju-api.blue-wls.workers.dev");
  assert.notStrictEqual(R.apiBase(),R.candidateBase("production"));
});
ok("runtime cannot be switched by URL/localStorage",()=>{
  assert(!/URLSearchParams|location\.search|getItem\(["']api_env/.test(runtimeSrc));
});

for(const name of ["index.html","demo.html"]){
  const html=fs.readFileSync(name,"utf8");
  ok(`${name} loads config before member data`,()=>{
    const r=html.indexOf("guiin-runtime-config.js?v=20260919a");
    const m=html.indexOf("member-data-v1.js?v=20260919a");
    assert(r>=0&&m>r);
  });
  ok(`${name} active API comes from config`,()=>{
    assert(html.includes("GuiinRuntimeConfig.apiBase"));
    assert(html.includes("const GUIIN_AI_API=guiinStableApiBase()+'/api/chat'"));
    assert(html.includes("GUIIN_RUNTIME_ENV"));
  });
  ok(`${name} preserves critical auth/AI/member paths`,()=>{
    for(const marker of [
      "KAKAO OAUTH RETURN BRIDGE",
      "entry.style.display='none'",
      "GuiinExpert.personModel(chart)",
      "requestId:requestMeta.id",
      "GuiinMemberData?.serverGuestToken?.()",
      "GuiinMemberData?.afterLogin",
      "conversationId:serverContext?.conversationId||null",
      "chartSnapshotId:serverContext?.chartSnapshotId||null"
    ]) assert(html.includes(marker),`${name}: missing ${marker}`);
  });
}

const member=fs.readFileSync("member-data-v1.js","utf8");
ok("member data prefers runtime config",()=>{
  const r=member.indexOf("root.GuiinRuntimeConfig");
  const s=member.indexOf('typeof root.guiinStableApiBase==="function"');
  assert(r>=0&&s>r);
  assert(member.includes('const DEFAULT_API="https://guiin-saju-api-staging.blue-wls.workers.dev"'));
});

const common=fs.readFileSync("guiin-server-client.js","utf8");
ok("legacy common client no longer defaults to production",()=>{
  assert(common.includes('const DEFAULT_API="https://guiin-saju-api-staging.blue-wls.workers.dev"'));
  assert(common.includes("GuiinRuntimeConfig"));
  assert(!common.includes('const API="https://guiin-saju-api.blue-wls.workers.dev"'));
});

console.log("\nEnvironment Separation Gate: ALL PASS");
