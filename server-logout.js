"use strict";
function logoutDecision({sessionRow,allSessions=false}){
  if(!sessionRow)return {action:"noop",reason:"session_missing"};
  if(sessionRow.revoked_at)return {action:"noop",reason:"already_revoked"};
  return {action:allSessions?"revoke_user_sessions":"revoke_current_session",user_id:String(sessionRow.user_id),session_id:String(sessionRow.id),revoke_reason:"logout"};
}
module.exports={logoutDecision};
