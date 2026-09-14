/**
 * 귀인사주 궁합 2세대 확장층
 * 기존 계산 raw signal을 보존하면서 A→B/B→A 방향성, 두 사람 Person Model,
 * 싸움 번역기, 현재 대운 차이를 실제 UI 결과에 추가합니다.
 */
(function(root,factory){
  if(typeof module==="object" && module.exports){
    module.exports=factory(
      require("./compatibility-interpreter.js"),
      require("./saju-engine-v2-patch.js"),
      require("./flow-v2.js")
    );
  }else{
    root.GuiinCompat=factory(root.GuiinCompat,root.GuiinSaju,root.GuiinFlowV2);
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(Base,S,Flow){
  "use strict";
  if(!Base || typeof Base.build!=="function") throw new Error("compatibility-interpreter.js must load before compatibility-v2.js");

  const VERSION="2.0.0";
  const originalBuild=Base.build.bind(Base);
  const originalPick=Base.pick.bind(Base);

  const GOD_TRANSLATE={
    "비견":{need:"동등하게 존중받고 싶음",stress:"상대가 나를 통제한다고 느끼면 바로 버틸 수 있음",repair:"누가 맞는지보다 각자 선택권을 먼저 인정하기"},
    "겁재":{need:"내 편이라는 확신과 빠른 반응",stress:"비교·질투·돈·시간 배분에서 예민해질 수 있음",repair:"경쟁 구도를 멈추고 부담 범위를 숫자와 행동으로 정하기"},
    "식신":{need:"편안함과 일상의 안정",stress:"압박받으면 대화를 미루고 익숙한 방식으로 숨을 수 있음",repair:"밥·수면·휴식 같은 생활 리듬부터 안정시키고 이야기하기"},
    "상관":{need:"솔직하게 말하고 바꿀 자유",stress:"답답하면 말이 세지거나 상대의 문제를 고치려 들 수 있음",repair:"평가 대신 구체적인 요청 한 문장으로 바꾸기"},
    "편재":{need:"재미·활동성·현실적인 기회",stress:"약속보다 상황을 우선해 상대가 불안해질 수 있음",repair:"변경할 때 미리 알리고 돈·시간 기준을 합의하기"},
    "정재":{need:"예측 가능한 약속과 생활 안정",stress:"애정이 책임과 관리처럼 굳어질 수 있음",repair:"해야 할 일과 애정표현을 따로 구분해서 말하기"},
    "편관":{need:"분명함·결단·강한 신뢰",stress:"압박이 커지면 통제와 눈치 싸움으로 바뀔 수 있음",repair:"명령형 표현 대신 선택지와 경계를 동시에 제시하기"},
    "정관":{need:"예의·약속·관계의 공식적인 안정",stress:"정답과 기준으로 상대를 평가하기 쉬움",repair:"규칙을 강요하기 전에 둘이 합의한 규칙인지 확인하기"},
    "편인":{need:"생각할 거리와 개인 공간",stress:"확인보다 추측이 많아지고 마음을 닫을 수 있음",repair:"추측한 내용과 실제 확인한 사실을 분리해서 말하기"},
    "정인":{need:"이해·보호·정서적 안정",stress:"돌봄이 한쪽으로 기울면 보호자-피보호자처럼 굳어질 수 있음",repair:"도와주는 것과 대신 책임지는 것을 구분하기"}
  };

  function plain(v){try{return v==null?v:JSON.parse(JSON.stringify(v));}catch(_){return null;}}
  function name(c,f){return String(c?.input?.name||f);}
  function pko(p){return p?.ko||((p?.stem||"")+(p?.branch||""))||null;}

  function exactCurrentLuck(c,ref){
    if(Flow && typeof Flow.currentLuck==="function"){
      try{return Flow.currentLuck(c,ref||new Date());}catch(_){}
    }
    const now=ref||new Date();
    const birth=Date.UTC(Number(c?.input?.year),Number(c?.input?.month)-1,Number(c?.input?.day),12);
    const age=(now.getTime()-birth)/(365.2425*86400000);
    if(S && typeof S.currentLuckAtAge==="function") return S.currentLuckAtAge(c?.luck||[],age);
    return null;
  }

  function person(c,fallback){
    const e=Base.pct(c), order=Object.entries(e).sort((a,b)=>b[1]-a[1]);
    return {
      name:name(c,fallback),
      day_master:c?.dayMaster?.stem||c?.pillars?.day?.stem||null,
      day_element:c?.dayMaster?.el||null,
      day_branch:c?.pillars?.day?.branch||null,
      month_god:c?.pillars?.month?.god||null,
      strongest:{element:order[0]?.[0]||null,percent:order[0]?.[1]||0},
      lowest:{element:order[order.length-1]?.[0]||null,percent:order[order.length-1]?.[1]||0},
      hour_unknown:!!c?.input?.hourUnknown,
      current_luck:plain(exactCurrentLuck(c,new Date()))
    };
  }

  function direction(a,b){
    const tg=Base.crossTenGod(a,b);
    const A=name(a,"A"),B=name(b,"B");
    const ab=GOD_TRANSLATE[tg.aSeesB]||{need:"상대에게서 특정 역할감을 느낌",stress:"기대가 어긋나면 오해가 생길 수 있음",repair:"기대를 말로 확인하기"};
    const ba=GOD_TRANSLATE[tg.bSeesA]||{need:"상대에게서 특정 역할감을 느낌",stress:"기대가 어긋나면 오해가 생길 수 있음",repair:"기대를 말로 확인하기"};
    return {
      a_to_b:{from:A,to:B,ten_god:tg.aSeesB,...ab},
      b_to_a:{from:B,to:A,ten_god:tg.bSeesA,...ba}
    };
  }

  function fightTranslator(a,b){
    const d=direction(a,b), rel=Base.dayBranchRelation(a,b);
    return {
      trigger:[
        `${d.a_to_b.from}은 ${d.a_to_b.to}에게 ${d.a_to_b.ten_god}의 역할을 기대하기 쉬워요.`,
        `${d.b_to_a.from}은 ${d.b_to_a.to}에게 ${d.b_to_a.ten_god}의 역할을 기대하기 쉬워요.`,
        `일지 관계는 ${rel}입니다.`
      ],
      when_a_upset:`${d.a_to_b.from} 쪽에서는 “${d.a_to_b.need}”이 충족되지 않을 때 ${d.a_to_b.stress}으로 나타날 수 있어요.`,
      when_b_upset:`${d.b_to_a.from} 쪽에서는 “${d.b_to_a.need}”이 충족되지 않을 때 ${d.b_to_a.stress}으로 나타날 수 있어요.`,
      translation:[
        `${d.a_to_b.from}: ${d.a_to_b.repair}`,
        `${d.b_to_a.from}: ${d.b_to_a.repair}`
      ],
      caution:"이 설명은 싸움의 원인을 운명처럼 확정하는 것이 아니라, 두 명식의 교차 십성을 실제 대화 언어로 번역한 참고값입니다."
    };
  }

  function v2Sections(a,b,analysis){
    const A=person(a,"A"),B=person(b,"B"),dir=direction(a,b),fight=fightTranslator(a,b);
    const drel=Base.dayBranchRelation(a,b);
    const aLuck=A.current_luck,bLuck=B.current_luck;
    return [
      {
        id:"direction",
        category:"summary",
        title:"같은 관계라도 서로가 상대를 다르게 느끼는 이유",
        body:`${A.name} → ${B.name} 방향에서는 ${dir.a_to_b.ten_god}, ${B.name} → ${A.name} 방향에서는 ${dir.b_to_a.ten_god}로 읽혀요. 그래서 한 사람에게는 ${dir.a_to_b.need}이 핵심인데, 다른 사람에게는 ${dir.b_to_a.need}이 더 중요할 수 있습니다. 궁합은 한 점수보다 이 방향 차이를 이해하는 게 실제 관계에 더 도움이 돼요.`,
        evidence:`${A.name}→${B.name} ${dir.a_to_b.ten_god} · ${B.name}→${A.name} ${dir.b_to_a.ten_god} · 일지 ${drel}`
      },
      {
        id:"fight",
        category:"love",
        title:"싸웠을 때 서로의 말을 이렇게 번역해보세요",
        body:`${fight.when_a_upset}\n\n${fight.when_b_upset}\n\n다시 대화할 때는\n① ${fight.translation[0]}\n② ${fight.translation[1]}\n\n${fight.caution}`,
        evidence:`교차 십성 ${dir.a_to_b.ten_god} ↔ ${dir.b_to_a.ten_god} · 일지 ${drel}`
      },
      {
        id:"currentPairFlow",
        category:"summary",
        title:"지금 두 사람의 속도가 다를 수 있는 이유",
        body:`${A.name}의 현재 대운은 ${aLuck?`${aLuck.ko||"-"}${aLuck.god?`(${aLuck.god})`:""}`:"정밀 확인 필요"}, ${B.name}의 현재 대운은 ${bLuck?`${bLuck.ko||"-"}${bLuck.god?`(${bLuck.god})`:""}`:"정밀 확인 필요"}로 계산됩니다. 서로 다른 대운 주제에 있으면 한 사람은 일·책임에, 다른 사람은 관계·회복·변화에 더 많은 에너지를 쓰는 것처럼 체감할 수 있어요. 이것을 감정의 크기 하나로 단정하지 않는 게 중요합니다.`,
        evidence:`${A.name} ${aLuck?.ko||"-"} ${aLuck?.god||""} · ${B.name} ${bLuck?.ko||"-"} ${bLuck?.god||""}`
      }
    ];
  }

  function build(a,b,score){
    const old=originalBuild(a,b,score);
    const add=v2Sections(a,b,old);
    return {
      ...old,
      version:VERSION,
      personModels:{a:person(a,"A"),b:person(b,"B")},
      directionality:direction(a,b),
      fightTranslator:fightTranslator(a,b),
      sections:[...(old.sections||[]),...add]
    };
  }

  function pick(analysis,tab){
    const s=analysis?.sections||[];
    if(tab==="summary") return s;
    if(tab==="love") return s.filter(x=>["why","good","bad","love","longterm","direction","fight","currentPairFlow"].includes(x.id));
    if(tab==="marriage") return s.filter(x=>["good","bad","marriage","money","longterm","direction","currentPairFlow"].includes(x.id));
    if(tab==="partner") return s.filter(x=>["partner","why","bad","love","longterm","direction","fight"].includes(x.id));
    return originalPick(analysis,tab);
  }

  Base.VERSION_V2=VERSION;
  Base.personModel=person;
  Base.directionality=direction;
  Base.fightTranslator=fightTranslator;
  Base.build=build;
  Base.pick=pick;
  return Base;
});
