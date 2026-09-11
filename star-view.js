/**
 * 귀인사주 — 신살·귀인 상세 표시 모듈
 * - 50종 전체 카탈로그를 공개
 * - 현재 엔진이 실제 계산하는 38종과 유파차이로 자동판정하지 않는 12종을 명확히 구분
 * - 원국 내 성립 위치/기준/중복 개수를 표시
 * - 향후 5년은 현재 엔진과 동일한 채택표로 "세운 글자와 기준표가 다시 만나는 해"만 참고 표시
 * 신살은 원국·오행·십신·대운보다 낮은 우선순위의 보조 해석이다.
 */
(function(root, factory){
  if(typeof module === "object" && module.exports){
    module.exports = factory(require("./saju-engine.js"));
  } else {
    root.GuiinStars = factory(root.GuiinSaju);
  }
})(typeof self !== "undefined" ? self : this, function(S){
  "use strict";
  if(!S) throw new Error("GuiinSaju engine is required");

  const PILLAR_LABEL={year:"년주",month:"월주",day:"일주",hour:"시주"};
  const POSITION_MEANING={
    year:"년주는 초년의 환경, 가족·사회에서 처음 드러나는 이미지와 연결해 참고합니다.",
    month:"월주는 성장 환경과 사회생활·직업 장면에서 어떻게 나타나는지 참고합니다.",
    day:"일주는 나 자신과 아주 가까운 관계에서 체감되는 방식에 더 무게를 두고 봅니다.",
    hour:"시주는 장기 계획·후반의 관심사·내면에서 어떻게 쓰이는지 보조적으로 참고합니다."
  };
  const GROUP_ORDER=["귀인·길신","12신살","매력·관계","강한 기운","특수","지지 관계"];

  const FEATURE_META={
    "천을귀인":{title:"사람과 해결책이 연결되는 귀인",life:"혼자 버티기보다 필요한 순간 사람·정보·제도에 연결될 때 풀리는 힘으로 읽습니다."},
    "천덕귀인":{title:"관계의 완충과 도움을 보는 길신",life:"갈등을 완전히 없앤다기보다, 어려운 상황에서 조정 여지와 도움의 통로를 찾는 상징으로 봅니다."},
    "월덕귀인":{title:"배려와 관계의 완충을 보는 길신",life:"관계 속에서 한 번 더 조정하고 받아들이는 힘이 생기는지 살펴보는 보조 상징입니다."},
    "문창귀인":{title:"배움·글·말·정리의 재능",life:"알게 된 것을 설명하고 기록하고 구조화할 때 장점이 드러나는 별로 참고합니다."},
    "태극귀인":{title:"탐구와 이해의 깊이를 보는 귀인",life:"복잡한 것을 오래 들여다보고 자기 방식으로 이해하려는 성향과 연결해 읽습니다."},
    "천의성":{title:"돌봄과 회복 관심을 보는 상징",life:"사람을 보살피거나 회복을 돕는 일에 관심이 가는지 보는 참고 항목이며 의료 적성을 확정하지 않습니다."},
    "학당귀인":{title:"배움·자격·전문성의 축적",life:"공부나 기술을 반복해서 쌓고 다른 사람에게 전달하는 장면과 연결해 볼 수 있습니다."},
    "암록":{title:"드러나지 않은 기반과 연결",life:"겉으로 화려하지 않아도 생활의 기반·조력·관계망이 조용히 받쳐주는지 참고하는 상징입니다."},
    "건록":{title:"자기 힘으로 서려는 힘",life:"자기 몫을 직접 만들고 유지하려는 독립성과 생활력을 보는 보조 상징입니다."},
    "도화살":{title:"호감·표현·사람의 시선을 끄는 힘",life:"사람을 만나는 일, 서비스·영업·콘텐츠·표현 장면에서 매력과 존재감으로 쓰기 좋습니다."},
    "홍염살":{title:"개성 있는 매력과 감정 표현",life:"대중적인 인기보다 가까운 관계에서 취향과 감정 표현이 또렷하게 느껴지는 방향으로 참고합니다."},
    "역마살":{title:"이동과 변화에 반응하는 힘",life:"환경 변화, 이동, 새로운 일과 사람을 만날 때 활력이 살아나는지 보는 상징입니다."},
    "화개살":{title:"몰입·감성·혼자 깊어지는 힘",life:"예술·연구·전문기술·취향처럼 한 분야를 깊게 파는 힘과 연결해서 읽습니다."},
    "양인살":{title:"밀어붙이는 힘과 결단",life:"필요한 순간 단호하게 행동하는 추진력으로 쓸 수 있지만 과하면 주변과 속도 차이가 커질 수 있습니다."},
    "괴강살":{title:"기준이 강하고 쉽게 꺾이지 않는 힘",life:"책임을 잡고 버티는 힘으로 쓰일 수 있으나, 내 기준만 정답이 되면 관계 피로가 커질 수 있습니다."},
    "백호살":{title:"강한 압력과 집중을 보는 전통 표식",life:"위기 대응·집중력 같은 방식으로 읽되 사고·질병을 예언하는 용도로 사용하지 않습니다."},
    "현침살":{title:"날카로운 관찰과 표현의 상징",life:"세밀함과 날카로운 판단이 장점이 될 수 있고, 말이 직선적으로 나갈 때는 완충이 필요할 수 있습니다."},
    "공망":{title:"체감 방식이 다를 수 있는 빈자리의 상징",life:"없어진다거나 실패한다는 뜻이 아니라, 해당 영역을 일반적인 방식과 다르게 느끼거나 채울 수 있다는 참고값입니다."},
    "귀문관살":{title:"민감한 감각과 복잡한 생각의 상징",life:"직관과 예민함이 깊은 관찰로 이어질 수 있지만 피곤할 때 생각이 과해지는지 함께 살펴봅니다."},
    "원진살":{title:"가까울수록 생길 수 있는 미묘한 엇갈림",life:"좋고 싫음이 동시에 강해지는 관계 패턴을 참고하되 특정 관계의 이별을 단정하지 않습니다."},
    "고신살":{title:"혼자 감당하려는 경향을 보는 상징",life:"독립성이 장점이 될 수 있으나 도움을 받을 때도 혼자 해결하려는 습관이 있는지 참고합니다."},
    "과숙살":{title:"관계에서 혼자 있는 시간이 필요한 경향",life:"고독 운명을 뜻하는 것이 아니라, 관계 속에서도 개인 공간과 회복 시간이 중요한지 보는 보조 상징입니다."},
    "삼기":{title:"천간 세 글자의 특별 조합",life:"특정 천간 조합이 원국에서 함께 성립하는지 확인하는 전통 표식이며 성공을 보장하지 않습니다."},
    "천라지망":{title:"원국의 특정 지지 조합",life:"복잡하게 얽힌 체감이나 책임감을 설명할 때 참고하지만 사건을 예언하는 방식으로 쓰지 않습니다."},
    "형살":{title:"반복 자극과 긴장을 보는 지지 관계",life:"같은 문제가 반복되거나 서로 다른 방식이 계속 부딪히는 지점을 점검하는 관계 신호입니다."},
    "충살":{title:"정면 변화와 충돌을 보는 지지 관계",life:"움직임과 변화가 커지는 관계 신호이며 무조건 나쁜 사건으로 해석하지 않습니다."},
    "파살":{title:"리듬이 끊기거나 재조정되는 관계",life:"기대와 실제가 어긋날 때 다시 맞추는 과정이 필요한지 보는 보조 관계입니다."},
    "해살":{title:"미세한 오해와 불편을 보는 관계",life:"겉으로 큰 충돌이 없어도 해석 차이가 쌓이는지 살펴보는 관계 신호입니다."},
    "삼합":{title:"세 지지가 한 흐름으로 모이는 조합",life:"원국의 여러 글자가 한 방향의 기운을 강화하는지 확인하는 전통 지지 관계입니다."}
  };

  const UNSUPPORTED_REASON={
    "복성귀인":"통용되는 기준표가 여러 형태로 전해져 현재 엔진에서는 한 유파를 임의 채택하지 않습니다.",
    "금여성":"일간·일주 등을 기준으로 하는 서로 다른 표가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "관귀학관":"명칭과 성립표의 전승 차이가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "천문성":"월지·일지 등 기준이 갈리는 표가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "협록":"록의 확장 해석 방식에 유파 차이가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "문곡귀인":"문창과 별도로 보는 기준표가 유파마다 달라 현재 엔진에서는 자동 판정하지 않습니다.",
    "고란살":"특정 일주 목록의 범위가 유파마다 달라 현재 엔진에서는 자동 판정하지 않습니다.",
    "탕화살":"성립표와 적용 범위가 유파마다 달라 현재 엔진에서는 자동 판정하지 않습니다.",
    "낙정관살":"전승되는 기준표가 통일되지 않아 현재 엔진에서는 자동 판정하지 않습니다.",
    "월공":"월지·월간 등을 이용하는 기준 차이가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "상문살":"세운·상장례 해석까지 섞이는 유파 차이가 커 원국 자동 판정에서 제외합니다.",
    "조객살":"세운·상장례 해석까지 섞이는 유파 차이가 커 원국 자동 판정에서 제외합니다."
  };

  // Engine과 동일한 채택표. 향후 5년의 세운 천간/지지가 이 표와 일치하는지만 참고 표시한다.
  const PEACH={8:9,0:9,4:9,2:3,6:3,10:3,5:6,9:6,1:6,11:0,3:0,7:0};
  const HORSE={8:2,0:2,4:2,2:8,6:8,10:8,5:11,9:11,1:11,11:5,3:5,7:5};
  const CANOPY={8:4,0:4,4:4,2:10,6:10,10:10,5:1,9:1,1:1,11:7,3:7,7:7};
  const NOBLE={0:[1,7],4:[1,7],6:[1,7],1:[0,8],5:[0,8],2:[11,9],3:[11,9],7:[2,6],8:[3,5],9:[3,5]};
  const LITERARY={0:5,1:6,2:8,3:9,4:8,5:9,6:11,7:0,8:2,9:3};
  const TAIJI={0:[0,6],1:[0,6],2:[3,9],3:[3,9],4:[4,10,1,7],5:[4,10,1,7],6:[2,11],7:[2,11],8:[5,8],9:[5,8]};
  const HONGYEOM={0:6,1:8,2:2,3:6,4:4,5:4,6:10,7:9,8:0,9:8};
  const BLADE={0:3,1:2,2:6,3:5,4:6,5:5,6:9,7:8,8:0,9:11};
  const GEONROK={0:2,1:3,2:5,3:6,4:5,5:6,6:8,7:9,8:11,9:0};
  const AMROK={0:11,1:10,2:8,3:7,4:8,5:7,6:5,7:4,8:2,9:1};
  const HAKDANG={0:11,1:6,2:2,3:9,4:2,5:9,6:5,7:0,8:8,9:3};
  const CHEONDEOK={2:["stem",3],3:["branch",8],4:["stem",8],5:["stem",7],6:["branch",11],7:["stem",0],8:["stem",9],9:["branch",2],10:["stem",2],11:["stem",1],0:["branch",5],1:["stem",6]};
  const WOLDEOK={2:2,6:2,10:2,11:0,3:0,7:0,8:8,0:8,4:8,5:6,9:6,1:6};
  const TWELVE_NAMES=["겁살","재살","천살","지살","도화살","월살","망신살","장성살","반안살","역마살","육해살","화개살"];
  const TWELVE_START={8:5,0:5,4:5,2:11,6:11,10:11,5:2,9:2,1:2,11:8,3:8,7:8};

  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function uniq(arr){return [...new Set(arr)];}
  function presentGroups(c){
    const out={};
    (c.stars?.hits||[]).forEach(h=>{
      if(!out[h.name]) out[h.name]=[];
      out[h.name].push(h);
    });
    return out;
  }
  function uniquePositionRows(hits){
    const seen=new Set();
    return (hits||[]).filter(h=>{
      const k=`${h.pillar}|${h.basis||""}`; if(seen.has(k))return false;seen.add(k);return true;
    });
  }
  function groupCounts(c){
    const rows=(c.stars?.catalogue||[]);
    const m={}; GROUP_ORDER.forEach(g=>m[g]=0);
    rows.forEach(x=>{if(x.count>0)m[x.group]=(m[x.group]||0)+x.count;});
    return m;
  }
  function feature(name, meta){
    return FEATURE_META[name]||{
      title:(meta&&meta.short)||"전통 명리의 보조 상징",
      life:(meta&&meta.good)||"원국 전체와 함께 반복되는 생활 패턴을 이해하는 참고로 봅니다."
    };
  }
  function positionsNarrative(rows){
    const ps=uniq(rows.map(h=>h.pillar).filter(Boolean));
    if(!ps.length)return "성립 위치 정보가 없습니다.";
    return ps.map(p=>POSITION_MEANING[p]||`${PILLAR_LABEL[p]||p}에서 성립합니다.`).join(" ");
  }
  function starCard(name,hits){
    const rows=uniquePositionRows(hits), meta=rows[0]?.meta||S.SINSAL_META?.[name]||{}, f=feature(name,meta);
    const where=rows.map(h=>`${PILLAR_LABEL[h.pillar]||h.pillar} · ${h.basis||"기준표"}`);
    const count=rows.length;
    return `<article class="sinsalDetail card">
      <div class="sinsalTop">
        <div><span>${esc(meta.group||"신살·귀인")}</span><h3>${esc(name)} · ${esc(f.title)}</h3></div>
        <b>${count}곳</b>
      </div>
      <p>${esc(f.life)} ${esc(positionsNarrative(rows))}</p>
      ${meta.good?`<div class="sinsalUse"><strong>좋게 쓰면</strong><span>${esc(meta.good)}</span></div>`:""}
      ${meta.watch?`<div class="sinsalWatch"><strong>주의해서 보면</strong><span>${esc(meta.watch)}</span></div>`:""}
      <div class="sinsalEvidence"><b>성립 위치·근거</b> · ${where.map(esc).join(" / ")}</div>
    </article>`;
  }

  function twelveName(baseBranch, transitBranch){
    const start=TWELVE_START[baseBranch];
    if(start===undefined)return null;
    return TWELVE_NAMES[(transitBranch-start+12)%12];
  }
  function annualActivations(c, year){
    // 7월 1일은 입춘 이후라 해당 연도의 세운 연주 확인에 안전한 기준일이다.
    const f=S.flowForDate(year,7,1,c.pillars.day.stemIndex,12,0,{});
    const yp=f.pillars.year, b=yp.branchIndex, st=yp.stemIndex;
    const ds=c.pillars.day.stemIndex, yb=c.pillars.year.branchIndex, db=c.pillars.day.branchIndex, mb=c.pillars.month.branchIndex;
    const names=[];
    const y12=twelveName(yb,b), d12=twelveName(db,b);
    if(y12)names.push(y12);
    if(d12)names.push(d12);
    if(PEACH[yb]===b||PEACH[db]===b)names.push("도화살");
    if(HORSE[yb]===b||HORSE[db]===b)names.push("역마살");
    if(CANOPY[yb]===b||CANOPY[db]===b)names.push("화개살");
    if((NOBLE[ds]||[]).includes(b))names.push("천을귀인");
    if(LITERARY[ds]===b)names.push("문창귀인");
    if((TAIJI[ds]||[]).includes(b))names.push("태극귀인");
    if(HONGYEOM[ds]===b)names.push("홍염살");
    if(BLADE[ds]===b)names.push("양인살");
    if(GEONROK[ds]===b)names.push("건록");
    if(AMROK[ds]===b)names.push("암록");
    if(HAKDANG[ds]===b)names.push("학당귀인");
    if(((mb+11)%12)===b)names.push("천의성");
    const td=CHEONDEOK[mb];
    if(td && ((td[0]==="stem"&&td[1]===st)||(td[0]==="branch"&&td[1]===b))) names.push("천덕귀인");
    if(WOLDEOK[mb]===st)names.push("월덕귀인");
    return {year,pillar:yp.ko,god:f.gods.year,names:uniq(names)};
  }
  function futureFive(c,startYear){
    const y=startYear||new Date().getFullYear();
    return Array.from({length:5},(_,i)=>annualActivations(c,y+i));
  }

  function catalogueRow(x){
    const meta=S.SINSAL_META?.[x.name]||{};
    const supported=x.status==="calculated";
    let state="";
    if(supported && x.count>0) state=`<b class="catOn">원국 ${x.count}곳</b>`;
    else if(supported) state=`<b class="catOff">원국 미성립</b>`;
    else state=`<b class="catSchool">유파차이</b>`;
    const desc=supported
      ? (feature(x.name,meta).life||meta.short||"전통 명리의 보조 상징입니다.")
      : (UNSUPPORTED_REASON[x.name]||"유파별 성립 기준이 달라 현재 엔진에서는 자동 판정하지 않습니다.");
    return `<div class="sinsalCatalogRow" data-status="${supported?"calculated":"school-dependent"}">
      <div class="catName"><strong>${esc(x.name)}</strong><span>${esc(x.group)}</span></div>
      <div class="catDesc">${esc(desc)}</div>
      <div class="catState">${state}</div>
    </div>`;
  }

  function render(c,opts){
    opts=opts||{};
    const groups=presentGroups(c), names=Object.keys(groups);
    const counts=groupCounts(c);
    const cat=c.stars?.catalogue||S.SINSAL_50_CATALOG.map(x=>({...x,count:0,status:"school-dependent"}));
    const supported=c.stars?.supportedCount||cat.filter(x=>x.status==="calculated").length;
    const totalCatalog=c.stars?.catalogCount||cat.length||50;
    const placement=c.stars?.total||0;
    const future=futureFive(c,opts.startYear||new Date().getFullYear());

    return `<section class="sinsalDeep">
      <div class="sinsalHero card">
        <div class="sinsalEyebrow">신살·귀인 상세</div>
        <h2>${esc(c.input.name||"사용자")}님에게 실제로 잡힌 별부터 봅니다.</h2>
        <p>신살의 이름이 많다고 좋은 사주, 적다고 나쁜 사주가 아닙니다. 먼저 원국·월령·오행·십신을 읽고 신살은 마지막에 보조 근거로 붙입니다.</p>
        <div class="sinsalNumbers">
          <div><span>실제 계산 범위</span><b>${supported}<small> / ${totalCatalog}종</small></b></div>
          <div><span>원국 성립 종류</span><b>${names.length}<small>종</small></b></div>
          <div><span>성립 위치 합계</span><b>${placement}<small>곳</small></b></div>
        </div>
      </div>

      <div class="sinsalGroupSummary">
        ${GROUP_ORDER.map(g=>`<div class="sinsalGroup card"><span>${esc(g)}</span><b>${counts[g]||0}곳</b></div>`).join("")}
      </div>

      <div class="sinsalSectionHead">
        <span>내 원국에서 성립한 별</span>
        <h2>어디에 있고, 어떻게 쓰이는지</h2>
        <p>같은 별도 년주·월주·일주·시주 중 어디에 있는지에 따라 체감되는 생활 장면을 다르게 참고합니다.</p>
      </div>
      ${names.length ? names.sort((a,b)=>(groups[b].length-groups[a].length)).map(n=>starCard(n,groups[n])).join("") :
        `<div class="sinsalEmpty card"><h3>현재 원국에서 계산된 신살·귀인이 없습니다.</h3><p>신살이 적다는 것은 길흉의 평가가 아닙니다. 원국·십신·대운이 더 중요한 판단 기준입니다.</p></div>`}

      <div class="sinsalSectionHead futureHead">
        <span>세운 참고</span>
        <h2>앞으로 5년, 같은 기준표가 다시 만나는 해</h2>
        <p>아래는 세운의 천간·지지가 현재 엔진의 신살 기준표와 다시 일치하는지만 보여줍니다. 실제 사건 발생 시기를 예언하는 기능이 아닙니다.</p>
      </div>
      <div class="sinsalFuture">
        ${future.map(y=>`<div class="sinsalYear card">
          <div class="yearTop"><b>${y.year}</b><span>${esc(y.pillar)} · ${esc(y.god||"")}</span></div>
          <div class="yearTags">${y.names.length?y.names.map(n=>`<span>${esc(n)}</span>`).join(""):`<span class="muted">주요 기준표 재등장 없음</span>`}</div>
        </div>`).join("")}
      </div>
      <div class="sinsalTimingNote card"><b>시기를 읽는 순서</b><p>신살이 다시 들어오는 해보다 먼저 현재 대운과 세운의 십신, 원국과의 합·충·형·파·해를 봅니다. 같은 도화·역마라도 실제 생활에서는 연애가 아니라 영업, 이직, 이동, 콘텐츠 활동처럼 전혀 다른 장면으로 나타날 수 있습니다.</p></div>

      <div class="sinsalSectionHead catalogHead">
        <span>50종 전체 백과</span>
        <h2>계산하는 별과 계산하지 않는 별을 숨기지 않습니다.</h2>
        <p>현재 공식화한 38종은 실제 계산하고, 기준이 충분히 통일되지 않은 12종은 이름만 보여주며 결과를 만들어내지 않습니다.</p>
      </div>
      <div class="sinsalCatalog card">
        ${GROUP_ORDER.map(g=>{
          const rows=cat.filter(x=>x.group===g);
          return `<div class="catalogGroup"><h3>${esc(g)} <small>${rows.length}종</small></h3>${rows.map(catalogueRow).join("")}</div>`;
        }).join("")}
      </div>
      <div class="sinsalDisclaimer card"><b>해석 원칙</b><p>신살 하나로 결혼·이별·재물·질병·사고·성공을 확정하지 않습니다. 유파가 갈리는 별은 계산했다고 표시하지 않으며, 건강 문제는 사주가 아니라 의료적 기준으로 확인해야 합니다.</p></div>
    </section>`;
  }

  return {render,presentGroups,annualActivations,futureFive,UNSUPPORTED_REASON};
});
