/**
 * 귀인사주 profile/conversation 서버 클라이언트 v2
 */
(function(root,factory){
  if(typeof module==="object"&&module.exports)module.exports=factory(
    typeof require==="function"?require("./guiin-server-client.js"):null
  );
  else root.GuiinDataClient=factory(root.GuiinServerClient);
})(typeof globalThis!=="undefined"?globalThis:this,function(Server){
  "use strict";
  if(!Server){
    return {available:false};
  }

  async function api(path,opt={}){
    await Server.ensureSession();
    return Server.request(path,opt);
  }

  function saveProfile(profile){
    return api("/api/profiles",{method:"POST",body:JSON.stringify(profile)});
  }
  function listProfiles(){return api("/api/profiles");}

  function createChartSnapshot(payload){
    return api("/api/chart-snapshots",{method:"POST",body:JSON.stringify(payload)});
  }
  function getChartSnapshot(id){
    return api("/api/chart-snapshots/"+encodeURIComponent(id));
  }

  function createConversation(title,chartSnapshotId){
    return api("/api/conversations",{method:"POST",body:JSON.stringify({
      title:title||null,
      chart_snapshot_id:chartSnapshotId||null
    })});
  }
  function listConversations(){return api("/api/conversations");}
  function listMessages(id){return api("/api/conversations/"+encodeURIComponent(id)+"/messages");}
  function appendMessage(id,message){
    return api("/api/conversations/"+encodeURIComponent(id)+"/messages",{
      method:"POST",body:JSON.stringify(message)
    });
  }

  return {
    available:true,api,saveProfile,listProfiles,createChartSnapshot,getChartSnapshot,
    createConversation,listConversations,listMessages,appendMessage
  };
});
