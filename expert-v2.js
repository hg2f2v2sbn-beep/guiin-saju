/**
 * 귀인사주 해석엔진 v2 확장층
 * 기존 expert-interpreter.js의 사전/신살/기초 섹션은 유지하고,
 * 실제 계산 근거를 묶은 Person Model과 현재 Flow 기반 해석을 덧붙입니다.
 */
(function(root,factory){
  if(typeof module==="object" && module.exports){
    module.exports=factory(
      require("./expert-interpreter.js"),
      require("./saju-engine-v2-patch.js"),
      require("./guiin-engine-contract.js"),
      require("./flow-v2.js")
    );
  }else{
    root.GuiinExpert=factory(root.GuiinExpert,root.GuiinSaju,root.GuiinEngineContract,root.GuiinFlowV2);
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(Base,S,Contract,Flow){
  "use strict";
  if(!Base) throw new Error("expert-interpreter.js must load before expert-v2.js");

  const VERSION="2.0.0";
  const original={
    fullSections:Base.fullSections,
    personalitySections:Base.personalitySections,
    fieldSections:Base.fieldSections,
    flowSections:Base.flowSections
  };

  function plain(v){try{return v==null?v:JSON.parse(JSON.stringify(v));}catch(_){return null;}}
  function n(c){return String(c?.input?.name||"사용자");}
  function pko(p){return p?.ko||((p?.stem||"")+(p?.branch||""))||null;}
  function uniq(a){return [...new Set((a||[]).filter(Boolean))];}
  function pct(c){
    const src=c?.elCount||{}, total=Object.values(src).reduce((a,b)=>a+(Number(b)||0),0)||1;
    return Object.fromEntries(["목","화","토","금","수"].map(e=>[e,Math.round((Number(src[e])||0)/total*100)]));
  }
  function rankedElements(c){return Object.entries(pct(c)).sort((a,b)=>b[1]-a[1]);}

  function relationLabels(c){
    return uniq((c?.relations||[]).map(x=>{
      if(!x)return null;
      const t=x.type||x.name||x.relation;
      const a=x.aLabel||x.a||"", b=x.bLabel||x.b||"";
      return t?`${t}${a||b?`(${a}${a&&b?"-":""}${b})`:""}`:null;
    }));
  }

  function tenGodSignals(c){
    const out=[];
    for(const k of ["year","month","hour"]){
      const p=c?.pillars?.[k];
      if(p?.god) out.push({pillar:k,god:p.god,pillarKo:pko(p)});
    }
    // 일주는 "나 자신" 자리이므로 일주 천간 십성을 별도 대인 성격 십성처럼 사용하지 않는다.
    return out;
  }

  function evidenceTier(c){
    const els=rankedElements(c), rel=relationLabels(c), gods=tenGodSignals(c);
    return {
      core:[
        c?.dayMaster?.stem?`일간 ${c.dayMaster.stem}`:null,
        pko(c?.pillars?.month)?`월주 ${pko(c.pillars.month)}`:null
      ].filter(Boolean),
      ten_gods:gods.map(x=>`${x.pillarKo||x.pillar} ${x.god}`),
      elements:els.map(([e,v])=>`${e} ${v}%`),
      relations:rel,
      stars:plain(c?.stars||null),
      uncertainty:plain(c?.uncertainty||null)
    };
  }

  function personModel(c){
    const els=rankedElements(c), hi=els[0]||["-",0], lo=els[els.length-1]||["-",0];
    const gods=tenGodSignals(c);
    const monthGod=c?.pillars?.month?.god||null;
    const rel=relationLabels(c);
    const hourUnknown=!!c?.input?.hourUnknown;
    const contradictions=[];

    if(hi[1]>=35 && lo[1]<=10){
      contradictions.push({
        title:"강한 방식과 보완할 방식의 차이가 큼",
        evidence:[`${hi[0]} ${hi[1]}%`,`${lo[0]} ${lo[1]}%`],
        meaning:`${hi[0]} 방식은 쉽게 쓰지만 ${lo[0]} 방식은 의식적으로 보완해야 균형이 좋아질 수 있어요.`
      });
    }
    if(monthGod && gods.some(x=>x.god!==monthGod)){
      contradictions.push({
        title:"사회에서 쓰는 역할과 다른 장면의 반응이 다를 수 있음",
        evidence:[`월주 ${monthGod}`,...gods.filter(x=>x.god!==monthGod).slice(0,2).map(x=>`${x.pillarKo} ${x.god}`)],
        meaning:"밖에서 보이는 모습과 가까운 사람 앞에서의 반응이 완전히 같지 않을 수 있어요."
      });
    }

    return {
      schema_version:"2.0.0",
      name:n(c),
      day_master:c?.dayMaster?.stem||c?.pillars?.day?.stem||null,
      month_command:{pillar:pko(c?.pillars?.month),god:monthGod},
      strongest_element:{element:hi[0],percent:hi[1]},
      lowest_element:{element:lo[0],percent:lo[1]},
      ten_god_signals:gods,
      relation_signals:rel,
      contradictions,
      uncertainty:{
        birth_time_unknown:hourUnknown,
        hour_pillar:hourUnknown?"unavailable":"available",
        source:plain(c?.uncertainty||null)
      },
      evidence:evidenceTier(c)
    };
  }

  function modelSection(c){
    const m=personModel(c);
    const who=n(c);
    const hi=m.strongest_element, lo=m.lowest_element;
    const mg=m.month_command.god;
    const rel=m.relation_signals;
    const body=[
      `${who}님의 중심은 일간 ${m.day_master||"-"}이고, 사회에서 반복해서 쓰는 역할을 보는 월주에는 ${mg||"확인 가능한 십성"}이 들어와 있어요.`,
      `오행 분포에서는 ${hi.element} ${hi.percent}%가 상대적으로 가장 높고 ${lo.element} ${lo.percent}%가 가장 낮습니다. 이 값은 ‘오행의 개수/분포’이지 용신이나 실제 강약을 그대로 뜻하지 않아요.`,
      mg?`그래서 해석의 중심은 ${mg} 하나가 아니라 일간·월주·오행 분포·관계 신호를 함께 겹쳐서 봅니다.`:"월주 십성 정보가 충분하지 않은 경우에는 일간과 전체 분포를 더 비중 있게 봅니다.",
      rel.length?`원국의 관계 신호로는 ${rel.slice(0,4).join(" · ")}${rel.length>4?" 등이":""} 확인됩니다. 합·충·형·파·해 하나만으로 사건을 확정하지 않습니다.`:"원국에서 강하게 겹치는 관계 신호가 적다면 일간·월령·오행을 우선해서 읽는 편이 자연스러워요.",
      m.uncertainty.birth_time_unknown?"출생시간이 없기 때문에 시주 기반 성향·자녀·말년·세부 대운시점은 확정하지 않고 가능한 범위로 다룹니다.":"출생시간이 있어 시주까지 참고할 수 있지만, 절입 경계나 시간대 정밀도는 계산 진단과 함께 확인합니다."
    ].join("\n\n");
    return {
      eyebrow:"2세대 핵심 모델",
      title:`${who}님의 사주를 한 가지 성격으로 단정하지 않고 구조로 읽었어요.`,
      body,
      evidence:[
        `일간 ${m.day_master||"-"}`,
        mg?`월주 ${mg}`:null,
        `${hi.element} ${hi.percent}%`,
        `${lo.element} ${lo.percent}%`,
        ...rel.slice(0,2)
      ].filter(Boolean).join(" · "),
      confidence:m.uncertainty.birth_time_unknown?"medium":"high",
      model:m
    };
  }

  function contradictionSection(c){
    const m=personModel(c);
    if(!m.contradictions.length) return null;
    return {
      eyebrow:"겉과 속이 다르게 느껴지는 이유",
      title:"모순처럼 보이는 성향도 실제로는 서로 다른 기운을 상황별로 쓰는 모습일 수 있어요.",
      body:m.contradictions.map((x,i)=>`${i+1}. ${x.title}\n${x.meaning}`).join("\n\n"),
      evidence:uniq(m.contradictions.flatMap(x=>x.evidence)).join(" · "),
      confidence:"medium"
    };
  }

  function replaceProblemSections(sections,c){
    const model=modelSection(c), contra=contradictionSection(c);
    const out=[];
    let inserted=false;
    for(const s of (sections||[])){
      if(!inserted){
        out.push(model);
        if(contra)out.push(contra);
        inserted=true;
      }
      // 기존 "일주와 십성" 섹션은 일주 천간을 별도 십성 역할로 읽는 문제가 있어 v2에서 제외.
      if(String(s?.eyebrow||"").includes("일주와 십성")) continue;
      out.push({...s,confidence:s?.confidence||"medium"});
    }
    if(!inserted)out.push(model);
    return out;
  }

  function currentFlowSection(c,referenceDate){
    if(!Flow || typeof Flow.currentContext!=="function") return null;
    let ctx=null;
    try{ctx=Flow.currentContext(c,referenceDate||new Date());}catch(_){return null;}
    const d=ctx?.current_daeun, y=ctx?.current_seun, m=ctx?.current_wolun, day=ctx?.current_ilun;
    const body=[
      d?`현재 대운은 ${d.ko||"-"}${d.god?`(${d.god})`:""}로 잡힙니다.`:"현재 대운은 정밀 범위 확인이 필요합니다.",
      y?`세운은 ${y.pillar||"-"}${y.god?`(${y.god})`:""}입니다.`:"",
      m?`월운은 ${m.pillar||"-"}${m.god?`(${m.god})`:""}입니다.`:"",
      day?`오늘 일운은 ${day.pillar||"-"}${day.god?`(${day.god})`:""}입니다.`:"",
      "이 네 층을 사건 예언으로 단정하지 않고, 지금 어떤 역할과 반응이 동시에 강조되는지 보는 배경으로 사용합니다."
    ].filter(Boolean).join("\n\n");
    return {
      eyebrow:"현재 운의 실제 층위",
      title:"원국 → 대운 → 세운 → 월운 → 일운 순서로 현재 흐름을 겹쳐 봅니다.",
      body,
      evidence:[
        d?`대운 ${d.ko||"-"} ${d.god||""}`:null,
        y?`세운 ${y.pillar||"-"} ${y.god||""}`:null,
        m?`월운 ${m.pillar||"-"} ${m.god||""}`:null,
        day?`일운 ${day.pillar||"-"} ${day.god||""}`:null
      ].filter(Boolean).join(" · "),
      confidence:c?.input?.hourUnknown?"medium":"high"
    };
  }

  function fullSections(c){return replaceProblemSections(original.fullSections(c),c);}
  function personalitySections(c){return replaceProblemSections(original.personalitySections(c),c);}
  function fieldSections(c){return replaceProblemSections(original.fieldSections(c),c);}

  function flowSections(c,year){
    const old=original.flowSections(c,year);
    const live=currentFlowSection(c,new Date());
    const sections=[live,...(old?.sections||[])].filter(Boolean);
    return {...old,sections};
  }

  Base.VERSION_V2=VERSION;
  Base.personModel=personModel;
  Base.evidenceTier=evidenceTier;
  Base.modelSection=modelSection;
  Base.currentFlowSection=currentFlowSection;
  Base.fullSections=fullSections;
  Base.personalitySections=personalitySections;
  Base.fieldSections=fieldSections;
  Base.flowSections=flowSections;
  return Base;
});
