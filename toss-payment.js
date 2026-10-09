/* GUIIN SAJU · Toss Payments V2.7 · test/live split + recovery/idempotency
 * Test mode uses /api/toss/test/order + /api/toss/test/confirm and NEVER grants entitlements.
 * Live mode uses /api/orders + /api/toss/confirm and is gated by the Worker launch gate.
 * The Toss secret key is never used in this browser file.
 */
(function(root){
  "use strict";

  const PROVIDER="toss_payments";
  const PRODUCT_LABELS={
    LIFETIME_SAJU:"프리미엄 평생사주",
    PREMIUM_COMPAT:"프리미엄 궁합",
    AI_CHAT_3:"AI 사주상담 질문 3회 패키지",
    AI_CHAT_6:"AI 사주상담 질문 6회 패키지",
    AI_CHAT_9:"AI 사주상담 질문 9회 패키지",
    AI_CHAT_18:"AI 사주상담 질문 18회 패키지"
  };

  let state={
    checked:false,
    mode:"missing",
    liveEnabled:false,
    liveCheckoutReady:false,
    testCheckoutReady:false,
    tossReady:false,
    serverAccountingReady:false,
    productCatalogReady:false,
    error:false
  };

  let paymentBusy=false;
  let activePaymentWindow=null;
  function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
  function setBusy(v){
    paymentBusy=!!v;
    try{setPaymentReadinessUI();}catch(_e){}
  }
  function timed(promise,ms=10000,label="request_timeout"){
    let timer;
    return Promise.race([
      Promise.resolve(promise),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),ms);})
    ]).finally(()=>clearTimeout(timer));
  }
  function confirmIdempotency(orderId,mode){
    const key="guiin_toss_confirm_idem_"+String(mode)+"_"+String(orderId);
    try{
      let v=sessionStorage.getItem(key)||"";
      if(!v){v=randomId(mode==="test"?"toss_test_confirm_":"toss_confirm_");sessionStorage.setItem(key,v);}
      return v;
    }catch(_e){return randomId(mode==="test"?"toss_test_confirm_":"toss_confirm_");}
  }

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
  function isTestReady(s){return s?.mode==="test"&&s?.testCheckoutReady===true&&s?.tossReady===true;}
  function isLiveReady(s){return s?.mode==="live"&&s?.liveEnabled===true&&s?.liveCheckoutReady===true&&s?.tossReady===true;}
  function isCheckoutReady(s){return isTestReady(s)||isLiveReady(s);}
  function legacyStateSync(){
    try{
      if(typeof guiinPaymentState!=="undefined")guiinPaymentState={
        checked:state.checked,
        liveEnabled:state.liveEnabled,
        liveCheckoutReady:state.liveCheckoutReady,
        sandboxEnabled:isTestReady(state),
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
    const prefix=isTestReady(state)?"토스 테스트":"토스페이먼츠";
    if(w)w.textContent=prefix+" 결제하기";
    if(p)p.textContent=prefix+" 5,900원 결제하기";
    if(c)c.textContent=prefix+" 7,900원 결제하기";
  }
  function setPaymentReadinessUI(){
    setButtonLabels();
    const ready=isCheckoutReady(state);
    const testReady=isTestReady(state);
    for(const buttonId of ["walletPayBtn","premiumPayBtn","compatPayBtn"]){
      const b=el(buttonId),r=el(readinessId(buttonId));
      if(!b||!r)continue;
      const consentOk=!!el(consentId(buttonId))?.checked;
      r.className="payReadiness "+(state.error?"error":ready?(testReady?"sandbox":"ready"):"wait");
      if(paymentBusy){
        r.textContent="결제 절차가 진행 중이에요. 결제창을 닫거나 완료할 때까지 잠시 기다려 주세요.";
        b.disabled=true;
      }else if(state.error){
        r.textContent="결제 서버 상태를 확인하지 못했어요. 현재 구매는 진행하지 않습니다.";
        b.disabled=true;
      }else if(testReady){
        r.textContent=consentOk
          ?"토스 테스트 결제 준비가 확인됐어요. 실제 상품·이용권은 지급되지 않습니다."
          :"테스트 결제입니다. 약관과 환불정책을 확인한 뒤 진행해 주세요.";
        b.disabled=!consentOk;
      }else if(ready){
        r.textContent=consentOk?"토스페이먼츠 결제 준비가 확인됐어요.":"약관과 환불정책을 확인한 뒤 결제를 진행해 주세요.";
        b.disabled=!consentOk;
      }else{
        r.textContent="토스페이먼츠 연동 점검 중입니다. 현재는 안전하게 잠가두었어요.";
        b.disabled=true;
      }
    }
    const info=el("paymentInfoStatus");
    if(info){
      info.className="paymentInfoStatus "+(state.error?"error":testReady?"sandbox":ready?"ready":"");
      info.textContent=state.error
        ?"결제 서버 상태를 확인하지 못했습니다."
        :testReady
          ?"토스페이먼츠 테스트 결제가 활성화되어 있습니다. 실제 청구·상품 지급은 하지 않습니다."
          :ready
            ?"토스페이먼츠 실결제가 활성화되어 있습니다."
            :"토스페이먼츠 연동 준비 중입니다.";
    }
  }
  async function refreshPaymentReadiness(){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),6500);
      let res;
      try{res=await fetch(apiBase()+"/health",{cache:"no-store",headers:{"Accept":"application/json"},signal:controller.signal});}
      finally{clearTimeout(timer);}
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error("health_failed");
      state={
        checked:true,
        mode:String(data?.tossKeyMode||"missing"),
        liveEnabled:data?.paymentsEnabled===true,
        liveCheckoutReady:data?.liveCheckoutReady===true,
        testCheckoutReady:data?.tossTestCheckoutReady===true,
        tossReady:data?.tossPaymentsReady===true,
        serverAccountingReady:data?.serverAccountingReady===true,
        productCatalogReady:data?.productCatalogReady===true,
        error:false
      };
    }catch(_e){
      state={checked:true,mode:"missing",liveEnabled:false,liveCheckoutReady:false,testCheckoutReady:false,tossReady:false,serverAccountingReady:false,productCatalogReady:false,error:true};
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
    if(data.mode!=="test"&&data.mode!=="live")throw new Error("invalid_toss_mode");
    return data;
  }
  async function paidResource(productCode){
    if(productCode!=="LIFETIME_SAJU"&&productCode!=="PREMIUM_COMPAT")return null;
    if(typeof root.guiinEnsurePaidResourceSnapshot!=="function")throw new Error("paid_resource_helper_missing");
    return root.guiinEnsurePaidResourceSnapshot(productCode);
  }
  async function createOrder(productCode,mode){
    await ensureSession();
    const resource=await paidResource(productCode);
    const path=mode==="test"?"/api/toss/test/order":"/api/orders";
    const res=await api(path,{
      method:"POST",cache:"no-store",
      headers:{"Content-Type":"application/json","Accept":"application/json","X-Idempotency-Key":randomId(mode==="test"?"toss_test_order_":"toss_order_")},
      body:JSON.stringify({product_code:productCode,chart_snapshot_id:resource?.chartSnapshotId||null})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data?.ok!==true||!data?.order?.id)throw new Error(data?.error||"order_create_failed");
    return data.order;
  }
  function message(id,textValue){const n=el(id);if(n)n.textContent=textValue;}
  function productLabel(code){return PRODUCT_LABELS[String(code||"")]||"귀인사주 유료상품";}
  function saveLast(productCode,orderId,mode){
    try{
      sessionStorage.setItem("guiin_toss_last_product",String(productCode||""));
      sessionStorage.setItem("guiin_toss_last_order",String(orderId||""));
      sessionStorage.setItem("guiin_toss_last_mode",String(mode||""));
    }catch(_e){}
  }
  function lastProduct(){try{return sessionStorage.getItem("guiin_toss_last_product")||"";}catch(_e){return "";}}
  function lastMode(){try{return sessionStorage.getItem("guiin_toss_last_mode")||"";}catch(_e){return "";}}
  function cleanupReturnUrl(u){
    ["tossPayment","tossMode","paymentKey","orderId","amount","paymentType","code","message"].forEach(k=>u.searchParams.delete(k));
    try{history.replaceState({},"",u.pathname+(u.searchParams.toString()?"?"+u.searchParams.toString():"")+u.hash);}catch(_e){}
  }
  function renderResult(kind,opts){
    opts=opts||{};
    const icon=el("paymentResultIcon"),title=el("paymentResultTitle"),copy=el("paymentResultCopy"),
      meta=el("paymentResultMeta"),primary=el("paymentResultPrimary"),badge=el("paymentResultBadge");
    if(!icon||!title||!copy||!primary)return;
    const testMode=opts.mode==="test";
    icon.className="payResultIcon"+(kind==="success"?"":kind==="cancel"?" cancel":" fail");
    icon.textContent=kind==="success"?"✓":kind==="cancel"?"–":"!";
    if(badge)badge.textContent=testMode?"토스 테스트":"토스페이먼츠";
    if(kind==="success"&&testMode){
      title.textContent="테스트 결제가 정상 승인됐어요";
      copy.textContent="토스 테스트 승인까지 확인했습니다. 실제 결제 청구와 상품·AI 이용권 지급은 하지 않았어요.";
      primary.textContent="결제 안내로 돌아가기";
    }else if(kind==="success"){
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
    const rows=[productLabel(productCode),testMode?"테스트 결제":"",opts.orderId?"주문번호: "+opts.orderId:"",opts.code?"응답코드: "+opts.code:""].filter(Boolean);
    if(meta){meta.textContent=rows.join(" · ");meta.style.display=rows.length?"block":"none";}
    primary.onclick=function(){
      if(String(productCode).startsWith("AI_CHAT_")&&root.guiinRestoreConsultReturn?.())return;
      if(testMode&&typeof root.go==="function")root.go("paymentInfo");
      else if(String(productCode).startsWith("AI_CHAT_")&&typeof root.go==="function")root.go("wallet");
      else if(productCode==="PREMIUM_COMPAT"&&typeof root.go==="function")root.go("matchResult");
      else if(productCode==="LIFETIME_SAJU"&&typeof root.go==="function")root.go("result");
      else if(typeof root.go==="function")root.go("paymentInfo");
    };
    if(typeof root.go==="function")root.go("paymentResult");
  }
  async function start(productCode,messageId,buttonId){
    if(root.guiinDemoConsultationBlocked?.()){message(messageId,"데모 결제는 분리된 staging 테스트 환경이 필요해. 운영 주문은 만들지 않았어.");return;}
    const btn=el(buttonId);
    if(paymentBusy){message(messageId,"이미 결제 절차가 진행 중이에요. 열린 결제창을 먼저 확인해 주세요.");return;}
    let keepBusy=false;
    try{
      const current=await refreshPaymentReadiness();
      if(!isCheckoutReady(current)){message(messageId,"토스페이먼츠 결제 연결이 아직 열리지 않았어요.");return;}
      if(!productCode){message(messageId,"상품 정보를 확인하지 못했어요.");return;}
      if(typeof root.TossPayments!=="function")throw new Error("toss_sdk_missing");
      setBusy(true);
      if(btn)btn.disabled=true;
      const cfg=await timed(config(),8000,"toss_config_timeout");
      const mode=cfg.mode;
      const testMode=mode==="test";
      if(testMode&&!cfg.testCheckoutReady)throw new Error("toss_test_not_ready");
      if(!testMode&&!cfg.liveCheckoutReady)throw new Error("toss_live_not_ready");
      message(messageId,testMode?"토스 테스트 결제창을 준비하고 있어요…":"토스페이먼츠 결제창을 준비하고 있어요…");
      if(String(productCode).startsWith("AI_CHAT_"))root.guiinSaveConsultReturn?.();
      const order=await timed(createOrder(productCode,mode),10000,"order_create_timeout");
      saveLast(productCode,order.id,mode);
      const tossPayments=root.TossPayments(cfg.clientKey);
      const widgets=tossPayments.widgets({customerKey:root.TossPayments.ANONYMOUS});
      await timed(widgets.setAmount({value:Number(order.amount),currency:String(order.currency||"KRW")}),8000,"toss_amount_timeout");
      const paymentWindow=await timed(widgets.renderPaymentWindow({orderName:productLabel(productCode),variantKey:{paymentMethod:"DEFAULT",agreement:"AGREEMENT"}}),12000,"toss_window_timeout");
      activePaymentWindow=paymentWindow;keepBusy=true;
      paymentWindow.on("cancel",function(){
        try{paymentWindow.destroy();}catch(_e){}
        if(activePaymentWindow===paymentWindow)activePaymentWindow=null;
        keepBusy=false;setBusy(false);message(messageId,"결제를 취소했어요.");
      });
      paymentWindow.on("paymentRequest",async function(){
        try{
          const base=location.origin+location.pathname;
          const suffix="&tossMode="+encodeURIComponent(mode);
          await widgets.requestPayment({orderId:String(order.id),orderName:productLabel(productCode),successUrl:base+"?tossPayment=success"+suffix,failUrl:base+"?tossPayment=fail"+suffix});
          // Some embedded browsers may return without navigating. Do not leave the purchase UI locked forever.
          setTimeout(()=>{if(document.visibilityState==="visible"&&activePaymentWindow===paymentWindow){try{paymentWindow.destroy();}catch(_e){}activePaymentWindow=null;setBusy(false);}},1500);
        }catch(err){
          message(messageId,"결제 요청을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
          try{paymentWindow.destroy();}catch(_e){}
          if(activePaymentWindow===paymentWindow)activePaymentWindow=null;
          keepBusy=false;setBusy(false);
          console.warn("GUIIN_TOSS_REQUEST_FAILED",err);
        }
      });
    }catch(err){
      console.warn("GUIIN_TOSS_START_FAILED",err);
      message(messageId,"토스페이먼츠 결제창을 열지 못했어요. 잠시 후 다시 시도해 주세요.");
    }finally{
      if(!keepBusy){activePaymentWindow=null;setBusy(false);if(btn)btn.disabled=false;}
    }
  }
  async function confirmReturn(u,mode){
    const paymentKey=String(u.searchParams.get("paymentKey")||"");
    const orderId=String(u.searchParams.get("orderId")||"");
    const amount=Number(u.searchParams.get("amount")||0);
    if(!paymentKey||!orderId||!Number.isFinite(amount)||amount<=0)throw new Error("invalid_payment_return");
    await ensureSession();
    const path=mode==="test"?"/api/toss/test/confirm":"/api/toss/confirm";
    const idem=confirmIdempotency(orderId,mode);
    let lastErr=null;
    for(let attempt=0;attempt<2;attempt++){
      try{
        const res=await timed(api(path,{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json","Accept":"application/json","X-Idempotency-Key":idem},body:JSON.stringify({paymentKey,orderId,amount})}),11000,"payment_confirm_timeout");
        const data=await res.json().catch(()=>({}));
        if(!res.ok||data?.ok!==true)throw new Error(data?.error||"payment_confirm_failed");
        if(mode!=="test")try{await root.guiinRefreshServerState?.({silent:true});}catch(_e){}
        return {orderId,data};
      }catch(err){lastErr=err;if(attempt===0)await sleep(650);}
    }
    throw lastErr||new Error("payment_confirm_failed");
  }
  async function recoverReturn(orderId){
    if(!orderId)throw new Error("order_id_required");
    await ensureSession();
    const res=await timed(api("/api/toss/recover",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({orderId})}),10000,"payment_recovery_timeout");
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data?.ok!==true)throw new Error(data?.error||"payment_recovery_failed");
    if(data?.state!=="FULFILLED"&&data?.providerStatus!=="DONE")throw new Error("payment_not_recovered");
    try{await root.guiinRefreshServerState?.({silent:true});}catch(_e){}
    return data;
  }
  async function handleReturn(){
    let u;try{u=new URL(location.href);}catch(_e){return;}
    const paymentMode=u.searchParams.get("tossPayment");
    if(!paymentMode)return;
    const productCode=lastProduct();
    const mode=String(u.searchParams.get("tossMode")||lastMode()||"");
    const safeMode=mode==="test"?"test":"live";
    if(paymentMode==="fail"){
      const code=String(u.searchParams.get("code")||"");
      const msg=String(u.searchParams.get("message")||"");
      const orderId=String(u.searchParams.get("orderId")||"");
      const kind=code==="PAY_PROCESS_CANCELED"?"cancel":"fail";
      cleanupReturnUrl(u);
      setTimeout(()=>renderResult(kind,{mode:safeMode,productCode:productCode,orderId:orderId,code:code,message:msg}),80);
      return;
    }
    if(paymentMode==="success"){
      try{
        const result=await confirmReturn(u,safeMode);
        cleanupReturnUrl(u);
        setTimeout(()=>renderResult("success",{mode:safeMode,productCode:productCode,orderId:result.orderId}),80);
      }catch(err){
        const orderId=String(u.searchParams.get("orderId")||"");
        if(safeMode==="live"){
          try{
            await recoverReturn(orderId);
            cleanupReturnUrl(u);
            setTimeout(()=>renderResult("success",{mode:safeMode,productCode,orderId}),80);
            return;
          }catch(_recoveryErr){}
        }
        cleanupReturnUrl(u);
        setTimeout(()=>renderResult("fail",{mode:safeMode,productCode:productCode,orderId:orderId,message:"승인 확인이 지연되고 있어요. 중복 결제하지 말고 이용내역을 확인한 뒤 문의해 주세요."}),80);
      }
    }
  }

  root.GuiinTossPayment={provider:PROVIDER,start,refreshPaymentReadiness,handleReturn,state:()=>({...state,paymentBusy})};
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
