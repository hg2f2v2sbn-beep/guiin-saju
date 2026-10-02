/* GUIIN SAJU · Toss Payments V2 payment-window integration
 * Official flow: widgets() -> setAmount() -> renderPaymentWindow()
 * -> paymentRequest -> requestPayment() -> server confirm.
 * Secret key is never used in this browser file.
 */
(function(root){
  "use strict";

  const PROVIDER="toss";
  const PRODUCT_LABELS={
    LIFETIME_SAJU:"프리미엄 평생사주",
    PREMIUM_COMPAT:"프리미엄 궁합",
    AI_CHAT_3:"AI 사주상담 질문 3회 패키지",
    AI_CHAT_6:"AI 사주상담 질문 6회 패키지",
    AI_CHAT_9:"AI 사주상담 질문 9회 패키지",
    AI_CHAT_18:"AI 사주상담 질문 18회 패키지"
  };
  let state={
    checked:false,liveEnabled:false,liveCheckoutReady:false,tossReady:false,
    serverAccountingReady:false,productCatalogReady:false,error:false
  };

  function el(id){return document.getElementById(id);}
  function apiBase(){
    try{
      const runtime=root.GuiinRuntimeConfig;
      const v=runtime&&typeof runtime.apiBase==="function"?runtime.apiBase():"";
      return String(v||"https://guiin-saju-api.blue-wls.workers.dev").replace(/\/+$/,"");
    }catch(_e){return "https://guiin-saju-api.blue-wls.workers.dev";}
  }
  function randomId(prefix){
    try{
      if(root.guiinRandomId)return root.guiinRandomId(prefix);
      if(root.crypto&&root.crypto.randomUUID)return prefix+root.crypto.randomUUID();
    }catch(_e){}
    return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2);
  }
  function api(path,options){
    if(typeof root.guiinApi==="function")return root.guiinApi(path,options||{});
    return fetch(apiBase()+path,options||{});
  }
  async function ensureSession(){
    try{await root.GuiinMemberData?.ensureServerGuest?.();}catch(_e){}
    return true;
  }
  function legacyStateSync(){
    try{
      if(typeof guiinPaymentState!=="undefined")guiinPaymentState={
        checked:state.checked,
        liveEnabled:state.liveEnabled,
        liveCheckoutReady:state.liveCheckoutReady,
        sandboxEnabled:false,
        serverAccountingReady:state.serverAccountingReady,
        productCatalogReady:state.productCatalogReady,
        error:state.error
      };
    }catch(_e){}
  }
  function consentId(buttonId){
    if(buttonId==="walletPayBtn")return "walletPayConsent";
    if(buttonId==="premiumPayBtn")return "premiumPayConsent";
    return "compatPayConsent";
  }
  function readinessId(buttonId){
    if(buttonId==="walletPayBtn")return "walletPayReadiness";
    if(buttonId==="premiumPayBtn")return "premiumPayReadiness";
    return "compatPayReadiness";
  }
  function setButtonLabels(){
    const w=el("walletPayBtn"),p=el("premiumPayBtn"),c=el("compatPayBtn");
    if(w)w.textContent="토스페이먼츠로 결제하기";
    if(p)p.textContent="토스페이먼츠 5,900원 결제하기";
    if(c)c.textContent="토스페이먼츠 7,900원 결제하기";
  }
  function setPaymentReadinessUI(){
    setButtonLabels();
    for(const buttonId of ["walletPayBtn","premiumPayBtn","compatPayBtn"]){
      const b=el(buttonId),r=el(readinessId(buttonId));
      if(!b||!r)continue;
      const consentOk=!!el(consentId(buttonId))?.checked;
      const ready=state.liveEnabled&&state.liveCheckoutReady&&state.tossReady;
      r.className="payReadiness "+(state.error?"error":ready?"ready":"wait");
      if(state.error){
        r.textContent="결제 서버 상태를 확인하지 못했어요. 현재 구매는 진행하지 않습니다.";
        b.disabled=true;
      }else if(ready){
        r.textContent=consentOk?"토스페이먼츠 결제 준비가 확인됐어요.":"약관과 환불정책을 확인한 뒤 결제를 진행해 주세요.";
        b.disabled=!consentOk;
      }else{
        r.textContent="토스페이먼츠 심사·연동을 마친 뒤 결제가 열립니다. 현재는 안전하게 잠가두었어요.";
        b.disabled=true;
      }
    }
    const info=el("paymentInfoStatus");
    if(info){
      const ready=state.liveEnabled&&state.liveCheckoutReady&&state.tossReady;
      info.className="paymentInfoStatus "+(state.error?"error":ready?"ready":"");
      info.textContent=state.error?"결제 서버 상태를 확인하지 못했습니다.":ready?"토스페이먼츠 실결제가 활성화되어 있습니다.":"토스페이먼츠 심사·연동 준비 중입니다.";
    }
  }
  async function refreshPaymentReadiness(){
    try{
      const res=await fetch(apiBase()+"/health",{cache:"no-store",headers:{"Accept":"application/json"}});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error("health_failed");
      state={
        checked:true,
        liveEnabled:data?.paymentsEnabled===true,
        liveCheckoutReady:data?.liveCheckoutReady===true,
        tossReady:data?.tossPaymentsReady===true,
        serverAccountingReady:data?.serverAccountingReady===true,
        productCatalogReady:data?.productCatalogReady===true,
        error:false
      };
    }catch(_e){
      state={checked:true,liveEnabled:false,liveCheckoutReady:false,tossReady:false,serverAccountingReady:false,productCatalogReady:false,error:true};
    }
    legacyStateSync();
    setPaymentReadinessUI();
    return state;
  }
  async function config(){
    await ensureSession();
    const res=await api("/api/toss/config",{method:"GET",cache:"no-store",headers:{"Accept":"application/json"}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data?.ok!==true||!data?.clientKey)throw new Error(data?.error||"toss_config_not_ready");
    return data;
  }
  async function paidResource(productCode){
    if(productCode!=="LIFETIME_SAJU"&&productCode!=="PREMIUM_COMPAT")return null;
    if(typeof root.guiinEnsurePaidResourceSnapshot!=="function")throw new Error("paid_resource_helper_missing");
    return root.guiinEnsurePaidResourceSnapshot(productCode);
  }
  async function createOrder(productCode){
    await ensureSession();
    const resource=await paidResource(productCode);
    const res=await api("/api/orders",{
      method:"POST",cache:"no-store",
      headers:{"Content-Type":"application/json","Accept":"application/json","X-Idempotency-Key":randomId("toss_order_")},
      body:JSON.stringify({product_code:productCode,chart_snapshot_id:resource?.chartSnapshotId||null})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data?.ok!==true||!data?.order?.id)throw new Error(data?.error||"order_create_failed");
    return data.order;
  }
  function message(id,text){const n=el(id);if(n)n.textContent=text;}
  function productLabel(code){return PRODUCT_LABELS[String(code||"")]||"귀인사주 유료상품";}
  function saveLast(productCode,orderId){
    try{
      sessionStorage.setItem("guiin_toss_last_product",String(productCode||""));
      sessionStorage.setItem("guiin_toss_last_order",String(orderId||""));
    }catch(_e){}
  }
  function lastProduct(){try{return sessionStorage.getItem("guiin_toss_last_product")||"";}catch(_e){return "";}}
  function cleanupReturnUrl(u){
    ["tossPayment","paymentKey","orderId","amount","paymentType","code","message"].forEach(k=>u.searchParams.delete(k));
    try{history.replaceState({},"",u.pathname+(u.searchParams.toString()?"?"+u.searchParams.toString():"")+u.hash);}catch(_e){}
  }
  function renderResult(kind,opts){
    opts=opts||{};
    const icon=el("paymentResultIcon"),title=el("paymentResultTitle"),copy=el("paymentResultCopy"),
      meta=el("paymentResultMeta"),primary=el("paymentResultPrimary"),badge=el("paymentResultBadge");
    if(!icon||!title||!copy||!primary)return;
    icon.className="payResultIcon"+(kind==="success"?"":kind==="cancel"?" cancel":" fail");
    icon.textContent=kind==="success"?"✓":kind==="cancel"?"–":"!";
    if(badge)badge.textContent="토스페이먼츠";
    if(kind==="success"){
      title.textContent="결제가 완료됐어요";
      copy.textContent="토스페이먼츠 승인과 귀인사주 서버 검증이 완료되어 구매한 이용권이 반영됐어요.";
      primary.textContent="구매한 서비스 보기";
    }else if(kind==="cancel"){
      title.textContent="결제를 취소했어요";
      copy.textContent="결제 승인은 이루어지지 않았어요. 원할 때 다시 결제할 수 있습니다.";
      primary.textContent="다시 확인하기";
    }else{
      title.textContent="결제를 완료하지 못했어요";
      copy.textContent=opts.message?"결제 처리 중 오류가 발생했어요. "+String(opts.message).slice(0,140):"결제 처리 중 오류가 발생했어요. 결제 내역을 확인한 뒤 다시 시도해 주세요.";
      primary.textContent="다시 시도하기";
    }
    const productCode=opts.productCode||lastProduct();
    const rows=[productLabel(productCode),opts.orderId?"주문번호: "+opts.orderId:"",opts.code?"응답코드: "+opts.code:""].filter(Boolean);
    if(meta){meta.textContent=rows.join(" · ");meta.style.display=rows.length?"block":"none";}
    primary.onclick=function(){
      if(String(productCode).startsWith("AI_CHAT_")&&typeof root.go==="function")root.go("wallet");
      else if(productCode==="PREMIUM_COMPAT"&&typeof root.go==="function")root.go("matchResult");
      else if(productCode==="LIFETIME_SAJU"&&typeof root.go==="function")root.go("result");
      else if(typeof root.go==="function")root.go("paymentInfo");
    };
    if(typeof root.go==="function")root.go("paymentResult");
  }
  async function start(productCode,messageId,buttonId){
    const btn=el(buttonId);
    try{
      const current=await refreshPaymentReadiness();
      if(!(current.liveEnabled&&current.liveCheckoutReady&&current.tossReady)){
        message(messageId,"토스페이먼츠 실결제 연결이 아직 열리지 않았어요.");
        return;
      }
      if(!productCode){message(messageId,"상품 정보를 확인하지 못했어요.");return;}
      if(typeof root.TossPayments!=="function")throw new Error("toss_sdk_missing");
      if(btn)btn.disabled=true;
      message(messageId,"토스페이먼츠 결제창을 준비하고 있어요…");
      const cfg=await config();
      const order=await createOrder(productCode);
      saveLast(productCode,order.id);
      const tossPayments=root.TossPayments(cfg.clientKey);
      const widgets=tossPayments.widgets({customerKey:root.TossPayments.ANONYMOUS});
      await widgets.setAmount({value:Number(order.amount),currency:String(order.currency||"KRW")});
      const paymentWindow=await widgets.renderPaymentWindow({
        orderName:productLabel(productCode),
        variantKey:{paymentMethod:"DEFAULT",agreement:"AGREEMENT"}
      });
      paymentWindow.on("cancel",function(){
        try{paymentWindow.destroy();}catch(_e){}
        message(messageId,"결제를 취소했어요.");
      });
      paymentWindow.on("paymentRequest",async function(){
        try{
          await widgets.requestPayment({
            orderId:String(order.id),
            orderName:productLabel(productCode),
            successUrl:location.origin+"/?tossPayment=success",
            failUrl:location.origin+"/?tossPayment=fail"
          });
        }catch(err){
          message(messageId,"결제 요청을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
          try{paymentWindow.destroy();}catch(_e){}
          console.warn("GUIIN_TOSS_REQUEST_FAILED",err);
        }
      });
    }catch(err){
      console.warn("GUIIN_TOSS_START_FAILED",err);
      message(messageId,"토스페이먼츠 결제창을 열지 못했어요. 잠시 후 다시 시도해 주세요.");
    }finally{
      if(btn)btn.disabled=false;
    }
  }
  async function confirmReturn(u){
    const paymentKey=String(u.searchParams.get("paymentKey")||"");
    const orderId=String(u.searchParams.get("orderId")||"");
    const amount=Number(u.searchParams.get("amount")||0);
    if(!paymentKey||!orderId||!Number.isFinite(amount)||amount<=0)throw new Error("invalid_payment_return");
    await ensureSession();
    const res=await api("/api/toss/confirm",{
      method:"POST",cache:"no-store",
      headers:{"Content-Type":"application/json","Accept":"application/json","X-Idempotency-Key":randomId("toss_confirm_")},
      body:JSON.stringify({paymentKey:paymentKey,orderId:orderId,amount:amount})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data?.ok!==true)throw new Error(data?.message||data?.error||"payment_confirm_failed");
    try{await root.guiinRefreshServerState?.({silent:true});}catch(_e){}
    return {orderId:orderId,data:data};
  }
  async function handleReturn(){
    let u;try{u=new URL(location.href);}catch(_e){return;}
    const mode=u.searchParams.get("tossPayment");
    if(!mode)return;
    const productCode=lastProduct();
    if(mode==="fail"){
      const code=String(u.searchParams.get("code")||"");
      const msg=String(u.searchParams.get("message")||"");
      const orderId=String(u.searchParams.get("orderId")||"");
      const kind=code==="PAY_PROCESS_CANCELED"?"cancel":"fail";
      cleanupReturnUrl(u);
      setTimeout(()=>renderResult(kind,{productCode:productCode,orderId:orderId,code:code,message:msg}),80);
      return;
    }
    if(mode==="success"){
      try{
        const result=await confirmReturn(u);
        cleanupReturnUrl(u);
        setTimeout(()=>renderResult("success",{productCode:productCode,orderId:result.orderId}),80);
      }catch(err){
        const orderId=String(u.searchParams.get("orderId")||"");
        cleanupReturnUrl(u);
        setTimeout(()=>renderResult("fail",{productCode:productCode,orderId:orderId,message:err?.message||"승인 확인 실패"}),80);
      }
    }
  }

  root.GuiinTossPayment={provider:PROVIDER,start,refreshPaymentReadiness,handleReturn,state:()=>({...state})};
  root.setPaymentReadinessUI=setPaymentReadinessUI;
  root.refreshPaymentReadiness=refreshPaymentReadiness;
  root.payNotReady=function(){return start(typeof guiinPaySelection!=="undefined"?guiinPaySelection.productCode:"","payMsg","walletPayBtn");};
  root.premiumPayNotReady=function(){return start("LIFETIME_SAJU","premiumPayMsg","premiumPayBtn");};
  root.compatPayNotReady=function(){return start("PREMIUM_COMPAT","compatPayMsg","compatPayBtn");};

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){setButtonLabels();refreshPaymentReadiness();handleReturn();},{once:true});
  }else{
    setButtonLabels();refreshPaymentReadiness();handleReturn();
  }
})(window);
