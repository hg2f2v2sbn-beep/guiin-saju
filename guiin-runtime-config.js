/**
 * 귀인사주 Runtime Environment Config v1
 * staging/production을 한 곳에서 관리하고 production은 검증 전 fail-closed 합니다.
 */
(function(root){
  "use strict";

  const VERSION="runtime-env-v1";
  const ACTIVE_ENVIRONMENT="production";
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
