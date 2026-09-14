/**
 * 귀인사주 서버 클라이언트 v2
 * 서버가 준비되면 무료질문/클로버/구매복원을 서버 기준으로 읽기 위한 공용 클라이언트.
 * 현재 index.html에 강제로 연결하지 않는다.
 */
(function(root,factory){
  if(typeof module==="object"&&module.exports)module.exports=factory();
  else root.GuiinServerClient=factory();
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const API="https://guiin-saju-api.blue-wls.workers.dev";
  const GUEST_KEY="guiin_guest_token_v1";
  const USER_KEY="guiin_user_token_v1";

  function storageGet(k){try{return localStorage.getItem(k)||"";}catch(_){return "";}}
  function storageSet(k,v){try{if(v)localStorage.setItem(k,String(v));else localStorage.removeItem(k);}catch(_){}}
  function guestToken(){return storageGet(GUEST_KEY);}
  function userToken(){return storageGet(USER_KEY);}
  function setGuestToken(v){storageSet(GUEST_KEY,v);}
  function setUserToken(v){storageSet(USER_KEY,v);}

  function authHeaders(extra={}){
    const h={"Accept":"application/json",...extra};
    const u=userToken(),g=guestToken();
    if(u)h["Authorization"]="Bearer "+u;
    else if(g)h["X-Guiin-Guest"]=g;
    return h;
  }

  async function request(path,opt={}){
    const headers=authHeaders(opt.headers||{});
    if(opt.body && !headers["Content-Type"])headers["Content-Type"]="application/json";
    const r=await fetch(API+path,{...opt,headers,cache:"no-store",mode:"cors"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      const e=new Error(d?.error||("HTTP "+r.status));
      e.status=r.status;e.data=d;throw e;
    }
    return d;
  }

  async function createGuest(){
    const r=await fetch(API+"/api/session/guest",{
      method:"POST",mode:"cors",cache:"no-store",
      headers:{"Accept":"application/json"}
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d?.guestToken){
      const e=new Error(d?.error||"guest_create_failed");e.status=r.status;throw e;
    }
    setGuestToken(d.guestToken);
    return d;
  }

  async function ensureGuest(){
    if(userToken())return null;
    const token=guestToken();
    if(token)return token;
    const d=await createGuest();
    return d.guestToken;
  }

  async function ensureSession(){
    if(userToken())return {type:"user"};
    await ensureGuest();
    return {type:"guest"};
  }

  async function usage(){
    await ensureSession();
    return request("/api/me/usage");
  }

  async function purchases(){
    await ensureSession();
    return request("/api/me/purchases");
  }

  async function restoreSummary(){
    await ensureSession();
    return request("/api/me/restore-summary");
  }

  async function authStatus(){
    await ensureSession();
    return request("/api/auth/status");
  }

  async function chat(payload,{idempotencyKey,signal}={}){
    await ensureSession();
    const key=String(idempotencyKey||payload?.requestId||"");
    return request("/api/chat",{
      method:"POST",
      headers:key?{"X-Idempotency-Key":key}:{},
      body:JSON.stringify(payload||{}),
      signal
    });
  }

  function clearSession(){
    setGuestToken("");
    setUserToken("");
  }

  return {
    API,GUEST_KEY,USER_KEY,
    guestToken,userToken,setGuestToken,setUserToken,authHeaders,
    request,createGuest,ensureGuest,ensureSession,
    usage,purchases,restoreSummary,authStatus,chat,clearSession
  };
});
