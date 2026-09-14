(function(root,factory){
  if(typeof module==="object"&&module.exports)module.exports=factory(require("./guiin-server-client.js"));
  else root.GuiinLoginBridge=factory(root.GuiinServerClient);
})(typeof globalThis!=="undefined"?globalThis:this,function(Server){
  "use strict";
  async function start(provider,redirectPath="/"){
    if(!Server)throw new Error("server_client_missing");
    await Server.ensureGuest();
    return Server.request("/api/auth/login/start",{method:"POST",body:JSON.stringify({provider,redirect_path:redirectPath})});
  }
  async function logout(){
    if(!Server?.userToken?.())return {ok:true,alreadyLoggedOut:true};
    const r=await Server.request("/api/auth/logout",{method:"POST",body:"{}"});
    Server.setUserToken("");
    return r;
  }
  function isLoggedIn(){return !!Server?.userToken?.();}
  return {start,logout,isLoggedIn};
});
