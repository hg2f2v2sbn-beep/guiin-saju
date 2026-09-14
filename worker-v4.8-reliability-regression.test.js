"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v4.8-reliability-preview.js","utf8");
for(const x of ["4.8-reliability-preview","readServiceStates","runtimeGate","recordIncident","integritySnapshot","MAINTENANCE_MODE","READ_ONLY_MODE","AI_DISABLED","PAYMENTS_DISABLED"])assert(s.includes(x),x+" missing");
console.log("Worker v4.8 reliability preview: ALL PASS");
