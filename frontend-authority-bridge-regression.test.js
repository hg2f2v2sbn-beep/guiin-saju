"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("guiin-authority-bridge.js","utf8");
for(const x of ["SHADOW","SERVER","LEGACY","guiin_authority_mode_v1","applyServerUsageWhenReady","serverIsAuthority"])assert(s.includes(x),x+" missing");
console.log("Frontend authority bridge: ALL PASS");
