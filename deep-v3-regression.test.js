"use strict";

/**
 * 귀인사주 Deep Interpretation V3 자동 QA
 *
 * 실제 saju-engine.js → expert-interpreter.js → compatibility-interpreter.js
 * → deep-interpretation-v3.js 순서로 연결하여 개인풀이/궁합을 생성한다.
 */

const assert=require("assert");
const fs=require("fs");

const S=require("./saju-engine.js");
const BaseExpert=require("./expert-interpreter.js");
const BaseCompat=require("./compatibility-interpreter.js");

global.GuiinSaju=S;
global.GuiinExpert=BaseExpert;
global.GuiinCompat=BaseCompat;
delete require.cache[require.resolve("./deep-interpretation-v3.js")];
require("./deep-interpretation-v3.js");

const E=global.GuiinExpert;
const C=global.GuiinCompat;

function ok(label,fn){
  try{fn();console.log("PASS",label);}
  catch(err){console.error("FAIL",label);throw err;}
}

function findChart(name,targetStem,year,month,gender,hour,hourUnknown=false){
  for(let day=1;day<=28;day++){
    const c=S.calculate({
      name,gender,calendar:"양력",
      year,month,day,hour,minute:(day*7)%60,
      hourUnknown,dayBoundary:"23",trueSolarApply:false
    });
    if(c?.pillars?.day?.stemIndex===targetStem)return c;
  }
  throw new Error(`target day stem ${targetStem} not found for ${year}-${month}`);
}

function allText(sections){
  return sections.map(x=>`${x.eyebrow||""}\n${x.title||""}\n${x.body||""}\n${x.evidence||""}`).join("\n");
}

function normalizeText(s){
  return String(s||"")
    .replace(/[가-힣A-Za-z]{1,12}님/g,"{이름}님")
    .replace(/\d+(?:\.\d+)?%/g,"{PCT}")
    .replace(/\d+\/100/g,"{SCORE}")
    .replace(/\d{4}년/g,"{YEAR}년")
    .replace(/[“”"'·,]/g,"")
    .replace(/\s+/g," ")
    .trim();
}

function shingles(s,n=5){
  const words=normalizeText(s).split(/\s+/).filter(Boolean);
  const set=new Set();
  for(let i=0;i<=words.length-n;i++)set.add(words.slice(i,i+n).join(" "));
  return set;
}

function jaccard(a,b){
  const A=shingles(a),B=shingles(b);
  let inter=0;
  for(const x of A)if(B.has(x))inter++;
  return inter/Math.max(1,A.size+B.size-inter);
}

const specs=[
  ["가람",0,1987,1,"여",0,false],
  ["나래",1,1990,2,"남",2,false],
  ["다온",2,1993,3,"여",6,false],
  ["라온",3,1996,4,"남",8,false],
  ["마루",4,1999,5,"여",10,false],
  ["바다",5,2002,6,"남",13,false],
  ["서린",6,2005,8,"여",15,false],
  ["아라",7,2008,9,"남",18,false],
  ["여울",8,2011,10,"여",21,true],
  ["하람",9,2014,12,"남",23,false]
];

const charts=specs.map(x=>findChart(...x));
const winterDing=findChart("동일A",3,1991,11,"여",7,false);
const summerDing=findChart("동일B",3,2002,5,"여",14,false);

ok("Deep V3 API가 실제로 덮어써져 있다",()=>{
  assert.strictEqual(typeof E.fullSections,"function");
  assert.strictEqual(typeof E.personModel,"function");
  assert.strictEqual(typeof C.build,"function");
  assert(/^deep-v3(?:-|$)/.test(E.personModel(charts[0]).version),`unexpected version: ${E.personModel(charts[0]).version}`);
});

const requiredPersonalTitles=[
  "핵심 진단",
  "구조를 뜯어보면",
  "일간 지지력 · 신강신약 참고",
  "조후 · 한난조습",
  "십성이 어디에 놓였는가",
  "이 명식의 핵심 패턴",
  "생활 장면으로 번역하면",
  "일과 돈",
  "연애와 가까운 관계",
  "이 사주의 핵심 과제"
];

const badPatterns=[
  /undefined/,
  /NaN/,
  /토이 강/,
  /화이 강/,
  /묘으로/,
  /겁재은/,
  /신뢰을/,
  /문제제기을/,
  /축와/,
  /화을/,
  /토을/,
  /수을/,
  /수은 서로/,
  /토은 서로/,
  /화은 서로/,
  /입니다\.을/,
  /습니다\.을/,
  /형로/
];

const personalOutputs=[];

ok("개인사주 10개가 필요한 심층 섹션을 모두 만든다",()=>{
  charts.forEach((c,i)=>{
    const sections=E.fullSections(c);
    assert(Array.isArray(sections));
    assert(sections.length>=16,`${c.input.name}: section count ${sections.length}`);
    const labels=new Set(sections.map(x=>x.eyebrow));
    requiredPersonalTitles.forEach(t=>assert(labels.has(t),`${c.input.name}: missing ${t}`));

    const text=allText(sections);
    badPatterns.forEach(re=>assert(!re.test(text),`${c.input.name}: bad text ${re}`));

    const model=E.personModel(c);
    assert(/^deep-v3(?:-|$)/.test(model.version),`${c.input.name}: unexpected version ${model.version}`);
    assert(model.structure?.strength,`${c.input.name}: strength missing`);
    assert(model.structure?.climate,`${c.input.name}: climate missing`);
    assert(model.structure?.ten_god_placement,`${c.input.name}: ten-god placement missing`);
    assert(Array.isArray(model.structure?.signatures),`${c.input.name}: signatures missing`);

    personalOutputs.push(text);
  });
});

ok("10개 개인풀이가 템플릿 복붙 수준으로 수렴하지 않는다",()=>{
  let max=0, pair="";
  for(let i=0;i<personalOutputs.length;i++){
    for(let j=i+1;j<personalOutputs.length;j++){
      const s=jaccard(personalOutputs[i],personalOutputs[j]);
      if(s>max){max=s;pair=`${charts[i].input.name}×${charts[j].input.name}`;}
    }
  }
  console.log(`INFO personal similarity max=${max.toFixed(3)} (${pair})`);
  assert(max<0.72,`personal similarity regression: ${max.toFixed(3)} >= 0.72`);
});

const pairIndexes=[
  [0,1],[2,3],[4,5],[6,7],[8,9],
  [0,9],[1,8],[2,7],[3,6]
];
const compatPairs=pairIndexes.map(([a,b])=>[charts[a],charts[b]]);
compatPairs.push([winterDing,summerDing]);

const compatOutputs=[];

ok("궁합 10쌍이 교차형 심층 섹션을 만든다",()=>{
  compatPairs.forEach(([a,b])=>{
    const result=C.build(a,b,80);
    assert(result?.meta);
    assert(/^deep-v3(?:-|$)/.test(result.meta.version),`compat version: ${result.meta.version}`);
    assert(Array.isArray(result.sections));
    assert(result.sections.length>=12,`${a.input.name}×${b.input.name}: section count ${result.sections.length}`);

    const ids=new Set(result.sections.map(x=>x.id));
    ["core","difference","why","bond","friction","communication","contact","repair","boundary","money","marriage","task"]
      .forEach(id=>assert(ids.has(id),`${a.input.name}×${b.input.name}: missing ${id}`));

    const text=allText(result.sections);
    badPatterns.forEach(re=>assert(!re.test(text),`${a.input.name}×${b.input.name}: bad text ${re}`));
    compatOutputs.push(text);
  });
});

ok("같은 일간/다른 일간 제목이 실제 명식에 맞게 갈린다",()=>{
  const same=C.build(winterDing,summerDing,80).sections.find(x=>x.id==="difference");
  assert(same && /같은 .* 일간/.test(same.title),`same-stem title wrong: ${same?.title}`);

  const different=C.build(charts[0],charts[1],80).sections.find(x=>x.id==="difference");
  assert(different && !different.title.startsWith("같은 "),`different-stem title wrong: ${different?.title}`);
});

ok("궁합 10쌍이 같은 문장으로 수렴하지 않는다",()=>{
  let max=0, pair="";
  for(let i=0;i<compatOutputs.length;i++){
    for(let j=i+1;j<compatOutputs.length;j++){
      const s=jaccard(compatOutputs[i],compatOutputs[j]);
      if(s>max){max=s;pair=`${i+1}×${j+1}`;}
    }
  }
  console.log(`INFO compatibility similarity max=${max.toFixed(3)} (${pair})`);
  assert(max<0.72,`compatibility similarity regression: ${max.toFixed(3)} >= 0.72`);
});

ok("index/demo가 V3만 로드하고 로그인 핵심 코드를 유지한다",()=>{
  for(const file of ["index.html","demo.html"]){
    const html=fs.readFileSync(file,"utf8");
    assert(/deep-interpretation-v3\.js\?v=[A-Za-z0-9._-]+/.test(html),`${file}: V3 script missing`);
    assert(!html.includes("deep-interpretation-v2.js"),`${file}: V2 script still loaded`);
    assert(html.includes("KAKAO OAUTH RETURN BRIDGE"),`${file}: Kakao auth bridge missing`);
    assert(html.includes("entry.style.display='none'"),`${file}: signed-in login-row hide missing`);
    assert(html.includes("GuiinExpert.personModel(chart)"),`${file}: AI personModel bridge missing`);
    assert(html.includes("requestId:requestMeta.id"),`${file}: AI idempotency request id missing`);
    assert(!html.includes("이 기기에서 알림 권한 확인하기"),`${file}: unfinished notification permission button restored`);
  }
});

console.log("\nDeep V3 Regression Gate: ALL PASS");
