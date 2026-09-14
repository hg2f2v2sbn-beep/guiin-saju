"use strict";

function requireAuthenticatedUser(subject){
  if(!subject||subject.type!=="user"||!subject.id)throw new Error("authenticated_user_required");
  return String(subject.id);
}

function validateLinkRequest({userSubject,guestSession,guestTokenPresented,idempotencyKey}){
  const userId=requireAuthenticatedUser(userSubject);
  if(!guestSession?.id)throw new Error("guest_session_required");
  if(!guestTokenPresented)throw new Error("guest_possession_required");
  const key=String(idempotencyKey||"").trim();
  if(key.length<12||key.length>200)throw new Error("invalid_idempotency_key");
  if(guestSession.converted_user_id && String(guestSession.converted_user_id)!==userId)
    throw new Error("guest_already_linked");
  return {userId,guestSessionId:String(guestSession.id),idempotencyKey:key};
}

function restoreContract({usage,purchases,profiles,conversations}={}){
  return {
    usage:usage||null,
    purchases:purchases||null,
    profiles:Array.isArray(profiles)?profiles:[],
    conversations:Array.isArray(conversations)?conversations:[]
  };
}

module.exports={requireAuthenticatedUser,validateLinkRequest,restoreContract};
