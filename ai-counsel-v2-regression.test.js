"use strict";
const fs=require("fs"),assert=require("assert");
const h=fs.readFileSync("index.html","utf8");
const w=fs.readFileSync("worker.js","utf8");

function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("AI payload includes person model",()=>{
  assert(h.includes("GuiinExpert.personModel(chart)"));
  assert(h.includes("person_model:safePlain(personModel)"));
});
ok("AI request has retry-safe idempotency key",()=>{
  assert(h.includes("X-Idempotency-Key"));
  assert(h.includes("requestId:requestMeta.id"));
  assert(h.includes("sessionStorage.setItem"));
  assert(h.includes("guiinClearPendingAI(requestMeta.key)"));
});
ok("Worker accepts full current flow",()=>{
  for(const k of ["current_daeun","current_seun","current_wolun","current_ilun","person_model","precision"]){
    assert(w.includes(k),k+" missing");
  }
});
ok("Worker separates distribution from strength",()=>{
  assert(w.includes("element_distribution"));
  assert(w.includes("element_strength"));
  assert(w.includes("element_distribution을 element_strength로 바꾸어 해석하지 마세요"));
});
ok("Worker quality gate covers repetition and deterministic claims",()=>{
  assert(w.includes("repeated_paragraph"));
  assert(w.includes("deterministic_fear"));
  assert(w.includes("medical_diagnosis"));
  assert(w.includes("generic_honorific"));
});
ok("Worker optional idempotency store replay",()=>{
  assert(w.includes("AI_IDEMPOTENCY"));
  assert(w.includes("replayed:true"));
});
console.log("\nAI counsel v2 regression: ALL PASS");
