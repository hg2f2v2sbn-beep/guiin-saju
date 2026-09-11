/**
 * 귀인사주 — 대운·세운·월운 타임라인
 * 계산 우선순위: 원국 -> 대운 -> 세운 -> 월운
 * 사건 확률/길흉 점수로 환산하지 않는다.
 */
(function(root,factory){
  if(typeof module==="object" && module.exports) module.exports=factory(require("./saju-engine.js"));
  else root.GuiinFlow=factory(root.GuiinSaju);
})(typeof self!=="undefined"?self:this,function(S){
  "use strict";
  if(!S) throw new Error("GuiinSaju engine is required");

  const GOD_GUIDE={
    "비견":{
      core:"내 방식·자기주도·동료",
      work:"직접 결정하고 내 이름으로 책임지는 일이 늘기 쉽습니다.",
      money:"수입 자체보다 ‘내가 선택하는 지출’이 커지기 쉬워 기준을 정해두는 편이 좋습니다.",
      relation:"가까운 사람과도 각자의 영역을 존중할수록 편합니다.",
      action:"내가 통제할 것과 타인에게 맡길 것을 구분하세요."
    },
    "겁재":{
      core:"경쟁·속도·관계 재배치",
      work:"사람과 역할이 빠르게 바뀌거나 경쟁 속에서 결정을 내려야 하는 장면이 늘 수 있습니다.",
      money:"함께 쓰는 돈, 급한 지출, 비교 소비를 특히 분리해서 관리하는 편이 좋습니다.",
      relation:"가까운 사이일수록 비교와 주도권 싸움이 생기지 않게 말의 속도를 늦추는 것이 중요합니다.",
      action:"빠른 선택보다 손익·역할·경계를 문서나 메모로 남기세요."
    },
    "식신":{
      core:"생산·생활·꾸준함",
      work:"기술·서비스·콘텐츠처럼 반복해서 결과물을 만드는 일이 힘을 받기 쉽습니다.",
      money:"큰 한 방보다 꾸준히 쌓이는 수익 구조와 생활 안정에 초점을 두기 좋습니다.",
      relation:"편안함과 돌봄이 관계의 장점이 되지만, 불편한 말을 미루지는 않는 편이 좋습니다.",
      action:"작게라도 반복 가능한 루틴을 만드는 것이 가장 유리합니다."
    },
    "상관":{
      core:"표현·변화·문제제기",
      work:"기존 방식의 문제를 발견하고 고치거나 새로운 방식으로 표현하는 일이 두드러질 수 있습니다.",
      money:"아이디어 지출이나 새 시도가 늘 수 있어 실험 비용의 상한을 정하는 편이 좋습니다.",
      relation:"솔직함이 장점이지만 표현이 날카로워지면 불필요한 갈등이 커질 수 있습니다.",
      action:"말하기 전에 목적을 한 문장으로 정리하면 강점을 살리기 쉽습니다."
    },
    "편재":{
      core:"기회·현장·외부활동",
      work:"사람을 만나고 움직이며 기회를 잡는 장면에서 성과 체감이 커질 수 있습니다.",
      money:"돈의 흐름이 커질 수 있지만 들어오는 속도와 나가는 속도를 같이 봐야 합니다.",
      relation:"사교성과 활동성이 관계에 활기를 주지만 약속이 자주 바뀌면 신뢰가 떨어질 수 있습니다.",
      action:"기회가 많을수록 우선순위 세 개만 남기세요."
    },
    "정재":{
      core:"관리·안정·현실",
      work:"정리, 운영, 계약, 일정, 비용처럼 현실적인 관리 능력이 중요해지기 쉽습니다.",
      money:"수입·저축·고정비를 구조화하기 좋은 시기로 읽습니다.",
      relation:"신뢰와 책임감을 중요하게 느끼기 쉬우며 관계도 현실 계획과 함께 보게 됩니다.",
      action:"눈에 보이는 숫자와 일정으로 계획을 만들면 흐름을 쓰기 좋습니다."
    },
    "편관":{
      core:"압력·결단·도전",
      work:"책임이 커지거나 빠른 판단을 요구받는 일이 생기기 쉬워 집중력이 중요합니다.",
      money:"위험을 감수하는 결정은 ‘최악의 경우 감당 가능한가’를 먼저 확인하는 편이 좋습니다.",
      relation:"강한 끌림과 긴장감이 함께 나타날 수 있어 통제와 배려의 경계를 분명히 하는 게 좋습니다.",
      action:"무리해서 버티기보다 책임의 범위를 명확히 정하세요."
    },
    "정관":{
      core:"책임·신뢰·제도",
      work:"직책, 규칙, 계약, 평가처럼 공식적인 책임이 커지는 흐름으로 읽기 쉽습니다.",
      money:"안정적인 계획과 장기적인 의무를 챙기는 데 적합한 흐름입니다.",
      relation:"관계를 진지하게 정의하거나 약속과 기준을 맞추는 일이 중요해질 수 있습니다.",
      action:"해야 할 일과 하지 않을 일을 같은 비중으로 정하세요."
    },
    "편인":{
      core:"탐구·전환·비정형",
      work:"한 가지 방식에 묶이기보다 새로운 기술이나 정보, 다른 관점을 배우는 장면이 늘 수 있습니다.",
      money:"확신이 생기기 전까지 큰 비용보다 작은 검증을 반복하는 방식이 안전합니다.",
      relation:"혼자 생각하는 시간이 필요해질 수 있어 침묵을 거절로 오해하지 않게 설명하는 편이 좋습니다.",
      action:"생각만 쌓이지 않게 작은 테스트 결과를 남기세요."
    },
    "정인":{
      core:"배움·지원·기반",
      work:"자격, 교육, 문서, 조력자, 기존 기반을 활용하는 일이 중요해지기 쉽습니다.",
      money:"확장보다 기반을 지키고 필요한 지원을 받는 방식이 유리할 수 있습니다.",
      relation:"이해받고 보호받고 싶은 마음이 커질 수 있어 도움을 주고받는 균형이 중요합니다.",
      action:"혼자 해결하지 말고 전문가·자료·제도를 적극 활용하세요."
    }
  };

  const REL_GUIDE={
    "천간합":"생각·역할을 조정해 한쪽 방향으로 묶이는 신호",
    "육합":"생활 속 협력과 연결이 쉽게 만들어지는 신호",
    "삼합":"여러 요소가 한 방향으로 모이며 기운이 커지는 신호",
    "충":"움직임·교체·방향 전환이 커지는 신호",
    "형":"같은 문제가 반복되며 조정이 필요한 신호",
    "파":"기존 방식이 끊기거나 다시 짜이는 신호",
    "해":"겉보다 안쪽에서 오해·불편이 생기기 쉬운 신호"
  };
  const REL_ORDER=["천간합","육합","삼합","충","형","파","해"];

  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function uniq(arr){return [...new Set(arr)];}
  function startOfYearAge(c,year){ return year-(+c.input.year||year); }

  function activeLuck(c,year){
    const age=startOfYearAge(c,year);
    return (c.luck||[]).find(x=>age>=x.fromAgeExact && age<x.toAgeExact) ||
           (c.luck||[]).find(x=>age>=x.fromAge && age<=x.toAge) || null;
  }
  function relationTypes(c,transit){
    const rel=S.relationsWithTransit(c.pillars,transit)||[];
    return {rows:rel,types:REL_ORDER.filter(t=>rel.some(r=>r.type===t))};
  }
  function guide(god){
    return GOD_GUIDE[god]||{
      core:"환경 변화",work:"환경의 요구를 확인하며 역할을 조정하는 시기입니다.",
      money:"고정비와 현금흐름을 먼저 확인하세요.",relation:"기대치를 말로 확인하는 편이 좋습니다.",
      action:"큰 결론보다 반복되는 신호를 기록하세요."
    };
  }
  function yearData(c,year){
    const f=S.flowForDate(year,9,10,c.pillars.day.stemIndex,12,0,{dayBoundary:c.input.dayBoundary||"23"});
    const yp=f.pillars.year, god=f.gods.year, lk=activeLuck(c,year), rel=relationTypes(c,yp), g=guide(god);
    return {
      year,pillar:yp.ko,hanja:yp.hanja,god,stage:f.stages.year,luck:lk,
      relations:rel.rows,relationTypes:rel.types,guide:g
    };
  }
  function monthData(c,year,month){
    const f=S.flowForDate(year,month,15,c.pillars.day.stemIndex,12,0,{dayBoundary:c.input.dayBoundary||"23"});
    const mp=f.pillars.month,god=f.gods.month,rel=relationTypes(c,mp),g=guide(god);
    return {
      year,month,pillar:mp.ko,hanja:mp.hanja,god,stage:f.stages.month,
      relations:rel.rows,relationTypes:rel.types,guide:g
    };
  }
  function yearRange(c,startYear,count){
    return Array.from({length:count||12},(_,i)=>yearData(c,startYear+i));
  }
  function monthRange(c,year){
    return Array.from({length:12},(_,i)=>monthData(c,year,i+1));
  }

  function relationTagHTML(types){
    if(!types.length) return `<span class="flowTag neutral">큰 관계 신호 없음</span>`;
    return types.map(t=>`<span class="flowTag ${["충","형","파","해"].includes(t)?"motion":"link"}">${esc(t)}</span>`).join("");
  }

  function renderCurrent(c,startYear){
    const now=new Date(), y=startYear||now.getFullYear(), yd=yearData(c,y), lk=yd.luck, g=yd.guide;
    const luckRel=lk?relationTypes(c,lk):{rows:[],types:[]};
    return `<div class="flowNow card">
      <div class="flowEyebrow">지금의 큰 흐름</div>
      <h2>${esc(c.input.name||"사용자")}님의 ${y}년은 <b>${esc(lk?lk.ko:"-")} 대운</b> 위에 <b>${esc(yd.pillar)} 세운</b>이 겹칩니다.</h2>
      <p>대운은 약 10년의 배경, 세운은 1년의 강조점입니다. 세운 하나로 사건을 정하지 않고 원국과 현재 대운에 어떤 방식으로 겹치는지를 먼저 봅니다.</p>
      <div class="flowNowGrid">
        <div><span>현재 대운</span><strong>${esc(lk?lk.ko:"-")}</strong><small>${esc(lk?lk.god:"-")} · ${lk?`${lk.fromAge}~${lk.toAge}세`:"-"}</small></div>
        <div><span>${y} 세운</span><strong>${esc(yd.pillar)}</strong><small>${esc(yd.god)} · 12운성 ${esc(yd.stage)}</small></div>
      </div>
      <div class="flowSignals">
        <b>원국과 대운의 관계</b><div>${relationTagHTML(luckRel.types)}</div>
        <b>원국과 ${y} 세운의 관계</b><div>${relationTagHTML(yd.relationTypes)}</div>
      </div>
      <div class="flowGuide">
        <div><span>일·역할</span><p>${esc(g.work)}</p></div>
        <div><span>돈·현실</span><p>${esc(g.money)}</p></div>
        <div><span>관계</span><p>${esc(g.relation)}</p></div>
        <div><span>이번 흐름 활용법</span><p>${esc(g.action)}</p></div>
      </div>
      <div class="flowEvidence">왜 이렇게 읽었나요? · 일간 ${esc(c.dayMaster.stem)} 기준 ${y} 세운 천간은 ${esc(yd.god)}, 세운은 ${esc(yd.pillar)}, 현재 대운은 ${esc(lk?lk.ko:"-")}(${esc(lk?lk.god:"-")})이며 원국과의 관계 신호는 ${esc(yd.relationTypes.join("·")||"직접 관계 없음")}입니다.</div>
    </div>`;
  }

  function renderDaewoon(c,startYear){
    const current=activeLuck(c,startYear||new Date().getFullYear());
    return `<section class="flowSection">
      <div class="flowSectionHead"><span>100년 대운 지도</span><h2>10년마다 삶의 배경이 어떻게 바뀌는지</h2><p>대운은 사건 목록이 아니라 오랫동안 반복되는 역할과 환경의 주제를 보는 틀입니다.</p></div>
      <div class="daeunMap">${(c.luck||[]).map((x,i)=>{
        const sy=(+c.input.year)+Math.floor(x.fromAgeExact), ey=(+c.input.year)+Math.floor(x.toAgeExact);
        const rel=relationTypes(c,x), g=guide(x.god), on=!!(current&&current.ko===x.ko&&current.fromAge===x.fromAge);
        return `<article class="daeunBlock card ${on?"current":""}">
          <div class="daeunTop"><div><span>${i+1}번째 대운 ${on?"· 현재":""}</span><h3>${esc(x.ko)} 대운 · ${esc(x.god)}</h3></div><b>${x.fromAge}~${x.toAge}세</b></div>
          <div class="daeunYears">약 ${sy}~${ey}년 · 시작 ${Number(x.fromAgeExact).toFixed(1)}세</div>
          <p><b>${esc(g.core)}</b>가 이 10년의 큰 주제가 되기 쉽습니다. ${esc(g.work)} ${esc(g.action)}</p>
          <div class="daeunRel">${relationTagHTML(rel.types)}</div>
          <div class="flowEvidence">계산 근거 · 대운 ${esc(x.ko)} / 일간 기준 십신 ${esc(x.god)} / 원국 관계 ${esc(rel.types.join("·")||"직접 관계 없음")}</div>
        </article>`;
      }).join("")}</div>
    </section>`;
  }

  function renderYearTimeline(c,startYear,count){
    const rows=yearRange(c,startYear,count||12), nowY=new Date().getFullYear();
    return `<section class="flowSection">
      <div class="flowSectionHead"><span>${startYear}~${startYear+(count||12)-1}</span><h2>12년 인생 타임라인</h2><p>각 해의 세운 십신과 원국 관계, 당시 대운을 한 줄에 겹쳐 봅니다. 좋은 해/나쁜 해 점수로 환산하지 않습니다.</p></div>
      <div class="yearTimeline">${rows.map(r=>{
        const lk=r.luck, g=r.guide;
        return `<article class="yearCard card ${r.year===nowY?"current":""}">
          <div class="yearCardTop"><div><span>${r.year===nowY?"현재 · ":""}${r.year}년</span><h3>${esc(r.pillar)} · ${esc(r.god)}</h3></div><b>${esc(r.stage)}</b></div>
          <div class="yearLuck">대운 ${esc(lk?lk.ko:"-")} · ${esc(lk?lk.god:"-")}</div>
          <div class="yearRel">${relationTagHTML(r.relationTypes)}</div>
          <p>${esc(g.core)}가 1년의 강조점으로 들어옵니다. ${esc(g.work)} ${esc(g.relation)}</p>
          <div class="flowEvidence">${esc(r.year)}년 계산 근거 · 세운 ${esc(r.pillar)} / 십신 ${esc(r.god)} / 12운성 ${esc(r.stage)} / 관계 ${esc(r.relationTypes.join("·")||"직접 관계 없음")}</div>
        </article>`;
      }).join("")}</div>
    </section>`;
  }

  function renderMonths(c,year){
    const rows=monthRange(c,year), now=new Date(), currentMonth=now.getFullYear()===year?now.getMonth()+1:null;
    return `<section class="flowSection">
      <div class="flowSectionHead"><span>${year} 월운</span><h2>한 해 안에서도 달마다 강조점이 달라집니다.</h2><p>월운은 세운보다 짧은 층입니다. 대운·세운의 큰 방향을 바꾸는 것이 아니라 어느 달에 어떤 주제가 더 잘 보이는지를 참고합니다.</p></div>
      <div class="monthGrid">${rows.map(r=>`
        <article class="monthCard ${r.month===currentMonth?"current":""}">
          <div class="monthTop"><b>${r.month}월</b><span>${esc(r.pillar)}</span></div>
          <strong>${esc(r.god)}</strong><small>12운성 ${esc(r.stage)}</small>
          <div class="monthTags">${relationTagHTML(r.relationTypes)}</div>
          <p>${esc(r.guide.core)} · ${esc(r.guide.action)}</p>
        </article>`).join("")}</div>
    </section>`;
  }

  function renderRelationLegend(){
    return `<div class="flowLegend card"><h3>합충형파해는 이렇게 읽습니다.</h3>
      ${REL_ORDER.map(k=>`<div><b>${esc(k)}</b><span>${esc(REL_GUIDE[k])}</span></div>`).join("")}
      <p>합=무조건 좋음, 충=무조건 나쁨이 아닙니다. 실제 생활에서는 이동·직장 변화·관계 재조정·새 역할처럼 여러 방식으로 나타날 수 있습니다.</p>
    </div>`;
  }

  function render(c,opts){
    opts=opts||{};
    const start=opts.startYear||new Date().getFullYear();
    return `<section class="flowDeep">
      ${renderCurrent(c,start)}
      ${renderDaewoon(c,start)}
      ${renderYearTimeline(c,start,12)}
      ${renderMonths(c,start)}
      ${renderRelationLegend()}
      <div class="flowDisclaimer card"><b>해석 순서</b><p>원국 → 대운 → 세운 → 월운 순서로 봅니다. 한 달이나 한 해의 글자 하나만으로 취업·이별·결혼·수입·사고 같은 사건을 확정하지 않습니다.</p></div>
    </section>`;
  }

  return {render,activeLuck,yearData,monthData,yearRange,monthRange,relationTypes,GOD_GUIDE};
});
