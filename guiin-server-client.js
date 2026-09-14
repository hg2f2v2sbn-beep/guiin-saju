/**
 * 귀인사주 서버 런타임 클라이언트 어댑터.
 * 현재 index.html에 아직 연결하지 않습니다.
 * 서버 v3/D1 준비가 끝난 뒤 연결하면 localStorage 기반 무료횟수/지갑을 대체할 수 있습니다.
 */
(function(root,factory){
  if(typeof module==="object"&&module.exports)module.exports=factory();
  else root.GuiinServerClient=factory();
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const API="https://guiin-saju-api.blue-wls.workers.dev";
  const KEY="guiin_guest_token_v1";

  function getToken(){
    try{return localStorage.getItem(KEY)||"";}catch(_){return "";}
  }
  function setToken(v){
    try{localStorage.setItem(KEY,String(v||""));}catch(_){}
  }

  async function createGuest(){
    const r=await fetch(API+"/api/session/guest",{
      method:"POST",mode:"cors",cache:"no-store",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:"{}"
    });
    const d=await r.json();
    if(!r.ok||!d?.guestToken)throw new Error(d?.error||"guest_create_failed");
    setToken(d.guestToken);
    return d;
  }

  async function ensureGuest(){
    const token=getToken();
    if(token)return token;
    const d=await createGuest();
    return d.guestToken;
  }

  async function usage(){
    const token=await ensureGuest();
    const r=await fetch(API+"/api/me/usage",{
      method:"GET",mode:"cors",cache:"no-store",
      headers:{"Accept":"application/json","X-Guiin-Guest":token}
    });
    const d=await r.json();
    if(!r.ok)throw new Error(d?.error||"usage_failed");
    return d;
  }

  return {API,getToken,setToken,createGuest,ensureGuest,usage};
});
