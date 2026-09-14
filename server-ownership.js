"use strict";
function ownershipWhere(subject){
  if(!subject||!subject.type||!subject.id)throw new Error("subject_required");
  if(subject.type==="user")return {column:"user_id",value:String(subject.id),otherColumn:"guest_session_id"};
  if(subject.type==="guest")return {column:"guest_session_id",value:String(subject.id),otherColumn:"user_id"};
  throw new Error("invalid_subject_type");
}
function subjectColumns(subject){
  const w=ownershipWhere(subject);
  return {user_id:subject.type==="user"?subject.id:null,guest_session_id:subject.type==="guest"?subject.id:null,where:w};
}
function resourceOwnedBy(resource,subject){
  if(!resource||!subject)return false;
  if(subject.type==="user")return String(resource.user_id||"")===String(subject.id);
  if(subject.type==="guest")return String(resource.guest_session_id||"")===String(subject.id);
  return false;
}
module.exports={ownershipWhere,subjectColumns,resourceOwnedBy};
