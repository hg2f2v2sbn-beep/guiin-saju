"use strict";
const Security=require("./server-security.js");

function requestLog({requestId,method,path,status,durationMs,subject,errorCode,metadata}){
  return {
    request_id:String(requestId||"").slice(0,180),
    method:String(method||"").slice(0,12),
    path:String(path||"").slice(0,180),
    status:Number(status||0),
    duration_ms:Math.max(0,Math.round(Number(durationMs||0))),
    subject_type:subject?.type||null,
    subject_id:subject?.id?String(subject.id).slice(0,160):null,
    error_code:errorCode?String(errorCode).slice(0,120):null,
    metadata:Security.safeLogMetadata(metadata||{})
  };
}

function containsForbiddenPII(serialized){
  const s=String(serialized||"");
  return /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/.test(s) ||
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(s) ||
    /Bearer\s+[A-Za-z0-9._:-]{8,}/i.test(s) ||
    /gst_[A-Za-z0-9._:-]{16,}/i.test(s) ||
    /usr_[A-Za-z0-9._:-]{16,}/i.test(s);
}

module.exports={requestLog,containsForbiddenPII};
