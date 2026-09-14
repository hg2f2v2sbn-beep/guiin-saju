"use strict";
const fs=require("fs"),assert=require("assert");
const h=fs.readFileSync("index.html","utf8");
const pos=x=>h.indexOf(`src="${x}"`);
assert(pos("expert-interpreter.js")>=0 && pos("expert-v2.js")>pos("expert-interpreter.js"));
assert(pos("compatibility-interpreter.js")>=0 && pos("compatibility-v2.js")>pos("compatibility-interpreter.js"));
assert(h.includes("saju-engine-v2-patch.js"));
assert(h.includes("flow-v2.js"));
console.log("Interpretation browser wiring: ALL PASS");
