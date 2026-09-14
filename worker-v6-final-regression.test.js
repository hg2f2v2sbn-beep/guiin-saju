"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v6.0-final-launch-preview.js","utf8");
for(const x of ["6.0-final-launch-preview","FINAL_PAYMENTS_FAIL_CLOSED=true","finalExternalGates","finalCodeGate","productionLaunchDecision","/api/final-launch/readiness","FINAL_CODE_GATE_VERIFIED"])assert(s.includes(x),x+" missing");
console.log("Worker v6 final launch preview: ALL PASS");
