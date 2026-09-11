/**
 * 귀인사주 — 만세력 결과 표시 모듈
 * 기존 GuiinSaju.calculate() 결과만 시각화한다.
 */
(function(root, factory){
  if(typeof module === "object" && module.exports) module.exports = factory();
  else root.GuiinManse = factory();
})(typeof self !== "undefined" ? self : this, function(){
  "use strict";

  const ELS=["목","화","토","금","수"];
  const EL_CLASS={목:"wood",화:"fire",토:"earth",금:"metal",수:"water"};
  const STEM_NAME={갑:"갑목",을:"을목",병:"병화",정:"정화",무:"무토",기:"기토",경:"경금",신:"신금",임:"임수",계:"계수"};

  function esc(v){
    return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  }
  function pct(c){
    const total=Object.values((c&&c.elCount)||{}).reduce((s,n)=>s+(+n||0),0)||1;
    const out={}; ELS.forEach(e=>out[e]=Math.round((((c&&c.elCount)||{})[e]||0)/total*100)); return out;
  }
  function orderedElements(c){ return Object.entries(pct(c)).sort((a,b)=>b[1]-a[1]); }
  function ageNow(input, now){
    now=now||new Date();
    let age=now.getFullYear()-(+input.year||now.getFullYear());
    const m=now.getMonth()+1,d=now.getDate();
    if(m < +input.month || (m===+input.month && d < +input.day)) age--;
    return Math.max(0,age);
  }
  function currentLuck(c, now){
    const age=ageNow(c.input,now), rows=c.luck||[];
    return rows.find(x=>age>=x.fromAgeExact && age<x.toAgeExact) ||
           rows.find(x=>age>=x.fromAge && age<=x.toAge) || null;
  }
  function birthLine(c){
    const i=c.input||{};
    const time=i.hourUnknown ? "시간 모름" : `${String(i.hour??0).padStart(2,"0")}:${String(i.minute??0).padStart(2,"0")}`;
    return `${i.year}.${String(i.month).padStart(2,"0")}.${String(i.day).padStart(2,"0")} ${time} · ${i.calendar||"양력"} · ${i.gender||""}`;
  }
  function hiddenText(p){
    if(!p || !Array.isArray(p.hidden) || !p.hidden.length) return "-";
    return p.hidden.map(x=>`${x.stemH}${x.stem}·${x.god}`).join(" ");
  }
  function stage(c,key){ return (c.twelveStages||{})[key]||"-"; }

  function keyFacts(c){
    const ord=orderedElements(c), lk=currentLuck(c);
    return [
      ["일간",`${c.dayMaster.hanja} ${STEM_NAME[c.dayMaster.stem]||c.dayMaster.stem}`],
      ["일주",c.pillars.day.ko],
      ["월령",`${c.pillars.month.branch}월 · ${c.pillars.month.branchH}`],
      ["현재 대운",lk?`${lk.ko} · ${lk.god}`:"확인 필요"],
      ["신살·귀인",`${(c.stars&&c.stars.total)||0}개`],
      ["오행 포인트",`${ord[0][0]} ${ord[0][1]}% · ${ord[ord.length-1][0]} ${ord[ord.length-1][1]}%`]
    ];
  }

  function elementBars(c){
    const p=pct(c);
    return `<div class="manseElements">${ELS.map(e=>`
      <div class="manseEl">
        <div class="manseElTop"><b>${e}</b><span>${p[e]}%</span></div>
        <div class="manseElBar"><i class="${EL_CLASS[e]}" style="width:${p[e]}%"></i></div>
      </div>`).join("")}</div>`;
  }

  function table(c){
    const cols=[
      ["year","년주",c.pillars.year],
      ["month","월주",c.pillars.month],
      ["day","일주",c.pillars.day],
      ["hour","시주",c.pillars.hour]
    ];
    return `<div class="manseTableWrap">
      <div class="manseTable" role="table" aria-label="${esc((c.input.name||"사용자")+"님의 사주 원국")}">
        <div class="manseRow manseHead" role="row">
          <div class="manseLabel" role="columnheader">구분</div>
          ${cols.map(([k,label,p])=>`<div class="manseCell ${k==="day"?"dayCol":""}" role="columnheader">
            <b>${label}</b><small>${p?esc(p.ko):"-"}</small>
          </div>`).join("")}
        </div>
        <div class="manseRow" role="row">
          <div class="manseLabel" role="rowheader">천간</div>
          ${cols.map(([k,label,p])=>p?`<div class="manseCell ${k==="day"?"dayCol":""}">
            <strong class="bigChar ${EL_CLASS[p.stemEl]||""}">${esc(p.stemH)}</strong>
            <span>${esc(p.stem)} · ${esc(p.stemEl)}</span>
            <small>${esc(p.god||"-")}</small>
          </div>`:`<div class="manseCell empty">-</div>`).join("")}
        </div>
        <div class="manseRow" role="row">
          <div class="manseLabel" role="rowheader">지지</div>
          ${cols.map(([k,label,p])=>p?`<div class="manseCell ${k==="day"?"dayCol":""}">
            <strong class="bigChar ${EL_CLASS[p.branchEl]||""}">${esc(p.branchH)}</strong>
            <span>${esc(p.branch)} · ${esc(p.branchEl)}</span>
            <small>${esc(p.animal||"")}</small>
          </div>`:`<div class="manseCell empty">-</div>`).join("")}
        </div>
        <div class="manseRow slim" role="row">
          <div class="manseLabel" role="rowheader">12운성</div>
          ${cols.map(([k])=>`<div class="manseCell ${k==="day"?"dayCol":""}"><b>${esc(stage(c,k))}</b></div>`).join("")}
        </div>
        <div class="manseRow hiddenStemRow" role="row">
          <div class="manseLabel" role="rowheader">지장간</div>
          ${cols.map(([k,label,p])=>`<div class="manseCell ${k==="day"?"dayCol":""}"><small>${esc(hiddenText(p))}</small></div>`).join("")}
        </div>
      </div>
    </div>`;
  }

  function summarySentence(c){
    const ord=orderedElements(c), top=ord[0], low=ord[ord.length-1], lk=currentLuck(c);
    return `${esc(c.input.name||"사용자")}님의 기준점은 <b>${esc(c.dayMaster.hanja)} ${esc(STEM_NAME[c.dayMaster.stem]||c.dayMaster.stem)}</b>입니다. `+
      `월령은 <b>${esc(c.pillars.month.branch)}월</b>, 오행에서는 <b>${top[0]} ${top[1]}%</b>가 가장 크게 드러나고 <b>${low[0]} ${low[1]}%</b>가 상대적으로 작습니다. `+
      `${lk?`현재는 <b>${esc(lk.ko)} 대운(${esc(lk.god)})</b> 구간으로 계산됩니다. `:""}`+
      `아래 해석은 이 표의 일간·월령·오행·십신·지장간·관계·대운을 연결해서 읽습니다.`;
  }

  function render(c, opts){
    opts=opts||{};
    const title=opts.title||`${c.input.name||"사용자"}님의 만세력`;
    return `<section class="manseSnapshot">
      <div class="manseProfile card">
        <div class="manseProfileTop">
          <div>
            <div class="manseEyebrow">${esc(opts.eyebrow||"내 사주 원국")}</div>
            <h2>${esc(title)}</h2>
            <p>${esc(birthLine(c))}</p>
          </div>
          <div class="dayMasterBadge">
            <small>나를 나타내는 일간</small>
            <strong>${esc(c.dayMaster.hanja)}</strong>
            <span>${esc(STEM_NAME[c.dayMaster.stem]||c.dayMaster.stem)}</span>
          </div>
        </div>
        <div class="manseFacts">${keyFacts(c).map(([k,v])=>`<div class="manseFact"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</div>
      </div>
      <div class="manseChartCard card">
        <div class="manseSectionHead"><div><span>사주팔자</span><h3>네 기둥을 먼저 확인해요</h3></div><small>일주가 ‘나’의 중심입니다.</small></div>
        ${table(c)}
        ${elementBars(c)}
        <div class="manseReadGuide">${summarySentence(c)}</div>
      </div>
    </section>`;
  }

  function renderCompact(c, label){
    const ord=orderedElements(c), lk=currentLuck(c);
    return `<div class="pairManse card">
      <div class="pairManseHead"><div><span>${esc(label||"명식")}</span><h3>${esc(c.input.name||"사용자")}님의 만세력</h3></div>
      <b>${esc(c.dayMaster.hanja)} ${esc(STEM_NAME[c.dayMaster.stem]||c.dayMaster.stem)}</b></div>
      <p class="pairBirth">${esc(birthLine(c))}</p>
      ${table(c)}
      <div class="pairFacts">
        <span>월령 <b>${esc(c.pillars.month.branch)}월</b></span>
        <span>강한 오행 <b>${ord[0][0]} ${ord[0][1]}%</b></span>
        <span>현재 대운 <b>${lk?esc(lk.ko):"-"}</b></span>
        <span>신살·귀인 <b>${(c.stars&&c.stars.total)||0}개</b></span>
      </div>
    </div>`;
  }

  function renderPair(a,b){
    return `<section class="compatManseBlock">
      <div class="compatManseIntro card">
        <span>두 사람 원국 비교</span>
        <h2>궁합 설명 전에 각자의 사주부터 봅니다.</h2>
        <p>궁합은 점수부터 정하는 것이 아니라, 두 사람의 일간·월령·오행·십신과 원국 관계를 각각 확인한 뒤 서로 겹쳐 읽습니다.</p>
      </div>
      ${renderCompact(a,"나")}
      ${renderCompact(b,"상대방")}
    </section>`;
  }

  return {esc,pct,currentLuck,keyFacts,table,elementBars,render,renderCompact,renderPair};
});
