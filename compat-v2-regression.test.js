"use strict";
const assert=require("assert");
const S=require("./saju-engine-v2-patch.js");
const C=require("./compatibility-v2.js");

function chart(name,year,month,day,hour){
  return S.calculate({name,gender:"여",calendar:"양력",year,month,day,hour,minute:0,hourUnknown:false,dayBoundary:"23",trueSolarApply:false});
}
function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

const a=chart("A",1991,11,23,7);
const b=chart("B",2002,5,9,2);

ok("A→B/B→A 방향성",()=>{
  const x=C.directionality(a,b);
  assert(x.a_to_b.ten_god);
  assert(x.b_to_a.ten_god);
});

ok("싸움 번역기 생성",()=>{
  const x=C.fightTranslator(a,b);
  assert(Array.isArray(x.translation));
  assert.strictEqual(x.translation.length,2);
});

ok("build에 2세대 섹션 실제 포함",()=>{
  const x=C.build(a,b,78);
  assert.strictEqual(x.version,"2.0.0");
  assert(x.sections.some(s=>s.id==="fight"));
  assert(x.sections.some(s=>s.id==="direction"));
  assert(x.personModels.a && x.personModels.b);
});

ok("Pair Swap 방향은 서로 뒤집힌다",()=>{
  const ab=C.directionality(a,b), ba=C.directionality(b,a);
  assert.strictEqual(ab.a_to_b.ten_god,ba.b_to_a.ten_god);
  assert.strictEqual(ab.b_to_a.ten_god,ba.a_to_b.ten_god);
});

console.log("\nCompatibility v2 regression: ALL PASS");
