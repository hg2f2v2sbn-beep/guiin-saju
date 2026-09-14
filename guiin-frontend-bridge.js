/**
 * 귀인사주 프론트-서버 브리지 v1
 * 현재 UI를 바꾸지 않고 서버 상태를 읽어올 준비만 한다.
 * 서버가 아직 배포되지 않았거나 오류가 나면 기존 화면을 깨지 않고 local fallback 유지.
 */
(function(root,factory){
  if(typeof module==="object"&&module.exports){
    module.exports=factory(require("./guiin-server-client.js"));
  }else{
    root.GuiinFrontendBridge=factory(root.GuiinServerClient);
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(Server){
  "use strict";

  const STATE={
    ready:false,
    online:false,
    usage:null,
    purchases:null,
    restore:null,
    lastError:null,
    lastSyncAt:null
  };

  function snapshot(){return JSON.parse(JSON.stringify(STATE));}

  function normalizeUsage(data){
    const free=data?.usage?.free||data?.free||{};
    const wallet=data?.usage?.wallet||data?.wallet||{};
    return {
      free:{
        used:Number(free.used||0),
        reserved:Number(free.reserved||0),
        limit:Number(free.limit??3),
        remaining:Number(free.remaining??Math.max(0,Number(free.limit??3)-Number(free.used||0)-Number(free.reserved||0)))
      },
      wallet:{
        balance:Number(wallet.balance||0),
        reserved:Number(wallet.reserved||0),
        available:Number(wallet.available??Math.max(0,Number(wallet.balance||0)-Number(wallet.reserved||0)))
      }
    };
  }

  async function sync(){
    if(!Server)throw new Error("server_client_missing");
    try{
      await Server.ensureSession();
      const [u,p,r]=await Promise.allSettled([
        Server.usage(),Server.purchases(),Server.restoreSummary()
      ]);

      if(u.status==="fulfilled")STATE.usage=normalizeUsage(u.value);
      if(p.status==="fulfilled")STATE.purchases=p.value?.purchases||p.value||null;
      if(r.status==="fulfilled")STATE.restore=r.value?.restore||r.value||null;

      const any=[u,p,r].some(x=>x.status==="fulfilled");
      STATE.ready=true;STATE.online=any;
      STATE.lastError=any?null:"sync_failed";
      STATE.lastSyncAt=new Date().toISOString();
      return snapshot();
    }catch(e){
      STATE.ready=true;STATE.online=false;
      STATE.lastError=String(e?.message||e||"sync_failed");
      STATE.lastSyncAt=new Date().toISOString();
      return snapshot();
    }
  }

  function serverWalletAvailable(){
    return STATE.usage?.wallet?.available;
  }
  function serverFreeRemaining(){
    return STATE.usage?.free?.remaining;
  }
  function mayUseServerAccounting(){
    return STATE.online && Number.isFinite(serverFreeRemaining()) && Number.isFinite(serverWalletAvailable());
  }

  function applyUsageToDom(doc){
    if(!doc||!STATE.usage)return false;
    const coin=doc.getElementById("coinView");
    const free=doc.getElementById("freeRemainView");
    if(coin)coin.textContent=String(STATE.usage.wallet.available);
    if(free)free.textContent=String(STATE.usage.free.remaining);
    return !!(coin||free);
  }

  function purchaseHistoryHtml(esc){
    const orders=STATE.purchases?.orders||[];
    if(!orders.length)return "";
    const e=typeof esc==="function"?esc:(x=>String(x??""));
    return orders.slice(0,20).map(o=>{
      const p=o.product||{};
      return `<div class="trustBox"><b>${e(p.name||p.product_code||"구매")}</b><br>${e(o.state||"")} · ${Number(o.amount||0).toLocaleString("ko-KR")}원</div>`;
    }).join("");
  }

  return {
    STATE,snapshot,normalizeUsage,sync,
    serverWalletAvailable,serverFreeRemaining,mayUseServerAccounting,
    applyUsageToDom,purchaseHistoryHtml
  };
});
