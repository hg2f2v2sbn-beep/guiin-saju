/**
 * 귀인사주 오늘/주간/월간 운세 품질 레이어 v2
 * - 무작위/날짜 시드 문구가 아니라 GuiinSaju.flowForDate() 계산값을 사용
 * - 현재 대운 + 세운/월운/일운 + 원국과의 합충형파해를 보조 근거로 사용
 * - 결과를 확정 예언으로 표현하지 않음
 *
 * 사용:
 *   GuiinFortuneV2.rows(chart, "today")
 *   GuiinFortuneV2.rows(chart, "week")
 *   GuiinFortuneV2.rows(chart, "month")
 */
(function(root){
  "use strict";

  const VERSION="2.3.1";

  const GOD={
    "비견":{
      key:"자기기준", work:"내 판단과 역할 범위를 분명히 할수록 집중이 살아나는 흐름",
      money:"내가 직접 통제할 수 있는 지출과 수입 구조를 확인하기 좋은 흐름",
      love:"상대에게 맞추기보다 서로의 기준과 경계를 말로 확인하는 편이 좋은 흐름",
      total:"남의 속도보다 내 기준을 먼저 잡을수록 선택이 선명해지는 흐름",
      watch:"고집으로 밀기보다 상대의 이유를 한 번 더 듣는 것이 균형에 도움이 됩니다."
    },
    "겁재":{
      key:"경쟁·관계", work:"사람·협상·경쟁이 늘 수 있어 역할과 책임을 명확히 할수록 유리한 흐름",
      money:"사람을 따라 나가는 돈이나 즉흥적인 지출을 한 번 더 점검하기 좋은 흐름",
      love:"질투나 비교보다 각자의 자유와 경계를 확인하는 편이 좋은 흐름",
      total:"주변 움직임이 커질수록 내 몫과 남의 몫을 구분하는 것이 중요한 흐름",
      watch:"비교심이나 급한 승부욕 때문에 계획이 흔들리지 않는지 확인해 보세요."
    },
    "식신":{
      key:"생산·돌봄", work:"기술·서비스·콘텐츠처럼 눈에 보이는 결과물을 차근차근 쌓기 좋은 흐름",
      money:"반복 가능한 일과 작은 성과를 수입으로 연결하기 좋은 흐름",
      love:"말보다 실제 행동과 배려로 마음을 확인하기 쉬운 흐름",
      total:"무리하게 크게 벌이기보다 꾸준히 만들어 내는 힘이 살아나는 흐름",
      watch:"잘 챙기느라 내 체력과 시간을 먼저 소진하지 않도록 분량을 조절하세요."
    },
    "상관":{
      key:"표현·개선", work:"답답한 방식을 바꾸거나 아이디어를 꺼내기 좋은 흐름",
      money:"새 수입 아이디어를 생각하기 좋지만 충동적인 결정은 한 번 더 검토할 흐름",
      love:"참고 넘기기보다 불편한 점을 정확한 말로 표현하는 것이 중요한 흐름",
      total:"표현력과 문제 해결력이 살아나지만 말의 속도를 조절하면 더 좋은 흐름",
      watch:"맞는 말을 너무 빠르고 강하게 전달해 관계가 상하지 않는지 살펴보세요."
    },
    "편재":{
      key:"기회·확장", work:"사람·기회·외부 활동을 넓게 보는 감각이 살아날 수 있는 흐름",
      money:"수입 기회를 넓게 보되 큰 지출이나 투자 결정은 현실 조건을 따져볼 흐름",
      love:"새로운 만남과 활동성이 커질 수 있어 관계의 기대치를 분명히 하는 편이 좋은 흐름",
      total:"움직이는 만큼 기회를 발견하기 쉬우나 선택과 집중이 필요한 흐름",
      watch:"기회가 많아 보일수록 실제로 남는 것과 비용을 숫자로 확인하세요."
    },
    "정재":{
      key:"관리·안정", work:"일정·마감·반복 업무처럼 현실적인 구조를 정리하기 좋은 흐름",
      money:"예산·저축·고정비를 점검하고 돈이 남는 구조를 만들기 좋은 흐름",
      love:"약속과 생활 리듬처럼 현실적인 신뢰를 쌓는 것이 중요한 흐름",
      total:"크게 흔들기보다 생활과 재정을 안정시키는 선택이 힘을 받는 흐름",
      watch:"안정만 지키느라 필요한 변화까지 미루고 있지는 않은지 확인해 보세요."
    },
    "편관":{
      key:"압박·실행", work:"책임과 긴장도가 올라갈 수 있어 우선순위를 정하면 실행력이 살아나는 흐름",
      money:"급한 비용이나 책임성 지출이 생길 수 있어 여유 자금을 지키는 편이 좋은 흐름",
      love:"상대나 관계를 통제하려 하기보다 서로의 부담을 구체적으로 나누는 것이 중요한 흐름",
      total:"해야 할 일이 많아질수록 기준과 순서를 세우는 것이 중요한 흐름",
      watch:"압박감 때문에 모든 문제를 한 번에 해결하려 하지 말고 순서를 정하세요."
    },
    "정관":{
      key:"책임·평판", work:"규칙·평판·책임이 중요한 자리에서 안정적으로 실력을 보여주기 좋은 흐름",
      money:"계약·고정지출·장기 계획처럼 공식적인 조건을 점검하기 좋은 흐름",
      love:"신뢰와 약속, 관계의 책임 범위를 확인하기 좋은 흐름",
      total:"기준을 지키고 차분하게 정리할수록 신뢰를 얻기 쉬운 흐름",
      watch:"남의 기대를 지키느라 내 상황을 지나치게 뒤로 미루지 마세요."
    },
    "편인":{
      key:"관찰·재해석", work:"익숙한 방식보다 다른 관점이나 전문 지식을 파고들기 좋은 흐름",
      money:"새로운 수입보다 기존 구조의 빈틈을 찾아 정리하는 편이 좋은 흐름",
      love:"혼자 생각한 결론보다 실제 대화로 상대 마음을 확인하는 것이 중요한 흐름",
      total:"밖으로 크게 움직이기보다 관찰하고 방향을 다시 잡는 힘이 살아나는 흐름",
      watch:"생각이 길어져 행동 시점을 놓치지 않도록 작은 실행 하나를 정하세요."
    },
    "정인":{
      key:"배움·보호", work:"배우고 정리하고 자격·문서·기초를 다지기 좋은 흐름",
      money:"공격적으로 늘리기보다 안전망과 계획을 점검하기 좋은 흐름",
      love:"편안함과 정서적 안정, 서로를 이해하는 대화가 중요한 흐름",
      total:"서두르기보다 배우고 준비하며 기반을 다지는 힘이 살아나는 흐름",
      watch:"준비만 계속하다 실제 시작을 미루고 있지는 않은지 확인해 보세요."
    }
  };

  const RELATION_TEXT={
    "충":"변화와 충돌 신호가 있어 일정이나 감정이 예상보다 크게 흔들릴 수 있습니다.",
    "형":"압박과 반복 신호가 있어 같은 문제를 다른 방식으로 풀 필요가 있습니다.",
    "해":"겉으로 드러나지 않은 불편이나 오해를 확인할 필요가 있습니다.",
    "파":"계획이 미세하게 틀어질 수 있어 작은 수정에 유연한 편이 좋습니다.",
    "육합":"사람이나 일의 연결이 자연스럽게 맞물릴 여지가 있습니다.",
    "천간합":"협력·합의·연결을 활용하기 좋은 여지가 있습니다.",
    "삼합":"여러 조건이 한 방향으로 모일 수 있어 집중력이 살아날 여지가 있습니다."
  };

  function nowKst(){
    // 브라우저가 한국이 아니어도 한국 날짜를 기준으로 계산
    try{
      const parts=new Intl.DateTimeFormat("en-CA",{
        timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"
      }).formatToParts(new Date()).reduce((o,p)=>(o[p.type]=p.value,o),{});
      return new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),3,0,0));
    }catch(_){
      const n=new Date();
      return new Date(Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate(),3,0,0));
    }
  }

  function ymd(date){
    return {year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()};
  }

  function addDays(date,n){
    return new Date(date.getTime()+n*86400000);
  }

  function dayStemIndex(chart){
    const n=chart?.pillars?.day?.stemIndex;
    if(Number.isInteger(n))return n;
    const stem=chart?.dayMaster?.stem||chart?.pillars?.day?.stem;
    const stems=["갑","을","병","정","무","기","경","신","임","계"];
    return stems.indexOf(stem);
  }

  function flow(chart,date){
    if(!chart||!root.GuiinSaju||typeof root.GuiinSaju.flowForDate!=="function")return null;
    const ds=dayStemIndex(chart);
    if(ds<0)return null;
    const d=ymd(date);
    try{
      return root.GuiinSaju.flowForDate(
        d.year,d.month,d.day,ds,12,0,
        {dayBoundary:chart?.input?.dayBoundary||"23"}
      );
    }catch(_){return null;}
  }

  function exactAgeYears(chart,date=nowKst()){
    const i=chart?.input||{};
    const y=Number(i.year),m=Number(i.month||1),d=Number(i.day||1);
    if(!Number.isFinite(y))return null;
    const h=i.hourUnknown?12:Number(i.hour??12),min=i.hourUnknown?0:Number(i.minute??0);
    const birthMs=Date.UTC(y,m-1,d,Number.isFinite(h)?h:12,Number.isFinite(min)?min:0)-9*3600000;
    const ref=date instanceof Date?date:nowKst();
    return (ref.getTime()-birthMs)/(365.2425*86400000);
  }
  function currentLuck(chart,date=nowKst()){
    const age=exactAgeYears(chart,date),rows=chart?.luck||[];
    if(age==null||!rows.length)return rows[0]||null;
    for(let i=0;i<rows.length;i++){
      const row=rows[i];
      const start=Number(row?.fromAgeExact??row?.fromAge);
      const next=Number(rows[i+1]?.fromAgeExact??rows[i+1]?.fromAge);
      const legacyEnd=Number(row?.toAgeExact??row?.toAge);
      const end=Number.isFinite(next)?next:legacyEnd;
      if(Number.isFinite(start)&&Number.isFinite(end)&&age>=start&&age<end)return row;
    }
    return rows.find(x=>age>=Number(x.fromAge)&&age<=Number(x.toAge))||rows[0]||null;
  }

  function relations(chart,transit){
    if(!chart?.pillars||!transit||!root.GuiinSaju||typeof root.GuiinSaju.relationsWithTransit!=="function")return [];
    try{return root.GuiinSaju.relationsWithTransit(chart.pillars,transit)||[];}catch(_){return [];}
  }

  function relationSummary(rows){
    const types=[...new Set((rows||[]).map(x=>x?.type).filter(Boolean))];
    if(!types.length)return "";
    const ordered=["충","형","해","파","육합","천간합","삼합"].filter(x=>types.includes(x));
    return ordered.slice(0,2).map(x=>RELATION_TEXT[x]).filter(Boolean).join(" ");
  }

  function godData(name){return GOD[name]||{
    key:"균형", work:"우선순위를 정하고 하나씩 마무리하기 좋은 흐름",
    money:"수입과 지출을 현실적인 숫자로 확인하기 좋은 흐름",
    love:"추측보다 대화로 상대의 생각을 확인하는 편이 좋은 흐름",
    total:"속도보다 방향과 균형을 확인하는 것이 중요한 흐름",
    watch:"한 가지 신호만으로 결론내리지 말고 실제 상황을 함께 확인하세요."
  };}

  function evidence(chart,f,date){
    const lk=currentLuck(chart,date);
    const parts=[];
    if(lk?.ko)parts.push(`${lk.ko} 대운${lk.god?`(${lk.god})`:""}`);
    if(f?.pillars?.year?.ko)parts.push(`${f.pillars.year.ko} 세운${f.gods?.year?`(${f.gods.year})`:""}`);
    if(f?.pillars?.month?.ko)parts.push(`${f.pillars.month.ko} 월운${f.gods?.month?`(${f.gods.month})`:""}`);
    if(f?.pillars?.day?.ko)parts.push(`${f.pillars.day.ko} 일운${f.gods?.day?`(${f.gods.day})`:""}`);
    return parts.slice(0,4).join(" · ");
  }

  function dailyRows(chart,date=nowKst()){
    const f=flow(chart,date);
    if(!f)return fallbackRows("today");
    const dayGod=f.gods?.day||"";
    const monthGod=f.gods?.month||"";
    const yearGod=f.gods?.year||"";
    const d=godData(dayGod), m=godData(monthGod), y=godData(yearGod);
    const rs=relations(chart,f.pillars?.day);
    const rel=relationSummary(rs);
    const ev=evidence(chart,f,date);

    return [
      ["총운", `${d.total} ${rel||m.total} 오늘은 ${d.watch} 근거: ${ev}`],
      ["애정운", `${d.love} ${monthGod&&monthGod!==dayGod?`이번 달의 ${m.key} 흐름도 함께 작용하므로, 감정의 크기보다 실제 행동과 대화를 확인해 보세요.`:""} ${rel}`.trim()],
      ["재물운", `${d.money} ${yearGod?`올해는 ${y.key} 주제가 배경에 있으니 큰 결정은 오늘 기분보다 장기 계획과 함께 보세요.`:""} `],
      ["직장운", `${d.work} ${monthGod?`월운에서는 ${m.key} 주제가 반복되기 쉬워, 이번 달 안에서 이어갈 일과 오늘 끝낼 일을 나누면 좋습니다.`:""}`],
      ["건강운", `사주로 질병을 판단하지는 않습니다. 다만 오늘 ${d.key} 흐름이 강해질 때는 피로한 상태에서 중요한 결정을 몰아붙이지 말고 수면·식사·휴식 같은 기본 컨디션을 먼저 확인해 보세요.`]
    ].map(([k,v])=>[k,v.replace(/\s+/g," ").trim()]);
  }

  function collectDays(chart,start,count){
    const rows=[];
    for(let i=0;i<count;i++){
      const date=addDays(start,i), f=flow(chart,date);
      if(f)rows.push({date,f,god:f.gods?.day||"",relations:relations(chart,f.pillars?.day)});
    }
    return rows;
  }

  function dominantGod(items){
    const counts={};
    items.forEach(x=>{if(x.god)counts[x.god]=(counts[x.god]||0)+1;});
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
  }

  function activeRelationDays(items){
    return items.filter(x=>(x.relations||[]).some(r=>["충","형","해","파","육합","천간합","삼합"].includes(r.type)));
  }

  function formatMd(date){
    return `${date.getUTCMonth()+1}/${date.getUTCDate()}`;
  }

  function weekRows(chart,start=nowKst()){
    const items=collectDays(chart,start,7);
    if(!items.length)return fallbackRows("week");
    const dg=dominantGod(items), d=godData(dg);
    const relDays=activeRelationDays(items);
    const caution=relDays.filter(x=>(x.relations||[]).some(r=>["충","형","해","파"].includes(r.type))).slice(0,2);
    const smooth=relDays.filter(x=>(x.relations||[]).some(r=>["육합","천간합","삼합"].includes(r.type))).slice(0,2);
    const cautionText=caution.length?`변화·조정 신호가 상대적으로 눈에 띄는 날은 ${caution.map(x=>formatMd(x.date)).join(", ")}입니다. 일정에 여유를 두세요.`:"";
    const smoothText=smooth.length?`연결과 협업을 활용하기 좋은 신호는 ${smooth.map(x=>formatMd(x.date)).join(", ")}에 상대적으로 더 보입니다.`:"";

    return [
      ["총운", `이번 7일은 ${dg||"균형"} 주제가 가장 자주 반복됩니다. ${d.total} ${cautionText}`],
      ["애정운", `${d.love} ${smoothText||"특정 하루의 분위기보다 일주일 동안 반복되는 대화 패턴을 보는 편이 좋습니다."}`],
      ["재물운", `${d.money} 이번 주에는 하루의 기분보다 7일 전체 지출을 묶어서 확인하면 흐름을 더 현실적으로 관리할 수 있습니다.`],
      ["직장운", `${d.work} ${smoothText||cautionText}`],
      ["건강운", `사주로 건강 상태를 진단하지 않습니다. 이번 주는 ${d.key} 주제가 반복될수록 일정이 몰릴 수 있으니, 실제 피로도와 수면·식사·휴식 상태를 기준으로 강도를 조절하세요.`]
    ].map(([k,v])=>[k,v.replace(/\s+/g," ").trim()]);
  }

  function daysInMonth(y,m){return new Date(Date.UTC(y,m,0)).getUTCDate();}

  function monthRows(chart,base=nowKst()){
    const {year,month}=ymd(base);
    const first=new Date(Date.UTC(year,month-1,1,3,0,0));
    const items=collectDays(chart,first,daysInMonth(year,month));
    if(!items.length)return fallbackRows("month");
    const dg=dominantGod(items), d=godData(dg);
    const middle=flow(chart,new Date(Date.UTC(year,month-1,15,3,0,0)));
    const mg=middle?.gods?.month||"", m=godData(mg);
    const lk=currentLuck(chart,base);
    const relDays=activeRelationDays(items);
    const cautionCount=relDays.filter(x=>(x.relations||[]).some(r=>["충","형","해","파"].includes(r.type))).length;
    const smoothCount=relDays.filter(x=>(x.relations||[]).some(r=>["육합","천간합","삼합"].includes(r.type))).length;
    const balance=`이번 달 계산에서는 조정 신호가 잡히는 날 ${cautionCount}일, 연결 신호가 잡히는 날 ${smoothCount}일이 있어 한쪽으로만 단정하기보다 일정별로 강약을 나눠 보는 편이 좋습니다.`;

    return [
      ["총운", `${year}년 ${month}월은 월운의 ${mg||"균형"} 주제와 일운에서 자주 반복되는 ${dg||"균형"} 주제를 함께 봐야 합니다. ${m.total} ${balance}`],
      ["애정운", `${m.love} 한 달 전체를 좋다·나쁘다로 단정하기보다 관계에서 반복되는 기대와 실제 행동이 맞는지 확인하는 것이 중요합니다.`],
      ["재물운", `${m.money} ${lk?.god?`현재 대운의 ${lk.god} 주제도 배경에 있으므로, 큰돈은 월운만 보고 결정하지 말고 현금흐름과 실제 조건을 함께 확인하세요.`:""}`],
      ["직장운", `${m.work} 일운에서는 ${dg||"균형"} 주제가 자주 반복되므로, 이번 달 목표를 하나 정하고 주 단위로 결과를 확인하는 방식이 잘 맞습니다.`],
      ["건강운", `사주로 질병이나 건강 결과를 예측하지 않습니다. 이번 달은 ${m.key} 주제가 강해질 때 생기는 실제 일정과 피로도를 보고 수면·식사·휴식 시간을 먼저 확보하는 쪽이 좋습니다.`]
    ].map(([k,v])=>[k,v.replace(/\s+/g," ").trim()]);
  }


  // ---------- v2.2 연·월별 타이밍 + 삼재 보조층 ----------
  const SIGNAL_SCORE={
    "비견":{money:0,relationship:0,support:0,career:1,caution:0},
    "겁재":{money:-1,relationship:0,support:0,career:1,caution:2},
    "식신":{money:1,relationship:1,support:0,career:2,caution:0},
    "상관":{money:1,relationship:1,support:0,career:2,caution:1},
    "편재":{money:3,relationship:2,support:1,career:2,caution:1},
    "정재":{money:3,relationship:2,support:1,career:2,caution:0},
    "편관":{money:0,relationship:2,support:0,career:2,caution:2},
    "정관":{money:1,relationship:2,support:2,career:3,caution:0},
    "편인":{money:0,relationship:0,support:3,career:1,caution:1},
    "정인":{money:0,relationship:1,support:3,career:1,caution:0}
  };
  const SPEECH_CAUTION={"비견":0,"겁재":2,"식신":0,"상관":3,"편재":1,"정재":0,"편관":2,"정관":0,"편인":1,"정인":0};
  const SAMJAE_GROUPS={
    "신":["인","묘","진"],"자":["인","묘","진"],"진":["인","묘","진"],
    "해":["사","오","미"],"묘":["사","오","미"],"미":["사","오","미"],
    "인":["신","유","술"],"오":["신","유","술"],"술":["신","유","술"],
    "사":["해","자","축"],"유":["해","자","축"],"축":["해","자","축"]
  };
  const SAMJAE_STAGE=["들삼재","눌삼재","날삼재"];
  const NOBLE_BRANCHES={
    "갑":["축","미"],"무":["축","미"],"경":["축","미"],
    "을":["자","신"],"기":["자","신"],
    "병":["해","유"],"정":["해","유"],
    "신":["인","오"],
    "임":["묘","사"],"계":["묘","사"]
  };
  function nobleSignal(chart,transit){
    const stem=chart?.dayMaster?.stem||chart?.pillars?.day?.stem||"";
    const branch=transit?.branch||"";
    return !!(NOBLE_BRANCHES[stem]||[]).includes(branch);
  }

  function relationTypes(rows){
    return [...new Set((rows||[]).map(x=>x?.type).filter(Boolean))];
  }
  function signalScore(god, relRows){
    const base=Object.assign({money:0,relationship:0,support:0,career:0,caution:0,speech:0},SIGNAL_SCORE[god]||{});
    base.speech=Number(SPEECH_CAUTION[god]||0);
    const types=relationTypes(relRows);
    const positive=types.filter(x=>["육합","천간합","삼합"].includes(x)).length;
    const adjust=types.filter(x=>["충","형","해","파"].includes(x)).length;
    base.relationship+=positive*2;
    base.support+=positive;
    base.career+=positive;
    base.caution+=adjust*2;
    base.speech+=adjust*2;
    if(types.includes("해"))base.speech+=1;
    return base;
  }
  function exactAge(chart,date){return exactAgeYears(chart,date);}
  function currentLuckExact(chart,date=nowKst()){return currentLuck(chart,date);}
  function samjae(chart,year=nowKst().getUTCFullYear()){
    const birthBranch=chart?.pillars?.year?.branch||null;
    const targetFlow=flow(chart,new Date(Date.UTC(Number(year),6,1,3,0,0)));
    const yearBranch=targetFlow?.pillars?.year?.branch||null;
    const seq=SAMJAE_GROUPS[birthBranch]||null;
    if(!seq||!yearBranch)return {year:Number(year),birthBranch,yearBranch,applies:false,stage:null,order:null};
    const idx=seq.indexOf(yearBranch);
    return {year:Number(year),birthBranch,yearBranch,applies:idx>=0,stage:idx>=0?SAMJAE_STAGE[idx]:null,order:idx>=0?idx+1:null,
      note:idx>=0?"삼재는 띠를 기준으로 보는 전통 보조 개념이며, 원국·대운·세운보다 우선하지 않습니다.":"해당 연도는 띠 기준 삼재 구간에 포함되지 않습니다."};
  }
  function samjaeTimeline(chart,startYear=nowKst().getUTCFullYear(),count=12){
    const rows=[];
    const n=Math.max(1,Math.min(24,Number(count)||12));
    for(let i=0;i<n;i++){
      const x=samjae(chart,Number(startYear)+i);
      if(x&&x.applies)rows.push(x);
    }
    return {startYear:Number(startYear),count:n,rows};
  }

  function monthSignal(chart,year,month){
    const date=new Date(Date.UTC(Number(year),Number(month)-1,15,3,0,0));
    const f=flow(chart,date);
    if(!f)return null;
    const god=f?.gods?.month||"";
    const rel=relations(chart,f?.pillars?.month);
    const score=signalScore(god,rel);
    const noble=nobleSignal(chart,f?.pillars?.month);
    if(noble){score.support+=4;score.relationship+=1;score.career+=1;}
    const lk=currentLuckExact(chart,date);
    if(lk?.god&&SIGNAL_SCORE[lk.god]){
      const bg=SIGNAL_SCORE[lk.god];
      score.money+=Math.round((bg.money||0)*0.35);
      score.relationship+=Math.round((bg.relationship||0)*0.35);
      score.support+=Math.round((bg.support||0)*0.35);
      score.career+=Math.round((bg.career||0)*0.35);
      score.caution+=Math.round((bg.caution||0)*0.25);
      score.speech+=Math.round((SPEECH_CAUTION[lk.god]||0)*0.25);
    }
    return {
      year:Number(year),month:Number(month),pillar:f?.pillars?.month?.ko||null,god,noble,
      relations:relationTypes(rel),scores:score,daeun:lk?{ko:lk.ko||null,god:lk.god||null}:null,
      evidence:[f?.pillars?.month?.ko?`${f.pillars.month.ko} 월운`:null,god?`${god}`:null,noble?"천을귀인 보조신호":null,relationTypes(rel).join("·")||null].filter(Boolean).join(" · ")
    };
  }
  function yearOverview(chart,year=nowKst().getUTCFullYear()){
    const out=[];
    for(let m=1;m<=12;m++){
      const x=monthSignal(chart,year,m);
      if(x)out.push(x);
    }
    return out;
  }
  function topBy(rows,key,count=3,desc=true){
    return (rows||[]).slice().sort((a,b)=>{
      const av=Number(a?.scores?.[key]||0),bv=Number(b?.scores?.[key]||0);
      return desc?(bv-av||a.month-b.month):(av-bv||a.month-b.month);
    }).slice(0,count);
  }
  function timingHighlights(chart,year=nowKst().getUTCFullYear()){
    const months=yearOverview(chart,year);
    return {
      year:Number(year),samjae:samjae(chart,year),months,
      money:topBy(months,"money",3),
      relationship:topBy(months,"relationship",3),
      support:topBy(months,"support",3),
      noble:months.filter(x=>x.noble).sort((a,b)=>b.scores.support-a.scores.support||a.month-b.month).slice(0,4),
      career:topBy(months,"career",3),
      speech:topBy(months,"speech",3),
      caution:topBy(months,"caution",3)
    };
  }
  function yearSignal(chart,year){
    const date=new Date(Date.UTC(Number(year),6,1,3,0,0));
    const f=flow(chart,date);
    if(!f)return null;
    const god=f?.gods?.year||"";
    const rel=relations(chart,f?.pillars?.year);
    const score=signalScore(god,rel);
    const noble=nobleSignal(chart,f?.pillars?.year);
    if(noble){score.support+=5;score.relationship+=1;score.career+=1;}
    const lk=currentLuckExact(chart,date);
    if(lk?.god&&SIGNAL_SCORE[lk.god]){
      const bg=SIGNAL_SCORE[lk.god];
      score.money+=Math.round((bg.money||0)*0.6);
      score.relationship+=Math.round((bg.relationship||0)*0.6);
      score.support+=Math.round((bg.support||0)*0.6);
      score.career+=Math.round((bg.career||0)*0.6);
      score.caution+=Math.round((bg.caution||0)*0.4);
      score.speech+=Math.round((SPEECH_CAUTION[lk.god]||0)*0.4);
    }
    return {year:Number(year),pillar:f?.pillars?.year?.ko||null,god,noble,relations:relationTypes(rel),scores:score,
      daeun:lk?{ko:lk.ko||null,god:lk.god||null}:null,samjae:samjae(chart,year)};
  }
  function longRangeHighlights(chart,startYear=nowKst().getUTCFullYear(),count=10){
    const years=[];
    const limit=Math.max(1,Math.min(20,Number(count)||10));
    for(let i=0;i<limit;i++){
      const x=yearSignal(chart,Number(startYear)+i);
      if(x)years.push(x);
    }
    const by=(key,n=3)=>years.slice().sort((a,b)=>Number(b?.scores?.[key]||0)-Number(a?.scores?.[key]||0)||a.year-b.year).slice(0,n);
    return {startYear:Number(startYear),count:limit,years,money:by("money"),relationship:by("relationship"),support:by("support"),noble:years.filter(x=>x.noble).slice(0,4),career:by("career"),speech:by("speech"),caution:by("caution")};
  }
  function compactTiming(chart,year=nowKst().getUTCFullYear()){
    const h=timingHighlights(chart,year), long=longRangeHighlights(chart,year,10),now=nowKst();
    const slim=x=>({year:x.year,month:x.month||null,pillar:x.pillar||null,god:x.god||null,noble:!!x.noble,relations:x.relations||[],scores:x.scores||{},daeun:x.daeun||null,evidence:x.evidence||null});
    const currentYear=now.getUTCFullYear(),currentMonth=now.getUTCMonth()+1;
    const remaining=(Number(year)===currentYear?h.months.filter(x=>Number(x.month)>=currentMonth):h.months.slice());
    const rtop=(key,count=3)=>topBy(remaining,key,count);
    const remainingNoble=remaining.filter(x=>x.noble).sort((a,b)=>b.scores.support-a.scores.support||a.month-b.month).slice(0,4);
    return {
      schema_version:"timing-2.3.1",year:h.year,samjae:h.samjae,samjae_timeline:samjaeTimeline(chart,year,12),current_month:Number(year)===currentYear?currentMonth:null,
      months:{money:h.money.map(slim),relationship:h.relationship.map(slim),support:h.support.map(slim),noble:h.noble.map(slim),career:h.career.map(slim),speech:h.speech.map(slim),caution:h.caution.map(slim)},
      remaining_months:{money:rtop("money").map(slim),relationship:rtop("relationship").map(slim),support:rtop("support").map(slim),noble:remainingNoble.map(slim),career:rtop("career").map(slim),speech:rtop("speech").map(slim),caution:rtop("caution").map(slim)},
      years:{money:long.money.map(slim),relationship:long.relationship.map(slim),support:long.support.map(slim),noble:long.noble.map(slim),career:long.career.map(slim),speech:long.speech.map(slim),caution:long.caution.map(slim)}
    };
  }

  function fallbackRows(period){
    const scope=period==="week"?"이번 주":period==="month"?"이번 달":"오늘";
    return [
      ["총운",`${scope} 운세 계산값을 불러오지 못했습니다. 명식을 다시 계산한 뒤 확인해 주세요.`],
      ["애정운","관계의 결론을 운세만으로 정하지 말고 실제 대화와 행동을 함께 확인해 주세요."],
      ["재물운","재정 판단은 실제 수입·지출·부채·현금흐름을 기준으로 해 주세요."],
      ["직장운","직업 선택은 업무 조건과 성장 가능성, 생활 여건을 함께 확인해 주세요."],
      ["건강운","건강 문제는 운세가 아니라 실제 증상과 전문가의 평가를 기준으로 해 주세요."]
    ];
  }

  function rows(chart,period="today"){
    if(!chart)return fallbackRows(period);
    if(period==="week")return weekRows(chart);
    if(period==="month")return monthRows(chart);
    return dailyRows(chart);
  }

  root.GuiinFortuneV2={
    version:VERSION,
    rows,
    dailyRows,
    weekRows,
    monthRows,
    flow,
    currentLuck,
    currentLuckExact,
    samjae,
    samjaeTimeline,
    monthSignal,
    yearOverview,
    timingHighlights,
    yearSignal,
    longRangeHighlights,
    compactTiming
  };

})(typeof window!=="undefined"?window:globalThis);
