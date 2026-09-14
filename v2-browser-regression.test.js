"use strict";
const fs=require("fs");
const assert=require("assert");
const html=fs.readFileSync("index.html","utf8");
function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}
ok("v2 scripts wired",()=>{const order=['saju-engine.js','saju-engine-v2-patch.js','guiin-engine-contract.js','flow-v2.js','expert-interpreter.js'].map(x=>html.indexOf(`src="${x}"`));order.forEach(x=>assert(x>=0));for(let i=1;i<order.length;i++)assert(order[i]>order[i-1])});
ok("runtime css wired",()=>assert(html.includes('href="guiin-runtime-v2.css"')));
ok("today/week/month use Flow v2",()=>{assert(html.includes('GUIIN_V2_FLOW_FORTUNE_START'));assert(html.includes('GuiinFlowV2.currentContext'));assert(html.includes('GuiinFlowV2.sevenDayContext'))});
ok("AI payload structured",()=>{assert(html.includes('GUIIN_V2_AI_PAYLOAD_START'));assert(html.includes('GuiinEngineContract.chartFacts(chart)'));assert(html.includes('current_wolun'));assert(html.includes('current_ilun'))});
ok("unknown time candidates shown",()=>{assert(html.includes('day_pillar_candidates'));assert(html.includes('daeun_start_age_range'))});
ok("browser back supported",()=>{assert(html.includes('guiinNavigateHistory(id);'));assert(html.includes("addEventListener('popstate'"))});
console.log("\nBrowser v2 regression: ALL PASS");
