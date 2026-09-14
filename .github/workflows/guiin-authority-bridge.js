/**
 * 귀인사주 localStorage → 서버 기준 전환 브리지 v1
 * 기본은 SHADOW. 서버값을 읽되 기존 UI 차감 로직을 당장 바꾸지 않는다.
 */
(function(root,factory){
  if(typeof module==="object"&&module.exports){
    module.exports=factory(require("./guiin-server-client.js"),require("./guiin-frontend-bridge.js"));
  }else{
    root.GuiinAuthorityBridge=factory(root.GuiinServerClient,root.GuiinFrontendBridge);
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(Server,Bridge){
  "use strict";

  const KEY="guiin_authority_mode_v1";
  const SHADOW="SHADOW",SERVER="SERVER",LEGACY="LEGACY";

  function getMode(){
    try{
      const v=localStorage.getItem(KEY);
      return [LEGACY,SHADOW,SERVER].includes(v)?v:SHADOW;
    }catch(_){return SHADOW;}
  }

  function setMode(v){
    if(![LEGACY,SHADOW,SERVER].includes(v))throw new Error("invalid_authority_mode");
    try{localStorage.setItem(KEY,v);}catch(_){}
  }

  async function sync(){
    const mode=getMode();
    if(!Server||!Bridge)return {mode,online:false};
    const state=await Bridge.sync();
    return {mode,online:!!state.online,server:state};
  }

  function mayRenderServerUsage(state){
    return getMode()===SERVER && !!state?.server?.usage;
  }

  function applyServerUsageWhenReady(doc,state){
    if(!mayRenderServerUsage(state))return false;
    return Bridge.applyUsageToDom(doc);
  }

  function serverIsAuthority(){
    return getMode()===SERVER;
  }

  function shadowMode(){
    return getMode()===SHADOW;
  }

  return {KEY,LEGACY,SHADOW,SERVER,getMode,setMode,sync,mayRenderServerUsage,applyServerUsageWhenReady,serverIsAuthority,shadowMode};
});
