"use strict";
function tokenLooksValid(token,prefix){
  const s=String(token||"").trim();
  return s.startsWith(prefix)&&s.length>=prefix.length+32&&s.length<=256&&/^[A-Za-z0-9._:-]+$/.test(s);
}
function requireBearerHeader(value){
  const s=String(value||"").trim(),m=s.match(/^Bearer\s+(.+)$/i);
  if(!m||!tokenLooksValid(m[1],"usr_"))throw new Error("invalid_user_session");
  return m[1];
}
function requireGuestHeader(value){
  const s=String(value||"").trim();
  if(!tokenLooksValid(s,"gst_"))throw new Error("invalid_guest_session");
  return s;
}
function sessionExpiryDays(kind){
  if(kind==="user")return 30;
  if(kind==="guest")return 180;
  throw new Error("invalid_session_kind");
}
function sessionIsActive(row,nowMs=Date.now()){
  if(!row||row.revoked_at)return false;
  const exp=Date.parse(row.expires_at);
  return Number.isFinite(exp)&&exp>nowMs;
}
function resolveSubject({userSession,guestSession}){
  if(userSession?.user_id)return {type:"user",id:String(userSession.user_id),sessionId:userSession.id||null};
  if(guestSession?.id)return {type:"guest",id:String(guestSession.id),sessionId:guestSession.id};
  return null;
}
function canAccess({subject,userId,guestSessionId}){
  if(!subject)return false;
  if(subject.type==="user")return !!userId&&String(userId)===String(subject.id);
  if(subject.type==="guest")return !!guestSessionId&&String(guestSessionId)===String(subject.id);
  return false;
}
module.exports={tokenLooksValid,requireBearerHeader,requireGuestHeader,sessionExpiryDays,sessionIsActive,resolveSubject,canAccess};
