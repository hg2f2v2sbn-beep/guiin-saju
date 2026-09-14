/**
 * 귀인사주 profile/conversation 서버 클라이언트.
 * 아직 index.html에 자동 연결하지 않습니다.
 */
(function(root,factory){
  if(typeof module==="object"&&module.exports)module.exports=factory();
  else root.GuiinDataClient=factory();
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const API="https://guiin-saju-api.blue-wls.workers.dev";
  const GUEST_KEY="guiin_guest_token_v1";

  function token(){try{return localStorage.getItem(GUEST_KEY)||"";}catch(_){return "";}}
  async function api(path,opt={}){
    const headers={"Accept":"application/json",...(opt.headers||{})};
    const t=token(); if(t)headers["X-Guiin-Guest"]=t;
    if(opt.body && !headers["Content-Type"])headers["Content-Type"]="application/json";
    const r=await fetch(API+path,{...opt,headers,cache:"no-store",mode:"cors"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d?.error||("HTTP "+r.status));
    return d;
  }

  function saveProfile(profile){
    return api("/api/profiles",{method:"POST",body:JSON.stringify(profile)});
  }
  function createConversation(title,chartSnapshotId){
    return api("/api/conversations",{method:"POST",body:JSON.stringify({title,chart_snapshot_id:chartSnapshotId||null})});
  }
  function listConversations(){return api("/api/conversations");}
  function listMessages(id){return api("/api/conversations/"+encodeURIComponent(id)+"/messages");}
  function appendMessage(id,message){
    return api("/api/conversations/"+encodeURIComponent(id)+"/messages",{
      method:"POST",body:JSON.stringify(message)
    });
  }

  return {API,saveProfile,createConversation,listConversations,listMessages,appendMessage};
});
