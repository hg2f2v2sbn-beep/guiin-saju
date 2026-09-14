"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v4.9-launch-gate-preview.js","utf8");
for(const x of ["4.9-launch-gate-preview","latestLaunchGate","launch_gate_runs","launch_gate_results","launchGatePreview:true"])assert(s.includes(x),x+" missing");
assert(s.includes("paymentsEnabled:false"));
console.log("Worker v4.9 launch gate preview: ALL PASS");
