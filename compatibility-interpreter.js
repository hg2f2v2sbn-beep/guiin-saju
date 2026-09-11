/**
 * 귀인사주 — 상세 궁합 해석 모듈
 * 목적: 두 명식을 단순 점수 하나로 줄이지 않고, 실제 계산된 원국 차이/관계 신호를 8개 주제로 풀어 설명한다.
 * 주의: 명리학적 상징 해석이며 실제 관계 결과를 보장하거나 단정하지 않는다.
 */
(function(root, factory){
  if(typeof module === "object" && module.exports) module.exports = factory(
    typeof require === "function" ? require("./saju-engine.js") : null
  );
  else root.GuiinCompat = factory(root.GuiinSaju);
})(typeof self !== "undefined" ? self : this, function(GuiinSaju){
  "use strict";

  const ELS = ["목","화","토","금","수"];
  const GEN = {목:"화",화:"토",토:"금",금:"수",수:"목"};
  const CTRL = {목:"토",토:"수",수:"화",화:"금",금:"목"};
  const BRANCH_COMBINE = {0:1,1:0,2:11,11:2,3:10,10:3,4:9,9:4,5:8,8:5,6:7,7:6};
  const BRANCH_CLASH = {0:6,6:0,1:7,7:1,2:8,8:2,3:9,9:3,4:10,10:4,5:11,11:5};
  const BRANCH_HARM = {0:7,7:0,1:6,6:1,2:5,5:2,3:4,4:3,8:11,11:8,9:10,10:9};
  const BRANCH_BREAK = {0:9,9:0,1:4,4:1,2:11,11:2,3:6,6:3,5:8,8:5,7:10,10:7};
  const STEM_COMBINE = {0:5,5:0,1:6,6:1,2:7,7:2,3:8,8:3,4:9,9:4};
  const PUNISH_PAIRS = [[2,5],[5,8],[8,2],[1,10],[10,7],[7,1],[0,3]];
  const SELF_PUNISH = new Set([4,6,9,11]);

  const TEN_GOD_TONE = {
    "비견": ["닮은 사람처럼 빠르게 친해지는 느낌", "서로 자기 방식이 분명해 주도권이 겹치면 경쟁처럼 느껴질 수 있습니다"],
    "겁재": ["강한 자극과 추진력을 느끼는 관계", "비교·질투·속도 경쟁이 생기면 피로가 빨리 쌓일 수 있습니다"],
    "식신": ["편안함과 돌봄, 함께 먹고 쉬고 생활하는 즐거움", "편안함이 익숙함으로 바뀌면 중요한 대화를 미루기 쉽습니다"],
    "상관": ["솔직함과 신선한 자극, 서로의 생각을 깨우는 힘", "말이 날카로워지거나 상대의 기준을 자꾸 고치려 들면 상처가 커질 수 있습니다"],
    "편재": ["활동성·재미·현실 감각을 크게 느끼는 관계", "약속보다 상황을 우선하면 상대는 가볍게 느낄 수 있습니다"],
    "정재": ["안정감과 책임감, 현실적으로 함께할 수 있다는 느낌", "관계가 의무와 관리로만 흐르면 설렘이 줄 수 있습니다"],
    "편관": ["긴장감과 강한 끌림, 서로를 움직이게 하는 압력", "통제·눈치·기준 강요가 생기면 관계가 쉽게 지칠 수 있습니다"],
    "정관": ["신뢰와 예의, 관계를 제대로 이어가고 싶은 마음", "정답을 정해 놓고 상대를 평가하면 답답함이 생길 수 있습니다"],
    "편인": ["쉽게 다 읽히지 않는 신비함과 호기심", "생각이 많아지면 확인보다 추측이 앞설 수 있습니다"],
    "정인": ["이해받고 보호받는 느낌, 정서적 안도감", "돌봄이 한쪽으로 기울면 보호자와 피보호자처럼 굳어질 수 있습니다"]
  };

  function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
  function safeName(c, fallback){ return (c && c.input && c.input.name) ? String(c.input.name) : fallback; }

  function pct(c){
    const total = Object.values((c&&c.elCount)||{}).reduce((a,b)=>a+(+b||0),0)||1;
    const o={};
    ELS.forEach(e=>o[e]=Math.round((((c&&c.elCount)||{})[e]||0)/total*100));
    return o;
  }
  function ordered(p){ return ELS.slice().sort((a,b)=>p[b]-p[a]); }
  function profile(c){
    const p=pct(c), order=ordered(p);
    return {
      pct:p,
      dominant:order[0],
      second:order[1],
      weak:order[order.length-1],
      dayEl:c.dayMaster.el,
      dayStem:c.dayMaster.stem,
      dayH:c.dayMaster.hanja,
      yin:c.dayMaster.yin,
      dayBranch:c.pillars.day.branch,
      dayBranchH:c.pillars.day.branchH,
      monthBranch:c.pillars.month.branch,
      monthGod:c.pillars.month.god
    };
  }

  function dayBranchRelation(a,b){
    const x=a.pillars.day.branchIndex, y=b.pillars.day.branchIndex;
    if(BRANCH_COMBINE[x]===y) return "육합";
    if(BRANCH_CLASH[x]===y) return "충";
    if(BRANCH_HARM[x]===y) return "해";
    if(BRANCH_BREAK[x]===y) return "파";
    if(PUNISH_PAIRS.some(([u,v])=>(x===u&&y===v)||(x===v&&y===u)) || (x===y&&SELF_PUNISH.has(x))) return "형";
    return "직접 관계 없음";
  }

  function dayMasterRelation(a,b){
    const ae=a.dayMaster.el, be=b.dayMaster.el;
    if(ae===be) return {type:"동행", text:`두 사람의 일간 오행이 모두 ${ae}이라 기본적인 반응 속도나 중요하게 여기는 지점이 닮아 보일 수 있습니다.`};
    if(GEN[ae]===be) return {type:"A생B", text:`${safeName(a,"나")}의 ${ae} 기운이 ${safeName(b,"상대")}의 ${be} 기운을 생하는 방향이라, 내가 먼저 밀어주거나 에너지를 보태는 장면이 생기기 쉽습니다.`};
    if(GEN[be]===ae) return {type:"B생A", text:`${safeName(b,"상대")}의 ${be} 기운이 ${safeName(a,"나")}의 ${ae} 기운을 생하는 방향이라, 상대가 나를 북돋우거나 현실적인 힘을 보태는 장면이 생기기 쉽습니다.`};
    if(CTRL[ae]===be) return {type:"A극B", text:`${safeName(a,"나")}의 ${ae} 기운이 ${safeName(b,"상대")}의 ${be} 기운을 제어하는 방향이라, 내가 기준이나 속도를 잡으려 할 때 상대가 압박으로 받아들일 수 있습니다.`};
    if(CTRL[be]===ae) return {type:"B극A", text:`${safeName(b,"상대")}의 ${be} 기운이 ${safeName(a,"나")}의 ${ae} 기운을 제어하는 방향이라, 상대의 기준이나 요구가 나에게 압박으로 느껴질 때가 있을 수 있습니다.`};
    return {type:"교차", text:"두 일간 오행은 직접적인 생극보다 다른 기둥과 오행 분포를 함께 봐야 관계의 방향이 더 잘 드러납니다."};
  }

  function crossTenGod(a,b){
    if(!GuiinSaju || typeof GuiinSaju.tenGod!=="function") return {aSeesB:"-",bSeesA:"-"};
    return {
      aSeesB: GuiinSaju.tenGod(a.pillars.day.stemIndex,b.pillars.day.stemIndex),
      bSeesA: GuiinSaju.tenGod(b.pillars.day.stemIndex,a.pillars.day.stemIndex)
    };
  }

  function relationSignals(a,b){
    const keys=["year","month","day","hour"];
    const A=keys.map(k=>[k,a.pillars[k]]).filter(x=>x[1]);
    const B=keys.map(k=>[k,b.pillars[k]]).filter(x=>x[1]);
    const hits=[];
    for(const [ak,ap] of A){
      for(const [bk,bp] of B){
        const weight = (ak==="day"&&bk==="day") ? 3 : ((ak==="day"||bk==="day") ? 2 : 1);
        if(STEM_COMBINE[ap.stemIndex]===bp.stemIndex) hits.push({type:"천간합",ak,bk,weight});
        if(BRANCH_COMBINE[ap.branchIndex]===bp.branchIndex) hits.push({type:"육합",ak,bk,weight});
        if(BRANCH_CLASH[ap.branchIndex]===bp.branchIndex) hits.push({type:"충",ak,bk,weight});
        if(BRANCH_HARM[ap.branchIndex]===bp.branchIndex) hits.push({type:"해",ak,bk,weight});
        if(BRANCH_BREAK[ap.branchIndex]===bp.branchIndex) hits.push({type:"파",ak,bk,weight});
        if(PUNISH_PAIRS.some(([u,v])=>(ap.branchIndex===u&&bp.branchIndex===v)||(ap.branchIndex===v&&bp.branchIndex===u)) ||
           (ap.branchIndex===bp.branchIndex&&SELF_PUNISH.has(ap.branchIndex))){
          hits.push({type:"형",ak,bk,weight});
        }
      }
    }
    const count=(type)=>hits.filter(h=>h.type===type).reduce((s,h)=>s+h.weight,0);
    return {
      hits,
      combine:count("천간합")+count("육합"),
      tension:count("충")+count("해")+count("파")+count("형"),
      types:[...new Set(hits.map(h=>h.type))]
    };
  }

  function elementDistance(a,b){
    const pa=pct(a), pb=pct(b);
    return ELS.reduce((s,e)=>s+Math.abs(pa[e]-pb[e]),0);
  }

  function complementText(a,b){
    const A=profile(a), B=profile(b);
    const aNeeds=A.weak, bNeeds=B.weak;
    const bGives=B.pct[aNeeds], aGives=A.pct[bNeeds];
    const bits=[];
    if(bGives>=22) bits.push(`${safeName(b,"상대")} 쪽의 ${aNeeds} 기운이 ${safeName(a,"나")}에게 상대적으로 부족한 부분을 채워주는 모양`);
    if(aGives>=22) bits.push(`${safeName(a,"나")} 쪽의 ${bNeeds} 기운이 ${safeName(b,"상대")}에게 상대적으로 부족한 부분을 보완하는 모양`);
    if(!bits.length) bits.push("서로의 부족한 오행을 한쪽이 강하게 대신 채워주는 구조보다는, 각자 가진 방식의 차이를 조율하는 쪽");
    return bits.join("이고, ");
  }

  function relationTone(dayRel){
    const map={
      "육합":"일지끼리 육합이 잡혀 생활 속에서 자연스럽게 붙고, 사소한 루틴을 공유할 때 친밀감이 커지는 편입니다.",
      "충":"일지끼리 충이 있어 끌림과 자극이 큰 대신 생활 리듬·감정 반응·결정 방식이 정면으로 부딪히는 장면도 커질 수 있습니다.",
      "해":"일지에 해가 있어 겉으로 큰 싸움이 없어도 '왜 저렇게 받아들이지?' 같은 미세한 오해가 누적되기 쉽습니다.",
      "파":"일지에 파가 있어 약속이나 기대가 어긋날 때 관계 리듬이 끊기는 느낌을 받을 수 있습니다.",
      "형":"일지에 형이 있어 비슷한 문제를 반복해서 건드리거나, 서로가 상대의 예민한 지점을 자꾸 자극하는 패턴이 생길 수 있습니다.",
      "직접 관계 없음":"일지끼리 강한 합·충·형·파·해가 직접 걸리지는 않아, 관계의 체감은 두 사람의 오행 분포와 말·생활 습관에서 더 크게 갈릴 수 있습니다."
    };
    return map[dayRel];
  }

  function scoreBand(score){
    if(score>=86) return "서로의 장점을 살릴 여지가 큰 편";
    if(score>=76) return "맞는 부분과 조율할 부분이 함께 있는 편";
    if(score>=66) return "끌림은 있어도 생활 방식의 조율이 중요한 편";
    return "감정만으로 밀어붙이기보다 합의와 경계가 특히 중요한 편";
  }

  function currentLuckText(c){
    const now=new Date();
    let age=now.getFullYear()-c.input.year;
    const passed=(now.getMonth()+1>c.input.month)||((now.getMonth()+1===c.input.month)&&now.getDate()>=c.input.day);
    if(!passed) age-=1;
    const lk=(c.luck||[]).find(x=>age>=x.fromAgeExact&&age<x.toAgeExact) || (c.luck||[]).find(x=>age>=x.fromAge&&age<=x.toAge);
    return lk ? `${lk.ko} 대운(${lk.god})` : "현재 대운";
  }

  function build(a,b,score){
    const A=profile(a), B=profile(b), tg=crossTenGod(a,b), sig=relationSignals(a,b);
    const drel=dayBranchRelation(a,b), dmrel=dayMasterRelation(a,b), dist=elementDistance(a,b);
    const aTone=TEN_GOD_TONE[tg.aSeesB]||["서로에게 분명한 인상을 주는 관계","기대치를 말로 확인하는 것이 중요합니다"];
    const bTone=TEN_GOD_TONE[tg.bSeesA]||["서로에게 분명한 인상을 주는 관계","기대치를 말로 확인하는 것이 중요합니다"];
    const nA=safeName(a,"나"), nB=safeName(b,"상대");
    const scoreText=Number.isFinite(score)?`현재 참고 궁합 지수는 ${score}점으로, ${scoreBand(score)}입니다. `:"";

    const whyMet =
      `${nA}은 ${nB}의 일간을 십신으로 볼 때 ${tg.aSeesB}, ${nB}은 ${nA}을 ${tg.bSeesA}로 받아들이는 구조입니다. `+
      `이 조합은 한쪽만 끌리는 단순한 관계라기보다 서로에게 서로 다른 역할감을 만들기 쉽습니다. ${nA} 쪽에서는 ${aTone[0]}이 먼저 느껴질 수 있고, ${nB} 쪽에서는 ${bTone[0]}이 관계의 시작점이 되기 쉽습니다. `+
      `${dmrel.text} 명리에서 “왜 만났는가”를 운명처럼 단정할 수는 없지만, 두 사람이 서로에게 어떤 자극과 필요를 느끼는지는 이런 교차 구조에서 읽을 수 있습니다.`;

    const good =
      `${relationTone(drel)} 두 사람의 전체 원국을 교차해서 보면 합 계열 신호의 가중치는 ${sig.combine}, 긴장 계열 신호의 가중치는 ${sig.tension}으로 잡힙니다. `+
      `${complementText(a,b)}으로 읽힙니다. ${scoreText}잘 맞는 부분은 상대를 내 방식으로 바꾸려 할 때보다, 각자가 잘하는 역할을 분리해 맡을 때 더 분명하게 살아납니다. `+
      `특히 서로의 강한 오행인 ${A.dominant}와 ${B.dominant}의 장점을 생활 속 역할로 쓰면 관계가 안정되기 쉽습니다.`;

    const bad =
      `좋지 않게 작동할 가능성은 “궁합이 나빠서”라기보다 강한 기운이 과해질 때 나타납니다. ${nA}은 ${A.dominant} ${A.pct[A.dominant]}%, ${nB}은 ${B.dominant} ${B.pct[B.dominant]}%가 상대적으로 두드러지고, 두 사람 오행 분포 차이는 ${dist}포인트입니다. `+
      `${aTone[1]} 또한 ${bTone[1]} 서로 피곤할 때는 이 차이가 취향·연락 빈도·돈 쓰는 방식·약속을 지키는 속도 같은 현실 문제로 보일 수 있습니다. `+
      `다툼이 생겼을 때 “누가 맞느냐”보다 각자 어떤 방식으로 회복하는지 합의해 두는 것이 이 관계의 약점을 줄이는 핵심입니다.`;

    const love =
      `연애에서는 ${nA}이 ${nB}에게 ${tg.aSeesB}의 감정을, ${nB}이 ${nA}에게 ${tg.bSeesA}의 감정을 투영하기 쉽습니다. `+
      `그래서 같은 행동도 한 사람에게는 애정 표현인데 다른 사람에게는 간섭이나 무관심처럼 번역될 수 있습니다. ${relationTone(drel)} `+
      `좋을 때는 서로가 익숙하지 않은 감정 표현을 배워 관계의 폭이 넓어지고, 나쁠 때는 “이 정도는 알아줘야 하는 것 아닌가”라는 기대가 쌓입니다. `+
      `연락·애정표현·혼자 있는 시간 세 가지를 구체적인 행동 기준으로 정해 두면 감정 추측이 줄어듭니다.`;

    const marriage =
      `결혼이나 동거는 연애의 끌림보다 반복되는 생활 리듬이 더 중요합니다. ${nA}의 월주는 ${a.pillars.month.ko}(${a.pillars.month.god}), ${nB}의 월주는 ${b.pillars.month.ko}(${b.pillars.month.god})이고, 일지는 ${a.pillars.day.ko}와 ${b.pillars.day.ko}입니다. `+
      `월주는 사회생활·일상 운영의 결을, 일지는 가까운 관계에서의 생활 반응을 보는 핵심 자료로 활용할 수 있습니다. ${relationTone(drel)} `+
      `함께 살게 된다면 청소·수면·외출·가족 일정처럼 반복되는 일상을 누가 알아서 해주길 기대하기보다 처음부터 역할과 기준을 말로 정하는 편이 좋습니다.`;

    const money =
      `돈과 책임 문제에서는 두 사람의 토·금 비중과 재성 해석을 한쪽 공식으로 단정하지 않고 실제 생활 습관과 함께 보는 것이 안전합니다. 현재 분포상 ${nA}의 토·금은 ${A.pct["토"]+A.pct["금"]}%, ${nB}은 ${B.pct["토"]+B.pct["금"]}%입니다. `+
      `이 차이가 크면 한쪽은 계획·저축·정리를 중요하게 보고 다른 쪽은 경험·속도·필요한 지출을 우선할 수 있습니다. 차이가 작더라도 두 사람 모두 같은 시기에 과감해지면 제동 역할이 사라질 수 있습니다. `+
      `공동비용, 각자 자유비용, 큰 지출 사전합의 금액을 따로 정해 두면 사주 해석보다 실제 갈등 예방에 훨씬 도움이 됩니다.`;

    const partner =
      `${nB}을 한 사람으로 보면 일간은 ${B.dayStem}(${B.dayH}) ${B.dayEl}, ${B.yin}의 기운이고 월주 십신은 ${B.monthGod}입니다. 오행은 ${ELS.map(e=>`${e} ${B.pct[e]}%`).join(", ")}로 나타납니다. `+
      `가장 큰 ${B.dominant}은 평소에 쉽게 쓰는 에너지이고, 가장 작은 ${B.weak}은 피곤하거나 압박을 받을 때 먼저 비는 부분으로 참고할 수 있습니다. `+
      `${nA}의 시선에서는 이 사람이 ${tg.aSeesB}로 들어오기 때문에 실제 성격 그 자체와 내가 이 사람에게 기대하는 역할이 다를 수 있습니다. 상대를 제대로 이해하려면 “원래 그런 사람”이라고 단정하기보다, 평소와 지쳤을 때의 반응을 나눠서 보는 편이 정확합니다.`;

    const longterm =
      `지금 두 사람의 관계를 길게 보려면 원국 궁합 하나보다 각자의 대운이 어떤 생활 과제를 강조하는지도 함께 봐야 합니다. 현재 기준으로 ${nA}은 ${currentLuckText(a)}, ${nB}은 ${currentLuckText(b)}의 흐름에 들어가 있습니다. `+
      `대운의 십신이 다르면 한 사람은 일·책임·현실 문제에 집중하는 동안 다른 사람은 관계·휴식·새로운 경험을 더 중요하게 느낄 수 있습니다. 이때 감정이 식었다고 단정하면 실제 이유를 놓치기 쉽습니다. `+
      `이 관계가 오래 가는 핵심은 서로를 계속 좋아하는지 한 가지만 확인하는 것이 아니라, 지금 각자 무엇에 에너지를 쓰고 있는지와 앞으로 함께 책임질 범위를 주기적으로 다시 합의하는 것입니다.`;

    const sections=[
      {id:"partner",category:"partner",title:`${nB}을 한 사람으로 읽으면`,body:partner,evidence:`일간 ${B.dayStem}${B.dayBranch} · 월주 ${b.pillars.month.ko} · 강한 오행 ${B.dominant} ${B.pct[B.dominant]}%`},
      {id:"why",category:"summary",title:"우리는 왜 서로에게 끌렸을까",body:whyMet,evidence:`교차 십신 ${tg.aSeesB} ↔ ${tg.bSeesA} · 일간 오행 ${A.dayEl} ↔ ${B.dayEl}`},
      {id:"good",category:"summary",title:"둘이 함께 있을 때 좋은 점",body:good,evidence:`일지 관계 ${drel} · 합 신호 ${sig.combine} · 보완 구조 ${A.weak}/${B.weak}`},
      {id:"bad",category:"love",title:"반대로 힘들어질 수 있는 지점",body:bad,evidence:`오행 거리 ${dist} · 긴장 신호 ${sig.tension} · 강한 오행 ${A.dominant}/${B.dominant}`},
      {id:"love",category:"love",title:"연애할 때 사랑을 주고받는 방식",body:love,evidence:`${nA}→${nB} ${tg.aSeesB} · ${nB}→${nA} ${tg.bSeesA} · 일지 ${drel}`},
      {id:"marriage",category:"marriage",title:"같이 살거나 결혼하면 보이는 모습",body:marriage,evidence:`월주 ${a.pillars.month.ko}/${b.pillars.month.ko} · 일주 ${a.pillars.day.ko}/${b.pillars.day.ko}`},
      {id:"money",category:"marriage",title:"돈·생활·책임에서 맞춰야 할 부분",body:money,evidence:`토·금 비중 ${A.pct["토"]+A.pct["금"]}% ↔ ${B.pct["토"]+B.pct["금"]}%`},
      {id:"longterm",category:"summary",title:"이 관계를 오래 가져가려면",body:longterm,evidence:`현재 흐름 ${currentLuckText(a)} ↔ ${currentLuckText(b)}`}
    ];

    return {
      meta:{
        aName:nA,bName:nB,dayRelation:drel,crossTenGod:tg,elementDistance:dist,
        combineSignal:sig.combine,tensionSignal:sig.tension,relationTypes:sig.types
      },
      sections
    };
  }

  function pick(analysis,tab){
    const s=analysis.sections||[];
    if(tab==="summary") return s; // 요약 탭은 8개 전체 공개
    if(tab==="love") return s.filter(x=>["why","good","bad","love","longterm"].includes(x.id));
    if(tab==="marriage") return s.filter(x=>["good","bad","marriage","money","longterm"].includes(x.id));
    if(tab==="partner") return s.filter(x=>["partner","why","bad","love","longterm"].includes(x.id));
    return s;
  }

  return {build,pick,pct,dayBranchRelation,relationSignals,crossTenGod};
});
