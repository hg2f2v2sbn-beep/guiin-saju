"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v5.4-authority-transition-preview.js","utf8");
for(const x of ["5.4-authority-transition-preview","authorityMode","authorityCapabilities","/api/capabilities","CLIENT_AUTHORITY_MODE"])assert(s.includes(x),x+" missing");
console.log("Worker v5.4 authority transition: ALL PASS");
