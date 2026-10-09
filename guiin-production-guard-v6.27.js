/* GUIIN production runtime guard v6.27
 * On the public production host, frontend API traffic must never fall back to staging.
 */
(function(root){
  "use strict";
  const PROD_API="https://guiin-saju-api.blue-wls.workers.dev";
  const PROD_HOSTS=new Set(["gwiinsaju.com","www.gwiinsaju.com"]);
  const host=String(root.location?.hostname||"").toLowerCase();
  if(/\/demo\.html$/.test(root.location?.pathname||""))return;
  if(!PROD_HOSTS.has(host))return;
  let current="";
  try{current=String(root.GuiinRuntimeConfig?.apiBase?.()||"").replace(/\/+$/,"");}catch(_e){}
  if(current===PROD_API)return;
  const cfg=Object.freeze({
    VERSION:"runtime-guard-v6.27",
    API_BASES:Object.freeze({production:PROD_API}),
    activeEnvironment:()=>"production",
    productionVerified:()=>true,
    apiBase:()=>PROD_API,
    candidateBase:(env)=>env==="production"?PROD_API:"",
    healthUrl:()=>PROD_API+"/health",
    describe:()=>Object.freeze({version:"runtime-guard-v6.27",activeEnvironment:"production",apiBase:PROD_API,productionVerified:true,guardCorrected:true})
  });
  root.GuiinRuntimeConfig=cfg;
  root.GUIIN_RUNTIME_GUARD_CORRECTED=true;
  try{console.warn("GUIIN_RUNTIME_GUARD: production API config was corrected before member data loaded");}catch(_e){}
})(window);
