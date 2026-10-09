/**
 * 귀인사주 Runtime Environment Config v1
 * staging/production을 한 곳에서 관리하고 production은 검증 전 fail-closed 합니다.
 */
(function(root){
  "use strict";

  const VERSION="runtime-env-v1";
  const demoPage=/\/demo\.html$/.test(root.location?.pathname||"");
  const ACTIVE_ENVIRONMENT=demoPage?"staging":"production";
  // Same-origin demo pages must not inherit production authentication or drafts.
  if(demoPage&&root.Storage){
    const p=root.Storage.prototype, prefix="guiin_demo_staging:", get=p.getItem,set=p.setItem,remove=p.removeItem,key=p.key;
    p.getItem=function(k){return get.call(this,prefix+k)};
    p.setItem=function(k,v){return set.call(this,prefix+k,v)};
    p.removeItem=function(k){return remove.call(this,prefix+k)};
    p.clear=function(){const keys=[];for(let i=0;i<this.length;i++){const k=key.call(this,i);if(k?.startsWith(prefix))keys.push(k)}keys.forEach(k=>remove.call(this,k))};
    const originalFetch=root.fetch;
    if(originalFetch)root.fetch=function(input,options){
      const target=String(input?.url||input);
      if(/^https:\/\/guiin-saju-api\.blue-wls\.workers\.dev(?:\/|$)/.test(target))return Promise.reject(new Error("demo_production_api_blocked"));
      return originalFetch.call(this,input,options);
    };
  }
  const PRODUCTION_VERIFIED=true;

  const API_BASES=Object.freeze({
    staging:"https://guiin-saju-api-staging.blue-wls.workers.dev",
    production:"https://guiin-saju-api.blue-wls.workers.dev"
  });

  function cleanBase(v){return String(v||"").trim().replace(/\/+$/,"");}
  function activeEnvironment(){return ACTIVE_ENVIRONMENT;}
  function productionVerified(){return PRODUCTION_VERIFIED===true;}
  function apiBase(){
    if(ACTIVE_ENVIRONMENT==="production" && PRODUCTION_VERIFIED===true){
      return cleanBase(API_BASES.production);
    }
    return cleanBase(API_BASES.staging);
  }
  function candidateBase(env){return cleanBase(API_BASES[env]||"");}
  function healthUrl(){return apiBase()+"/health";}
  function describe(){
    return Object.freeze({
      version:VERSION,
      activeEnvironment:activeEnvironment(),
      apiBase:apiBase(),
      productionVerified:productionVerified(),
      productionCandidate:candidateBase("production")
    });
  }

  root.GuiinRuntimeConfig=Object.freeze({
    VERSION,API_BASES,activeEnvironment,productionVerified,
    apiBase,candidateBase,healthUrl,describe
  });
})(typeof globalThis!=="undefined"?globalThis:this);
