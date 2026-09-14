"use strict";
const assert=require("assert");

// Minimal fixture for expert-v2 functions without needing browser UI.
const Base=require("./expert-v2.js");
const S=require("./saju-engine-v2-patch.js");

function chart(name,year=1991){
  return S.calculate({name,gender:"여",calendar:"양력",year,month:11,day:23,hour:7,minute:40,hourUnknown:false,dayBoundary:"23",trueSolarApply:false});
}
function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("Person Model 생성",()=>{
  const c=chart("A");
  const m=Base.personModel(c);
  assert.strictEqual(m.name,"A");
  assert(m.day_master);
  assert(m.strongest_element.element);
  assert(m.evidence);
});

ok("일주 천간을 별도 십성 역할로 쓰는 섹션 제거",()=>{
  const c=chart("A");
  const sections=Base.fullSections(c);
  assert(!sections.some(x=>String(x.eyebrow||"").includes("일주와 십성")));
  assert(sections.some(x=>String(x.eyebrow||"").includes("2세대 핵심 모델")));
});

ok("현재 Flow 섹션 포함",()=>{
  const c=chart("A");
  const f=Base.flowSections(c,2026);
  assert(f.sections.some(x=>String(x.eyebrow||"").includes("현재 운의 실제 층위")));
});

console.log("\nExpert v2 regression: ALL PASS");
