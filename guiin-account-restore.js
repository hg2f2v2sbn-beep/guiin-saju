/**
 * 로그인 완료 후 게스트 이용내역을 회원계정으로 승계하고 구매내역을 복원하는 브리지.
 * 실제 OAuth/로그인 공급자가 userToken을 발급한 뒤에만 호출한다.
 */
(function(root,factory){
  if(typeof module==="object"&&module.exports)module.exports=factory(require("./guiin-server-client.js"),require("./guiin-frontend-bridge.js"));
  else root.GuiinAccountRestore=factory(root.GuiinServerClient,root.GuiinFrontendBridge);
})(typeof globalThis!=="undefined"?globalThis:this,function(Server,Bridge){
  "use strict";

  function requestId(){
    try{return "link_"+crypto.randomUUID();}catch(_){return "link_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2);}
  }

  async function completeVerifiedLogin({userToken,guestToken}={}){
    if(!Server)throw new Error("server_client_missing");
    const user=String(userToken||"").trim();
    const guest=String(guestToken||Server.guestToken?.()||"").trim();
    if(!user)throw new Error("verified_user_token_required");

    // 로그인 공급자가 검증한 user token을 먼저 설치한다.
    Server.setUserToken(user);

    let link=null;
    if(guest){
      const key=requestId();
      try{
        link=await Server.request("/api/auth/link-guest",{
          method:"POST",
          headers:{"X-Guiin-Guest":guest,"X-Idempotency-Key":key},
          body:JSON.stringify({requestId:key})
        });
      }catch(e){
        // 승계 실패 시 guest token을 지우지 않는다. 데이터 유실 방지.
        throw e;
      }
    }

    // 승계가 성공했거나 기존 guest가 없을 때 서버 데이터를 다시 읽는다.
    const restored=Bridge?await Bridge.sync():null;
    if(guest)Server.setGuestToken("");
    return {linked:!!link,link,restored};
  }

  async function restoreCurrentAccount(){
    if(!Server?.userToken?.())throw new Error("login_required");
    return Bridge?Bridge.sync():Server.restoreSummary();
  }

  function loginReady(){
    return !!Server?.userToken?.();
  }

  return {completeVerifiedLogin,restoreCurrentAccount,loginReady};
});
