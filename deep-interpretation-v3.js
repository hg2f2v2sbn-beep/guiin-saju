/**
 * 귀인사주 Deep Interpretation V3 · QA R3
 * 목적: 기존 계산 엔진은 그대로 두고, 출력 해석만 더 구조적·개인화·교차형으로 강화합니다.
 * 원칙: 월령/일간/통근/오행/십성/합충형파해/12운성/대운·세운 순으로 근거를 쌓고,
 *       신살은 보조 근거로만 사용합니다. 미래 사건은 확정하지 않습니다.
 */
(function(root){
  'use strict';

  const BaseExpert=root.GuiinExpert||{};
  const BaseCompat=root.GuiinCompat||{};
  const Engine=root.GuiinSaju||{};
  const ELS=['목','화','토','금','수'];
  const PILLARS=['year','month','day','hour'];
  const LABEL={year:'년주',month:'월주',day:'일주',hour:'시주'};
  const SEASON={인:'봄',묘:'봄',진:'봄',사:'여름',오:'여름',미:'여름',신:'가을',유:'가을',술:'가을',해:'겨울',자:'겨울',축:'겨울'};
  const EL_WORD={
    목:{asset:'방향을 만들고 키우는 힘',over:'계획과 가능성을 너무 많이 벌이는 것',low:'새로운 시도와 장기 계획을 작게라도 계속 만드는 것'},
    화:{asset:'표현하고 움직이며 분위기를 바꾸는 힘',over:'결론과 감정의 속도가 주변보다 앞서가는 것',low:'표현·행동·몸의 활력을 의식적으로 끌어올리는 것'},
    토:{asset:'버티고 운영하고 끝을 보는 힘',over:'책임과 걱정을 자기 몫으로 과하게 끌어오는 것',low:'생활 리듬과 마무리 기준을 눈에 보이게 만드는 것'},
    금:{asset:'기준을 세우고 잘라내고 정리하는 힘',over:'완벽주의와 자기검열이 너무 빨리 켜지는 것',low:'거절·우선순위·마감 기준을 문장으로 정하는 것'},
    수:{asset:'관찰하고 연결하고 흐름을 읽는 힘',over:'생각이 길어져 판단보다 걱정이 많아지는 것',low:'휴식·정보정리·감정의 순환 시간을 확보하는 것'}
  };
  const GOD={
    비견:{core:'자기 기준과 독립성',asset:'결정권이 있을 때 실력이 빨리 살아나는 힘',trap:'협업에서도 혼자 해결하려는 습관'},
    겁재:{core:'경쟁·속도·사람 사이의 추진력',asset:'현장 대응과 기회 포착',trap:'관계나 경쟁 때문에 시간·돈을 과하게 쓰는 것'},
    식신:{core:'생산·생활·꾸준함',asset:'기술을 반복해 결과물로 만드는 힘',trap:'편안한 구조를 오래 붙들어 변화 시점을 늦추는 것'},
    상관:{core:'표현·개선·문제제기',asset:'틀린 점을 빨리 찾아 고치는 힘',trap:'답답함이 쌓였을 때 말이 너무 정확해서 오히려 날카로워지는 것'},
    편재:{core:'기회·사람·시장 감각',asset:'사람과 자원을 연결해 판을 넓히는 힘',trap:'기분과 관계에 따라 지출과 약속이 커지는 것'},
    정재:{core:'관리·축적·현실 감각',asset:'반복 가능한 돈과 생활 구조를 만드는 힘',trap:'안정 유지를 위해 불편한 구조까지 오래 감수하는 것'},
    편관:{core:'압박 대응·결단·긴장',asset:'책임이 큰 순간에 집중력이 올라가는 힘',trap:'긴장을 능력으로 착각해 계속 센 환경만 선택하는 것'},
    정관:{core:'책임·규칙·신뢰',asset:'기준과 권한이 분명한 환경에서 신뢰를 쌓는 힘',trap:'해야 한다는 이유로 자기 욕구를 뒤로 미루는 것'},
    편인:{core:'직관·전문성·독자적 관점',asset:'남들이 지나치는 문제를 깊게 파고드는 힘',trap:'확인보다 추측과 해석이 먼저 커지는 것'},
    정인:{core:'학습·보호·안정',asset:'배운 것을 체계화하고 사람을 안정시키는 힘',trap:'준비가 충분해질 때까지 실행을 늦추는 것'},
    일간:{core:'자기 중심',asset:'자기 방식으로 판단하는 힘',trap:'다른 구조를 함께 보지 않으면 해석이 단순해지는 것'}
  };
  const CLIMATE={
    목:{봄:'성장력이 이미 살아 있는 계절의 나무',여름:'열기 속에서 방향과 수분 관리가 필요한 나무',가을:'가지치기와 기준을 배우는 계절의 나무',겨울:'겉보다 뿌리와 준비가 중요한 계절의 나무'},
    화:{봄:'연료가 붙으며 점점 밝아지는 불',여름:'이미 열기가 충분한 계절의 불',가을:'빛의 방향과 집중력이 중요해지는 불',겨울:'차가운 환경에서 열을 지켜야 하는 불'},
    토:{봄:'새로운 것을 받아 키워야 하는 흙',여름:'열과 책임이 쉽게 쌓이는 흙',가을:'결과를 정리하고 수확하는 흙',겨울:'속도를 낮추고 기반을 다져야 하는 흙'},
    금:{봄:'아직 다듬어질 시간이 필요한 금속',여름:'열 속에서 형태를 바꾸는 금속',가을:'판단과 정리가 가장 선명해지는 금속',겨울:'차갑고 예리해져 유연성을 의식해야 하는 금속'},
    수:{봄:'성장을 밀어주는 흐르는 물',여름:'열을 식히며 균형을 잡는 물',가을:'정보와 판단이 맑아지는 물',겨울:'깊이가 커져 생각이 안으로 모이는 물'}
  };


  // ---------------- Deep V3: 신강·신약 참고 / 조후 / 십성 위치 / 운 교차 ----------------
  const EL_CYCLE=['목','화','토','금','수'];
  const BRANCH_ELEMENT={자:'수',축:'토',인:'목',묘:'목',진:'토',사:'화',오:'화',미:'토',신:'금',유:'금',술:'토',해:'수'};
  function elAt(el,offset){
    const i=EL_CYCLE.indexOf(el);return i<0?'':EL_CYCLE[(i+offset+5)%5];
  }
  function resourceEl(el){return elAt(el,-1)}
  function outputEl(el){return elAt(el,1)}
  function wealthEl(el){return elAt(el,2)}
  function officerEl(el){return elAt(el,3)}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function monthBranchEl(c){return c?.pillars?.month?.branchEl||BRANCH_ELEMENT[c?.pillars?.month?.branch]||''}

  function strengthAssessment(c){
    const p=pct(c), dm=dmEl(c), res=resourceEl(dm), out=outputEl(dm), wealth=wealthEl(dm), officer=officerEl(dm);
    const me=monthBranchEl(c);
    let season=0;
    if(me===dm)season=16;
    else if(me===res)season=10;
    else if(me===out)season=-5;
    else if(me===wealth)season=-7;
    else if(me===officer)season=-10;
    const rootWeight=(roots(c)||[]).reduce((s,x)=>s+(Number(x?.weight)||0.35),0);
    const rootScore=Math.min(18,rootWeight*16);
    const raw=50+season+rootScore
      +((p[dm]||0)-20)*0.45
      +((p[res]||0)-20)*0.28
      -((p[out]||0)-20)*0.18
      -((p[wealth]||0)-20)*0.14
      -((p[officer]||0)-20)*0.18;
    const score=Math.round(clamp(raw,5,95));
    let label='중화에 가까움', operating='힘을 밀어붙이기보다 상황에 따라 강약을 조절하는 편이 중요합니다.';
    if(score>=68){label='신강 쪽';operating='힘을 더 보태기보다 과사용을 줄이고 설기·경계·분담을 만드는 편이 중요합니다.';}
    else if(score>=58){label='중강 쪽';operating='기본 추진력은 충분하므로, 잘하는 기능을 과하게 쓰지 않도록 분배가 중요합니다.';}
    else if(score<=34){label='신약 쪽';operating='혼자 버티는 양보다 환경·지원·회복 구조를 먼저 확보할수록 실력이 안정됩니다.';}
    else if(score<=44){label='중약 쪽';operating='컨디션과 환경의 영향을 비교적 크게 받으므로, 지지대와 반복 가능한 루틴이 중요합니다.';}
    return {score,label,dm,res,out,wealth,officer,monthEl:me,season,rootWeight,rootScore,operating,
      evidence:`월령 ${me||'-'} · 통근 ${(roots(c)||[]).length}곳 · 동류 ${p[dm]||0}% · 인성오행 ${p[res]||0}% · 식상오행 ${p[out]||0}% · 재성오행 ${p[wealth]||0}% · 관성오행 ${p[officer]||0}%`};
  }

  function climateAssessment(c){
    const p=pct(c), season=seasonOf(c);
    const tempSeason={봄:5,여름:24,가을:-5,겨울:-24}[season]||0;
    const moistureSeason={봄:10,여름:-10,가을:-12,겨울:14}[season]||0;
    const temp=(p.화||0)-(p.수||0)+tempSeason;
    const moisture=(p.수||0)+(p.목||0)-(p.화||0)-(p.금||0)+moistureSeason;
    const tempLabel=temp>=28?'열이 강한 편':temp<=-28?'차가운 편':'한열이 중간에 가까움';
    const moistureLabel=moisture>=24?'습윤 쪽':moisture<=-24?'건조 쪽':'조습이 중간에 가까움';
    let operating='';
    if(temp>=28)operating='속도와 자극을 더 올리기보다, 멈춤·정리·식히는 시간을 일정에 넣는 편이 좋습니다.';
    else if(temp<=-28)operating='준비만 길어지지 않도록 작은 실행과 표현을 먼저 만들어 열을 붙이는 편이 좋습니다.';
    else operating='한쪽으로 몰아가기보다 일과 회복의 리듬을 일정하게 유지하는 편이 좋습니다.';
    if(moisture>=24)operating+=' 생각과 감정이 오래 머물 수 있으니 마감 기준을 눈에 보이게 정해두는 것이 도움이 됩니다.';
    else if(moisture<=-24)operating+=' 결과와 기준만 남기기보다 감정·관계·휴식의 여백을 일부러 확보하는 것이 도움이 됩니다.';
    return {temp,moisture,tempLabel,moistureLabel,operating,
      evidence:`${season||'-'} 계절 · 화 ${p.화||0}% ↔ 수 ${p.수||0}% · 목 ${p.목||0}% ↔ 금 ${p.금||0}%`};
  }

  function hiddenGod(c,key){
    const p=c?.pillars?.[key], arr=p?.hidden||p?.hiddenStems||p?.jijanggan||[];
    if(!Array.isArray(arr)||!arr.length)return '';
    const x=arr.slice().sort((a,b)=>(Number(b?.weight)||0)-(Number(a?.weight)||0))[0];
    return x?.god||'';
  }
  function placementSummary(c){
    const y=c?.pillars?.year?.god||'', m=c?.pillars?.month?.god||'', h=c?.pillars?.hour?.god||'';
    const dayHidden=hiddenGod(c,'day'), monthHidden=hiddenGod(c,'month'), hourHidden=hiddenGod(c,'hour');
    const pos=[
      y?`년간 ${y}`:'',
      m?`월간 ${m}`:'',
      dayHidden?`일지 본기 ${dayHidden}`:'',
      h?`시간 ${h}`:'',
      monthHidden?`월지 본기 ${monthHidden}`:'',
      hourHidden?`시지 본기 ${hourHidden}`:''
    ].filter(Boolean);
    return {year:y,month:m,hour:h,dayHidden,monthHidden,hourHidden,text:pos.join(' · ')||'십성 위치 정보 없음'};
  }

  function godPositionMeaning(god,position){
    const g=GOD[god]||GOD.일간;
    const pos={
      year:'외부 첫인상과 초기 환경에서',
      month:'사회·직업·반복되는 책임에서',
      dayHidden:'가까운 관계와 사적인 생활 반응에서',
      hour:'장기 계획과 혼자 있을 때의 관심에서'
    }[position]||'일상에서';
    return `${pos} ${josa(g.core,'이/가')} 먼저 켜지기 쉽고, 잘 쓰면 ${g.asset}, 과해지면 ${g.trap}으로 바뀔 수 있습니다.`;
  }

  function patternSignatures(c){
    const s=strengthAssessment(c), cl=climateAssessment(c), a=sorted(c), hi=a[0]||['목',20], lo=a[a.length-1]||['수',20], mg=monthGod(c), pg=placementSummary(c);
    const rel=relationList(c), tension=rel.filter(x=>['충','형','해','파'].includes(x?.type)).length;
    const out=[
      {name:'자동 기능',text:`${hi[0]} ${hi[1]}%의 ${josa(EL_WORD[hi[0]].asset,'은/는')} 생각보다 먼저 켜지는 편입니다.`},
      {name:'에너지 운용',text:`일간 지지력은 ${s.label}으로 읽혀, ${s.operating}`},
      {name:'사회 모드',text:`월주의 ${josa(mg,'은/는')} ${josa(GOD[mg]?.core||mg,'을/를')} 사회적 역할에서 반복시키기 쉽습니다.`}
    ];
    if(pg.dayHidden && pg.dayHidden!==mg)out.push({name:'공적/사적 차이',text:`사회에서는 ${mg}, 가까운 관계에서는 ${pg.dayHidden}의 작동이 더 먼저 보여 겉과 속의 반응 차이가 생길 수 있습니다.`});
    else if(tension)out.push({name:'관계 긴장',text:`원국의 충·형·해·파가 ${tension}개 보여, 참는 동안에는 조용하지만 한계를 넘으면 수정 폭이 커질 수 있습니다.`});
    else out.push({name:'보완 과제',text:`${lo[0]} ${lo[1]}% 기능은 자동보다 의식적인 구조가 필요합니다.`});
    if(cl.tempLabel!=='한열이 중간에 가까움'||cl.moistureLabel!=='조습이 중간에 가까움')
      out.push({name:'조후 리듬',text:`${cl.tempLabel}·${cl.moistureLabel}이라, ${cl.operating}`});
    return out.slice(0,4);
  }

  function pillarFromKo(ko){
    const s=String(ko||'').trim();if(s.length<2||!Engine?.STEMS||!Engine?.BRANCHES||!Engine?.pillarName)return null;
    const si=Engine.STEMS.indexOf(s[0]), bi=Engine.BRANCHES.indexOf(s[1]);
    if(si<0||bi<0)return null;
    try{return Engine.pillarName(si,bi)}catch(_e){return null}
  }
  function relationSummaryForTransit(c,transit,label){
    if(!transit)return {list:[],text:`${josa(label,'과/와')} 원국의 교차 관계를 계산하지 못했습니다.`};
    try{
      const list=[];
      const ps=c?.pillars||{};
      PILLARS.forEach(key=>{
        const p=ps[key]; if(!p)return;
        const pStem=Number(p.stemIndex), pBranch=Number(p.branchIndex);
        const tStem=Number(transit.stemIndex), tBranch=Number(transit.branchIndex);
        if(STEM_COMBINE[pStem]===tStem) list.push({type:'천간합',label:LABEL[key],key});
        if(BRANCH_COMBINE[pBranch]===tBranch) list.push({type:'육합',label:LABEL[key],key});
        if(BRANCH_CLASH[pBranch]===tBranch) list.push({type:'충',label:LABEL[key],key});
        if(BRANCH_HARM[pBranch]===tBranch) list.push({type:'해',label:LABEL[key],key});
        if(BRANCH_BREAK[pBranch]===tBranch) list.push({type:'파',label:LABEL[key],key});
        if(PUNISH.some(([a,b])=>(pBranch===a&&tBranch===b)||(pBranch===b&&tBranch===a)) || (pBranch===tBranch&&SELF_PUNISH.has(pBranch)))
          list.push({type:'형',label:LABEL[key],key});
      });
      const natalBranches=new Set(PILLARS.map(k=>ps[k]?.branchIndex).filter(v=>Number.isInteger(v)));
      TRIADS.forEach(t=>{
        if(t.idx.includes(Number(transit.branchIndex))){
          const all=new Set([...natalBranches,Number(transit.branchIndex)]);
          if(t.idx.every(x=>all.has(x)))list.push({type:'삼합',label:t.name,key:'triad'});
        }
      });
      if(!list.length)return {list,text:`${josa(label,'이/가')} 원국과 만드는 강한 합·충·형·파·해가 두드러지지 않습니다.`};
      const uniq=[],seen=new Set();
      list.forEach(x=>{const k=`${x.type}|${x.label}`;if(!seen.has(k)){seen.add(k);uniq.push(x);}});
      const text=uniq.slice(0,8).map(r=>r.type==='삼합'?`${label} 포함 ${r.label}`:`${label} ↔ ${r.label} ${r.type}`).join(' · ');
      return {list:uniq,text};
    }catch(_e){return {list:[],text:`${label} 교차 관계 계산 중 예외가 발생했습니다.`}}
  }

  function currentYearDetail(c,year=new Date().getFullYear()){
    if(typeof Engine.flowForDate!=='function')return null;
    try{
      const now=new Date();
      const useCurrent=year===now.getFullYear();
      const m=useCurrent?now.getMonth()+1:7;
      const d=useCurrent?now.getDate():1;
      return Engine.flowForDate(year,m,d,c?.pillars?.day?.stemIndex,12,0,{dayBoundary:c?.input?.dayBoundary||'23'});
    }catch(_e){return null}
  }
  function timingCross(c){
    const year=new Date().getFullYear(), lk=currentLuck(c), yf=currentYearDetail(c,year);
    const luckP=pillarFromKo(lk?.ko), yearP=yf?.pillars?.year||null;
    const lr=relationSummaryForTransit(c,luckP,lk?`대운 ${lk.ko}`:'대운');
    const yr=relationSummaryForTransit(c,yearP,`${year}년 ${yearP?.ko||''}`.trim());
    return {year,lk,yf,luckP,yearP,luckRelations:lr,yearRelations:yr};
  }


  const STEM_COMBINE={0:5,5:0,1:6,6:1,2:7,7:2,3:8,8:3,4:9,9:4};
  const BRANCH_COMBINE={0:1,1:0,2:11,11:2,3:10,10:3,4:9,9:4,5:8,8:5,6:7,7:6};
  const BRANCH_CLASH={0:6,6:0,1:7,7:1,2:8,8:2,3:9,9:3,4:10,10:4,5:11,11:5};
  const BRANCH_HARM={0:7,7:0,1:6,6:1,2:5,5:2,3:4,4:3,8:11,11:8,9:10,10:9};
  const BRANCH_BREAK={0:9,9:0,1:4,4:1,2:11,11:2,3:6,6:3,5:8,8:5,7:10,10:7};
  const PUNISH=[[2,5],[5,8],[8,2],[1,10],[10,7],[7,1],[0,3]];
  const SELF_PUNISH=new Set([4,6,9,11]);
  const TRIADS=[
    {idx:[8,0,4],name:'신·자·진 수국'},
    {idx:[2,6,10],name:'인·오·술 화국'},
    {idx:[5,9,1],name:'사·유·축 금국'},
    {idx:[11,3,7],name:'해·묘·미 목국'}
  ];
  const HALF_COMBINE=[[8,0],[0,4],[2,6],[6,10],[5,9],[9,1],[11,3],[3,7]];

  function esc(s){return BaseExpert.esc?BaseExpert.esc(s):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function finalJong(word){
    const x=String(word||'').trim();if(!x)return 0;
    const c=x.charCodeAt(x.length-1);
    return c>=0xAC00&&c<=0xD7A3?((c-0xAC00)%28):0;
  }
  function hasBatchim(word){return finalJong(word)!==0;}
  function josa(word,pair){const [a,b]=String(pair).split('/');return `${word}${hasBatchim(word)?a:b}`;}
  function euro(word){const jong=finalJong(word);return `${word}${(!jong||jong===8)?'로':'으로'}`;}
  function nameOf(c){return String(c?.input?.name||'사용자');}
  function pct(c){
    if(BaseExpert.pct){try{return BaseExpert.pct(c)}catch(_e){}}
    const src=c?.elCount||{},t=Object.values(src).reduce((a,b)=>a+(Number(b)||0),0)||1,o={};
    ELS.forEach(e=>o[e]=Math.round((Number(src[e]||0)/t)*100));return o;
  }
  function sorted(c){const p=pct(c);return ELS.slice().sort((a,b)=>p[b]-p[a]).map(e=>[e,p[e]]);}
  function currentLuck(c,year=new Date().getFullYear()){
    const age=year-Number(c?.input?.year||year);
    return (c?.luck||[]).find(x=>age>=Number(x.fromAgeExact??x.fromAge)&&age<Number(x.toAgeExact??(Number(x.toAge)+1)))
      ||(c?.luck||[]).find(x=>age>=Number(x.fromAge)&&age<=Number(x.toAge))||null;
  }
  function yearGod(c,year=new Date().getFullYear()){
    try{
      const now=new Date();
      const useCurrent=year===now.getFullYear();
      const m=useCurrent?now.getMonth()+1:7;
      const d=useCurrent?now.getDate():1;
      const f=Engine.flowForDate&&Engine.flowForDate(year,m,d,c?.pillars?.day?.stemIndex,12,0,{dayBoundary:c?.input?.dayBoundary||'23'});
      return f?.gods?.year||'';
    }catch(_e){return ''}
  }
  function evidence(c,extra=[]){
    const rows=[c?.pillars?.day?.ko?`일주 ${c.pillars.day.ko}`:null,c?.pillars?.month?.ko?`월주 ${c.pillars.month.ko}`:null,...extra].filter(Boolean);
    return [...new Set(rows)].join(' · ');
  }
  function section(eyebrow,title,body,c,extra=[]){return {eyebrow,title,body,evidence:evidence(c,extra)};}
  function seasonOf(c){return SEASON[c?.pillars?.month?.branch]||'';}
  function dmEl(c){return c?.dayMaster?.el||c?.pillars?.day?.stemEl||'';}
  function monthGod(c){return c?.pillars?.month?.god||'일간';}
  function dayStage(c){return c?.twelveStages?.day||'';}
  function roots(c){return Array.isArray(c?.extras?.roots)?c.extras.roots:[];}
  function relationList(c){return Array.isArray(c?.relations)?c.relations:[];}
  function relationText(c){
    const rel=relationList(c);
    if(!rel.length)return '원국 내부의 강한 합·충·형·파·해 신호가 두드러지지 않습니다.';
    return rel.slice(0,6).map(r=>`${r.aLabel||''}–${r.bLabel||''} ${r.type}`).join(' · ');
  }
  function strengthShape(c){
    const r=roots(c).length, p=pct(c), el=dmEl(c), dmPct=p[el]||0, s=seasonOf(c);
    if(r>=2||dmPct>=35)return '자기 기운을 안쪽에서 다시 끌어올릴 지지대가 비교적 분명한 편';
    if(r===1||dmPct>=24)return '필요한 순간에는 자기 힘을 회복하지만 환경의 영향을 꽤 받는 편';
    return '혼자 버티기보다 환경·관계·생활 리듬의 도움을 받을 때 안정되는 편';
  }
  function monthClimate(c){
    const el=dmEl(c),s=seasonOf(c);
    return CLIMATE[el]?.[s]||`${s||'계절'}의 ${el||'일간'} 기운`;
  }
  function stageMeaning(stage){
    const m={장생:'시작과 회복이 빠른 자리',목욕:'경험과 감각이 크게 움직이는 자리',관대:'자기 방식과 존재감이 커지는 자리',건록:'실제 실행력과 자립성이 강해지는 자리',제왕:'힘을 강하게 밀어붙이는 자리',쇠:'힘을 분배하고 조절하는 법이 필요한 자리',병:'과사용보다 회복이 중요한 자리',사:'정리와 선택이 중요한 자리',묘:'감정과 생각이 안으로 축적되기 쉬운 자리',절:'기존 방식을 끊고 새 틀을 만드는 자리',태:'가능성을 품고 준비하는 자리',양:'보호와 축적을 통해 힘을 키우는 자리'};
    return m[stage]||'에너지의 사용 단계를 보는 자리';
  }
  const LOW_HABIT={
    목:'새 가능성을 열어두고 다음 선택지를 작게 시험하는 습관',
    화:'감정과 의도를 제때 표현하고 몸을 움직이는 습관',
    토:'생활 리듬과 마감선을 일정하게 유지하는 습관',
    금:'거절·우선순위·마감 기준을 분명히 적는 습관',
    수:'멈춰서 정보를 정리하고 회복 시간을 확보하는 습관'
  };
  const DAY_REL={
    자:'가까워질수록 말보다 분위기와 타이밍을 오래 읽는 편',
    축:'신뢰가 쌓이기 전에는 천천히 보고, 한 번 책임지면 쉽게 놓지 않는 편',
    인:'관계에서도 정체보다 함께 움직이고 새 장면을 만드는 쪽에 힘이 나는 편',
    묘:'말투·거리·미묘한 반응 차이를 빠르게 읽고 조율하려는 편',
    진:'감정 하나보다 관계 전체의 맥락과 앞으로의 방향을 함께 보는 편',
    사:'마음이 움직이면 반응이 빨라지고 애매한 상태를 오래 두기 어려운 편',
    오:'좋고 싫음이 비교적 선명하며 관계에서도 반응과 표현의 온도를 중요하게 보는 편',
    미:'가까운 사람의 필요를 자기 일처럼 챙기다가 부담을 늦게 알아차리기 쉬운 편',
    신:'상황 변화에 빠르게 맞추지만 관계에서도 효율과 현실성을 확인하려는 편',
    유:'작은 약속과 반복 행동을 세밀하게 보고 신뢰 여부를 판단하는 편',
    술:'내 사람이라는 확신이 생기면 오래 지키지만 기준을 어긴 일도 오래 기억하는 편',
    해:'상대의 사정과 감정을 넓게 받아들이는 대신 자기 결론이 늦게 드러날 수 있는 편'
  };
  const GOD_DECISION={
    비견:'남의 정답보다 내 기준이 서야 움직입니다. 권한이 내게 있으면 빠르고, 간섭이 많으면 결정 자체보다 주도권에 예민해질 수 있습니다.',
    겁재:'기회가 보이면 먼저 움직이는 편입니다. 경쟁·비교가 끼면 속도가 더 빨라지므로 큰 결정일수록 손익과 회복 비용을 따로 적는 게 좋습니다.',
    식신:'급하게 뒤집기보다 반복 가능한지를 확인한 뒤 결정합니다. 한번 생활화된 방식은 안정적이지만 바꿔야 할 시점을 늦출 수 있습니다.',
    상관:'비효율이나 모순이 보이면 기존 방식부터 고치려 합니다. 문제 발견 속도는 빠르지만, 반대 의견을 충분히 들은 뒤 결론을 내릴 장치가 필요합니다.',
    편재:'사람·기회·현장 정보가 들어오면 판단 속도가 빨라집니다. 가능성을 크게 볼 수 있어 상한선과 철수 조건을 먼저 정해두는 편이 안전합니다.',
    정재:'유지 가능한지, 비용이 얼마인지, 반복해도 괜찮은지를 보고 결정합니다. 안정성이 장점이지만 이미 투자한 시간 때문에 오래 붙드는 함정은 경계해야 합니다.',
    편관:'압박이 클수록 오히려 결론이 선명해질 수 있습니다. 다만 긴장 상태를 정상 컨디션으로 착각하면 센 선택만 반복할 수 있습니다.',
    정관:'책임·규칙·신뢰가 명확할 때 결정을 잘합니다. “해야 하니까”와 “내가 원하는가”를 분리하면 선택의 질이 올라갑니다.',
    편인:'남들이 놓치는 변수부터 확인합니다. 직관이 빠른 만큼 추측과 확인된 사실을 별도로 적어두면 판단이 더 정교해집니다.',
    정인:'충분히 이해하고 준비된 뒤 움직이려 합니다. 준비의 질은 높지만 시작 조건을 너무 높게 잡지 않는 것이 중요합니다.',
    일간:'내가 납득할 수 있는 기준이 서야 움직이는 편입니다.'
  };
  const GOD_CONTACT={
    비견:'연락의 양보다 서로 각자의 시간을 존중하는지가 중요', 겁재:'반응 속도와 함께하는 활동감이 중요',
    식신:'꾸준한 안부와 일상의 안정감이 중요', 상관:'솔직하고 답답하지 않은 대화가 중요',
    편재:'재미·활동·즉흥적인 교류가 중요', 정재:'약속한 연락과 예측 가능한 리듬이 중요',
    편관:'문제가 생겼을 때 회피하지 않고 바로 대응하는지가 중요', 정관:'약속·예의·일관된 태도가 중요',
    편인:'혼자 생각할 시간과 독특한 관심사를 존중하는지가 중요', 정인:'안심할 수 있는 설명과 정서적 안정감이 중요',
    일간:'서로의 기본 리듬을 존중하는지가 중요'
  };
  const ELEMENT_STRESS={
    목:'할 일과 가능성을 계속 늘리다가 무엇부터 끝낼지가 흐려지는 순서',
    화:'반응과 말의 속도가 먼저 빨라지고, 그 다음 작은 자극에도 결론을 크게 내리는 순서',
    토:'일을 더 떠안고 버티다가, 어느 순간 더는 손대고 싶지 않아지는 순서',
    금:'기준과 수정 포인트가 점점 촘촘해지고, 결국 자신과 타인 모두를 피곤하게 만드는 순서',
    수:'정보와 생각을 더 모으다가 결론이 늦어지고, 마지막에는 연락·행동 자체를 줄이는 순서'
  };
  const BRANCH_LIVING={
    자:'혼자 정리하는 시간과 밤·수면 리듬',축:'생활비·집안일처럼 반복되는 책임의 지속성',인:'외출·활동·새로운 계획을 시작하는 빈도',묘:'공간의 분위기와 말투·예절 같은 작은 기준',
    진:'집·계약·장기 계획처럼 여러 조건을 동시에 맞추는 일',사:'속도·일정 변경·즉각적인 반응',오:'표현 방식·외출·사람 만나는 에너지',미:'돌봄·가족·반려동물처럼 챙길 일이 늘어나는 영역',
    신:'효율·동선·실용적인 역할 분담',유:'정리·청결·돈의 기록처럼 기준이 눈에 보이는 영역',술:'약속·원칙·가족 경계처럼 지켜야 한다고 느끼는 규칙',해:'혼자 있는 시간·감정 흡수·회복 공간'
  };
  function lowHabit(el){return LOW_HABIT[el]||`${el} 기능을 의식적으로 보완하는 습관`;}
  function relationStats(c){
    const rel=relationList(c), positive=rel.filter(x=>['천간합','육합','삼합'].includes(x?.type)), negative=rel.filter(x=>['충','형','해','파'].includes(x?.type));
    const leadNeg=negative[0]?.type||'',leadPos=positive[0]?.type||'';
    return {rel,positive,negative,leadNeg,leadPos};
  }
  function relationInterpret(c){
    const x=relationStats(c), branch=c?.pillars?.day?.branch||'';
    let close=DAY_REL[branch]||'가까운 관계에서 반복 행동과 역할 균형을 중요하게 보는 편';
    if(x.leadNeg==='충') close+='입니다. 충이 겹치면 오래 참기보다 어느 순간 방향을 크게 바꾸고 싶어질 수 있습니다.';
    else if(x.leadNeg==='형') close+='입니다. 형이 겹치면 같은 불편을 머릿속에서 반복 점검하며 스스로 압박하기 쉽습니다.';
    else if(x.leadNeg==='해') close+='입니다. 해가 겹치면 겉으로 큰 싸움이 없어도 말하지 않은 서운함이 남기 쉽습니다.';
    else if(x.leadNeg==='파') close+='입니다. 파가 겹치면 합의했던 방식이 자주 수정되면서 피로를 느낄 수 있습니다.';
    else if(x.leadPos) close+=`이고, ${x.leadPos}은 한번 맺은 관계를 바로 버리기보다 맞춰보려는 힘을 보탭니다.`;
    else close+='입니다. 강한 합충보다 실제 반복 행동이 만족도를 더 크게 좌우합니다.';
    return close;
  }
  function climateScene(cl){
    if(cl.tempLabel==='열이 강한 편'&&cl.moistureLabel==='건조 쪽')return '속도·결론·성과가 먼저 서기 쉬워, 멈추는 시간과 감정 설명이 의도적으로 필요합니다.';
    if(cl.tempLabel==='열이 강한 편')return '반응 에너지가 빨리 올라오므로 중요한 대화는 열이 가장 높을 때 결론내리지 않는 편이 좋습니다.';
    if(cl.tempLabel==='차가운 편'&&cl.moistureLabel==='습윤 쪽')return '생각과 감정이 안에서 오래 머물 수 있어, 작은 실행과 마감 시점을 밖으로 꺼내는 것이 중요합니다.';
    if(cl.tempLabel==='차가운 편')return '준비와 관찰이 길어질 수 있어, 완벽한 확신보다 작은 시작으로 온도를 올리는 편이 좋습니다.';
    if(cl.moistureLabel==='습윤 쪽')return '상황을 충분히 흡수하는 장점이 있지만 감정·정보를 오래 품지 않도록 종료 기준이 필요합니다.';
    if(cl.moistureLabel==='건조 쪽')return '판단과 정리가 빠른 대신 관계·휴식의 여백이 줄기 쉬워, 빈 시간을 일부러 남기는 편이 좋습니다.';
    return '한열과 조습이 한쪽으로 크게 쏠리지 않아, 환경보다 반복 습관이 컨디션 차이를 더 크게 만들 수 있습니다.';
  }
  function strengthScene(s){
    if(s.score>=68)return '기본 힘은 충분한 편이라 더 밀어붙이는 것보다 힘을 빼고 나누는 기술이 실력 차이를 만듭니다.';
    if(s.score>=58)return '필요할 때 추진력을 끌어올릴 수 있지만, 계속 최고 출력으로 버티면 효율이 급격히 떨어질 수 있습니다.';
    if(s.score<=34)return '혼자 버티는 시간을 늘리는 것보다 사람·환경·루틴 같은 외부 지지대를 먼저 만드는 편이 유리합니다.';
    if(s.score<=44)return '능력 자체보다 컨디션과 환경의 영향을 크게 받기 쉬워, 시작 전 지지 구조를 확인하는 것이 중요합니다.';
    return '힘을 쓰는 것과 쉬는 것의 차이가 극단적이지 않아, 일정한 리듬과 우선순위가 가장 큰 변수입니다.';
  }
  function workScene(el,mg){
    const a={목:'새 판을 만들거나 성장 경로를 설계할 때',화:'설득·표현·현장 대응처럼 즉각적인 반응이 필요할 때',토:'운영·관리·마무리처럼 끝까지 책임질 때',금:'기준·품질·정리·선별이 필요할 때',수:'정보·사람·흐름을 연결하고 복잡한 상황을 읽을 때'}[el]||'강점을 실제 결과로 바꿀 때';
    return `${a} ${GOD[mg]?.asset||'자기 강점'}이 붙으면 성과가 가장 선명해집니다.`;
  }
  function moneyLeak(el,mg){
    const byEl={목:'새 계획·도구·배움에 선투자하면서',화:'편의·경험·관계의 분위기를 살리는 지출이 빨라지면서',토:'가족·생활·고정비를 계속 떠안으면서',금:'품질·완성도 기준을 높이느라 비용이 커지면서',수:'정보·비교·대기 비용이 길어지면서'}[el]||'바쁜 시기에';
    const trap=GOD[mg]?.trap||'기준이 흐려지는 것';
    return `${byEl} 돈이 새기 쉽고, ${trap}이 겹치면 “필요해서 쓴 돈”과 “감정 때문에 쓴 돈”의 경계가 흐려질 수 있습니다.`;
  }
  function dayPrivate(c){return hiddenGod(c,'day')||monthGod(c);}

  function primaryMechanism(c){
    const n=nameOf(c), arr=sorted(c), hi=arr[0]||['목',20], lo=arr[arr.length-1]||['수',20], mg=monthGod(c), g=GOD[mg]||GOD.일간;
    return {
      hi,lo,mg,g,
      thesis:`${n}님의 핵심은 ${josa(EL_WORD[hi[0]].asset,'이/가')} 자동으로 켜지는 반면, ${josa(EL_WORD[lo[0]].low,'은/는')} 의식적으로 만들어야 한다는 데 있습니다.`
    };
  }
  function dedupeSections(rows){
    const seen=new Set();
    return rows.map(s=>{
      const paras=String(s.body||'').split(/\n\n+/).filter(Boolean).filter(p=>{
        const k=p.replace(/\s+/g,' ').replace(/[“”"'.,·]/g,'').trim();
        if(k.length<24)return true;
        if(seen.has(k))return false;seen.add(k);return true;
      });
      return {...s,body:paras.join('\n\n')};
    });
  }

  function coreSections(c){
    const n=nameOf(c), arr=sorted(c), hi=arr[0]||['목',20], lo=arr[arr.length-1]||['수',20];
    const el=dmEl(c), mg=monthGod(c), g=GOD[mg]||GOD.일간, season=seasonOf(c), stage=dayStage(c), r=roots(c), lk=currentLuck(c), yg=yearGod(c);
    const high=EL_WORD[hi[0]], strength=strengthAssessment(c), climateInfo=climateAssessment(c), placement=placementSummary(c), signatures=patternSignatures(c);
    const rs=relationStats(c), rel=relationText(c), branch=c?.pillars?.day?.branch||'', privateGod=dayPrivate(c), privateProfile=GOD[privateGod]||GOD.일간;
    const low=lowHabit(lo[0]), climateLine=climateScene(climateInfo), strengthLine=strengthScene(strength);
    const rows=[];

    const diagnosisTitle = hi[0]===el && hi[1]>=35
      ? `${n}님은 힘이 약한 사람이 아니라, 자기 방식의 출력이 강해서 ‘언제 멈출지’가 더 중요한 사람입니다.`
      : strength.score<=44
        ? `${n}님은 능력이 없는 사람이 아니라, 환경이 맞을 때와 안 맞을 때의 성능 차이가 큰 사람에 가깝습니다.`
        : `${n}님은 ${high.asset}을 중심으로 성과를 만들되, ${lo[0]} 기능이 빠지면 강점의 유지력이 짧아지는 사람입니다.`;
    rows.push(section('핵심 진단',diagnosisTitle,
      `${n}님의 중심은 ${c?.pillars?.day?.ko||c?.dayMaster?.stem||'일간'}이고 ${c?.pillars?.month?.branch||''}월(${season})에 태어났습니다. ${el} 일간이 ${season}의 환경을 만났고, 오행은 ${hi[0]} ${hi[1]}%가 가장 높고 ${lo[0]} ${lo[1]}%가 가장 낮습니다.\n\n그래서 자동으로 잘하는 일은 ${high.asset} 쪽이고, 일부러 챙겨야 하는 것은 ${low}입니다. ${strengthLine}\n\n${climateLine} 이 두 조건을 함께 보면 ${n}님은 ‘강하다/약하다’ 한 단어보다, 어느 상황에서 출력이 올라가고 어느 순간 과사용으로 넘어가는지를 보는 편이 훨씬 정확합니다.`,
      c,[`${hi[0]} ${hi[1]}%`,`${lo[0]} ${lo[1]}%`,`일간 지지력 ${strength.label} ${strength.score}/100`]
    ));

    rows.push(section('구조를 뜯어보면',
      `${n}님의 겉반응은 ${mg}, 가까운 관계의 속반응은 ${privateGod} 쪽에서 더 잘 드러날 수 있습니다.`,
      `월주 ${c?.pillars?.month?.ko||'-'}의 ${josa(mg,'은/는')} 사회에서 ${josa(g.core,'을/를')} 반복시키고, 잘 쓰면 ${g.asset}이 됩니다. 반면 일지 본기 ${josa(privateGod,'은/는')} 사적인 관계에서 ${josa(privateProfile.core,'을/를')} 먼저 켜기 쉽습니다.\n\n${placement.month!==placement.dayHidden&&placement.dayHidden?`밖에서는 ${mg}답게 움직이는데 가까운 사람 앞에서는 ${privateGod}의 반응이 나와, 스스로도 “왜 일할 때와 관계에서 내가 다르지?”라고 느낄 수 있습니다.`:`공적 역할과 사적 반응의 차이가 아주 크기보다 같은 기준이 여러 장면에서 반복되는 편입니다.`}\n\n통근은 ${r.length}곳이고 일지 12운성은 ${stage||'-'}입니다. ${r.length>=2?'내부 지지대가 여러 곳이라 한번 방향을 잡으면 쉽게 꺾이지 않는 편입니다.':r.length===1?'필요한 순간 자기 힘을 다시 끌어올릴 뿌리는 있지만 환경 영향도 함께 받습니다.':'직접 통근이 약한 만큼 컨디션·사람·생활 구조가 성능에 미치는 영향이 큽니다.'}`,
      c,[`월주 ${mg}`,`일지 본기 ${privateGod}`,`통근 ${r.length}곳`,stage?`12운성 ${stage}`:null]
    ));

    rows.push(section('일간 지지력 · 신강신약 참고',
      `${n}님의 일간 지지력은 ${strength.label}(${strength.score}/100)으로 읽힙니다.`,
      `${strength.evidence}. 이 값은 길흉 점수가 아니라 월령·통근·동류·인성·식상·재성·관성을 한꺼번에 비교해 “내 힘을 얼마나 오래 유지하는가”를 보기 위한 내부 지표입니다.\n\n${strengthLine} 특히 ${hi[0]} ${hi[1]}%와 ${lo[0]} ${lo[1]}%의 간격이 ${Math.abs(hi[1]-lo[1])}%p라, ${Math.abs(hi[1]-lo[1])>=25?'잘하는 기능과 덜 자동적인 기능의 차이가 뚜렷한 편입니다.':'한 기능만으로 밀어붙이기보다 상황에 따라 여러 기능을 섞어 쓰는 편입니다.'}\n\n같은 ${c?.dayMaster?.stem||''} 일간이라도 이 지지력과 월령이 달라지면 실제 반응은 크게 달라집니다. 그래서 일간 하나만 보고 성격을 고정하지 않습니다.`,
      c,[strength.evidence]
    ));

    rows.push(section('조후 · 한난조습',
      `${n}님의 명식은 ${climateInfo.tempLabel}·${climateInfo.moistureLabel}입니다.`,
      `${climateInfo.evidence}. 이 조합에서는 ${climateLine}\n\n${climateInfo.temp>=28?`열이 높은 편이라 생각보다 행동·표현이 먼저 나가는 장면이 생길 수 있습니다.`:climateInfo.temp<=-28?`차가운 편이라 겉으로 조용해도 안에서는 정보를 충분히 모은 뒤 움직이려는 경향이 강해질 수 있습니다.`:`한열이 극단적으로 치우치지 않아 상황에 따라 속도를 바꾸는 여지가 있습니다.`} ${climateInfo.moisture>=24?'습윤도가 높아 감정·정보를 오래 품는 편이므로 “언제 끝낼지”를 정하는 기술이 중요합니다.':climateInfo.moisture<=-24?'건조도가 높아 정리와 결론은 빠르지만 관계의 여백을 의도적으로 남길 필요가 있습니다.':'조습도 중간이라 습관과 생활 리듬이 컨디션을 더 크게 좌우합니다.'}`,
      c,[climateInfo.evidence]
    ));

    rows.push(section('십성이 어디에 놓였는가',
      `${n}님은 십성의 종류보다 “어디에서 그 기능이 켜지는가”를 같이 봐야 설명력이 올라갑니다.`,
      `${placement.text}.\n\n${placement.year?godPositionMeaning(placement.year,'year'):''}${placement.month?`\n\n${godPositionMeaning(placement.month,'month')}`:''}${placement.dayHidden?`\n\n${godPositionMeaning(placement.dayHidden,'dayHidden')}`:''}${placement.hour?`\n\n${godPositionMeaning(placement.hour,'hour')}`:''}\n\n${placement.month&&placement.dayHidden&&placement.month!==placement.dayHidden?`특히 ${josa(`월간 ${placement.month}`,'과/와')} 일지 본기 ${josa(placement.dayHidden,'이/가')} 달라, 사회에서는 ${josa(GOD[placement.month]?.asset||placement.month,'을/를')} 쓰면서도 가까운 관계에서는 ${GOD[placement.dayHidden]?.trap||placement.dayHidden}이 먼저 튀어나올 수 있습니다.`:`핵심 십성이 여러 자리에서 비슷한 방향을 가리켜, 상황이 달라도 같은 방식으로 문제를 푸는 경향이 강할 수 있습니다.`}`,
      c,[placement.text]
    ));

    rows.push(section('이 명식의 핵심 패턴',
      `${n}님에게 반복될 가능성이 높은 패턴은 네 가지로 압축됩니다.`,
      signatures.map((x,i)=>`${i+1}. ${x.name} · ${x.text}`).join('\n\n')+`\n\n이 중 가장 먼저 확인할 것은 “${josa(hi[0],'을/를')} 너무 많이 쓰는 순간”과 “${lo[0]} 기능을 뒤늦게 챙기는 순간”입니다. 둘이 같은 시기에 겹치면 강점이 피로로 뒤집히는 속도가 빨라집니다.`,
      c,[`중심 ${hi[0]} ${hi[1]}%`,`보완 ${lo[0]} ${lo[1]}%`,`월주 ${mg}`]
    ));

    rows.push(section('실력이 터지는 조건',
      `${workScene(hi[0],mg)} ${n}님의 강점은 아무 환경에서나 같은 세기로 나오지 않습니다.`,
      `${strength.score>=58?'결정권이나 결과 확인이 가능한 자리에서는 속도가 붙습니다.':'지원 구조와 역할 범위가 명확할수록 집중력이 안정됩니다.'} ${mg==='편인'||mg==='정인'?'깊이 파고드는 시간과 혼자 정리할 여지가 있어야 질이 올라갑니다.':mg==='편재'||mg==='겁재'?'현장 변화와 사람 반응이 보일수록 기회 포착력이 살아납니다.':mg==='정관'||mg==='편관'?'권한·기준·책임선이 선명할수록 긴장을 성과로 바꾸기 쉽습니다.':'반복 가능한 결과물을 직접 확인할 수 있을 때 강점이 오래 갑니다.'}\n\n반대로 ${g.trap}이 반복되는 환경에서는 장점 자체가 소모 장치가 됩니다. ${hi[0]}의 ${high.over}까지 겹치면 “잘해서 더 맡는 사람”이 되기 쉬우므로, 시작 전에 권한·기한·끝나는 조건을 정하는 것이 중요합니다.`,
      c,[`${hi[0]} 우세`,`${mg} 사회 작동`,`지지력 ${strength.label}`]
    ));

    rows.push(section('약점과 함정',
      `${n}님의 약점은 부족함보다 과잉 사용에서 더 잘 드러납니다.`,
      `${josa(hi[0],'이/가')} 강해질수록 ${high.over}이 나타나기 쉽습니다. 반면 ${lo[0]} ${lo[1]}%는 ${low}이 자동으로 나오지 않을 수 있다는 뜻에 가깝습니다.\n\n${ELEMENT_STRESS[hi[0]]}. 여기에 ${mg}의 함정인 “${g.trap}”이 겹치면, 본인은 문제를 해결하고 있다고 느끼는데 실제로는 선택권을 조금씩 잃을 수 있습니다.\n\n따라서 단점 교정의 핵심은 성격을 바꾸는 것이 아니라, ${low}을 일정·돈·대화 규칙처럼 눈에 보이는 장치로 만드는 것입니다.`,
      c,[`${hi[0]} ${hi[1]}%`,`${lo[0]} ${lo[1]}%`,`${mg} 함정`]
    ));

    rows.push(section('감정이 켜지는 방식',
      `${relationInterpret(c)}`,
      `일지는 ${c?.pillars?.day?.ko||'-'}이고, 원국 관계 신호는 ${rel}. ${rs.negative.length?`긴장 신호가 ${rs.negative.length}개 보여 감정이 쌓였을 때 수정 폭이 커질 수 있는 근거가 있습니다.`:`강한 긴장 신호가 많지 않아 실제 관계에서는 말투·역할 기대·생활 리듬이 더 중요한 변수가 됩니다.`}\n\n${privateGod!==mg?`사회에서는 ${mg}의 방식으로 처리하던 사람이 가까운 관계에서는 ${privateGod}의 방식으로 반응할 수 있어, 상대가 “밖에서는 잘하면서 왜 나한테는 다르지?”라고 느낄 수 있습니다.`:`사회와 사적인 관계의 처리 방식이 비교적 비슷해, 기준이 분명하다는 장점과 융통성이 줄어드는 단점이 함께 나타날 수 있습니다.`}\n\n감정을 오래 참는지 빨리 말하는지를 좋고 나쁨으로 보지 말고, 본인이 결론 내린 시점과 상대에게 알린 시점의 간격을 확인하는 것이 핵심입니다.`,
      c,[`일주 ${c?.pillars?.day?.ko||'-'}`,rel]
    ));

    const misread = hi[0]==='화'?'성급하거나 감정적인 사람으로':hi[0]==='금'?'차갑고 까다로운 사람으로':hi[0]==='토'?'고집이 세고 변화를 싫어하는 사람으로':hi[0]==='수'?'생각만 많고 결정이 느린 사람으로':'계획만 벌이고 산만한 사람으로';
    rows.push(section('남들이 오해하기 쉬운 점',
      `${n}님은 ${misread} 보일 수 있지만, 실제 작동 원인은 그보다 복합적입니다.`,
      `${hi[0]} ${hi[1]}%가 먼저 보이기 때문에 주변에서는 ${high.asset}을 성격 전체로 받아들이기 쉽습니다. 하지만 안쪽에서는 ${mg}의 ${g.core}, 일지의 ${privateProfile.core}, 그리고 ${lo[0]} 보완 문제까지 동시에 돌아갑니다.\n\n그래서 익숙한 분야에서는 매우 빠른데 책임이 오래 남는 선택에서는 갑자기 신중해지거나, 반대로 사람 문제에서는 오래 고민하다가 일에서는 단번에 자르는 식의 차이가 생길 수 있습니다.\n\n이 차이를 줄이는 가장 좋은 방법은 속도를 억지로 통일하는 것이 아니라 “지금 내가 뭘 확인하는 중인지”를 짧게 설명하는 것입니다.`,
      c,[`${hi[0]} ${hi[1]}%`,`월주 ${mg}`,`일지 본기 ${privateGod}`]
    ));

    rows.push(section('무너질 때 나타나는 순서',
      `${n}님은 ${ELEMENT_STRESS[hi[0]]}가 과사용의 대표 신호가 될 수 있습니다.`,
      `초기에는 ${high.asset}을 더 많이 씁니다. 그 다음 ${g.trap}이 나타나고, 마지막에는 ${low}을 챙길 여유가 줄어듭니다.\n\n${climateInfo.temp>=28?'이때 반응 속도가 더 빨라지면 작은 일에도 큰 결론을 내리고 싶어질 수 있습니다.':climateInfo.temp<=-28?'이때 말수와 행동이 줄고 머릿속 검토만 길어지면 이미 피로가 많이 쌓였을 가능성이 있습니다.':'이때 평소보다 일의 우선순위가 자주 바뀌거나 반복 행동이 깨지는지를 보면 과사용을 빨리 알아차릴 수 있습니다.'}\n\n회복 신호는 의욕보다 생활 변화에서 먼저 찾는 편이 낫습니다. 평소와 다른 수면·식사·연락·지출·정리 습관이 두 가지 이상 겹치면, 성격 문제로 몰기보다 출력 조절이 필요한 시점으로 보는 식입니다.`,
      c,[`${hi[0]} 과사용`,`${mg} 함정`,`${lo[0]} 보완`]
    ));

    const relScene=rs.leadNeg==='충'?'서운함이 누적되면 작은 수정보다 관계의 방식 자체를 바꾸고 싶어질 수 있습니다.':rs.leadNeg==='형'?'서운한 장면을 머릿속에서 여러 번 되짚으며 “왜 반복되지?”라는 피로가 커질 수 있습니다.':rs.leadNeg==='해'?'겉으로는 넘어가도 말하지 않은 불편이 남아 다음 장면의 해석에 영향을 줄 수 있습니다.':rs.leadNeg==='파'?'한번 정한 약속이나 계획이 자주 수정될 때 신뢰 피로가 커질 수 있습니다.':'사건 하나보다 반복되는 행동과 역할 균형을 더 오래 보는 편일 수 있습니다.';
    rows.push(section('생활 장면으로 번역하면',
      `${n}님의 명식은 세 장면에서 특히 차이가 선명하게 보일 수 있습니다.`,
      `① 일이 몰릴 때 · ${strength.score>=58?'처음에는 집중력과 처리량이 오르지만, “내가 하면 빠르다”가 반복되면 역할이 고정되는지 확인해야 합니다.':'업무량을 늘리기 전에 도움을 요청할 대상과 마감선을 먼저 정했을 때 결과가 안정됩니다.'}\n\n② 가까운 사람이 서운하게 했을 때 · ${relScene}\n\n③ 큰돈·큰결정 앞에서 · ${GOD_DECISION[mg]||GOD_DECISION.일간}\n\n이 세 장면 중 둘 이상에서 같은 패턴이 반복된다면, 그 부분이 ${n}님에게 실제로 가장 자주 켜지는 운용 방식일 가능성이 큽니다.`,
      c,[`지지력 ${strength.label}`,`월주 ${mg}`,rel]
    ));

    rows.push(section('결정 방식',
      `${n}님의 결정 방식은 ${mg}의 작동과 ${hi[0]} 우세가 함께 만듭니다.`,
      `${GOD_DECISION[mg]||GOD_DECISION.일간}\n\n여기에 ${hi[0]}의 ${high.asset}이 붙어 ${hi[0]==='화'||hi[0]==='금'?'기준이 서는 순간 결론 속도가 빠른 편입니다.':hi[0]==='수'||hi[0]==='목'?'선택지와 맥락을 넓게 본 뒤 방향을 정하려는 편입니다.':'실제 유지 가능성과 책임 범위를 확인한 뒤 움직이려는 편입니다.'}\n\n큰 선택에서는 “6개월 뒤 유지 가능한가 / 실패했을 때 되돌릴 수 있는가 / 이 책임이 정말 내 몫인가” 세 질문을 쓰면 명식의 장점을 살리면서 과잉을 줄일 수 있습니다.`,
      c,[`월주 ${mg}`,`${hi[0]} ${hi[1]}%`]
    ));

    rows.push(section('일과 돈',
      `${n}님은 ${g.asset}을 실제 수입 구조로 바꿀 때 돈의 흐름이 안정되기 쉽습니다.`,
      `${workScene(hi[0],mg)} 그래서 직업에서는 “무슨 업종인가”보다 ${hi[0]}의 강점을 결과물·기술·고객·성과 중 어떤 형태로 반복할 수 있는지가 더 중요합니다.\n\n돈이 새는 쪽은 반대입니다. ${moneyLeak(hi[0],mg)} 특히 약한 ${lo[0]} 기능은 ${low}으로 보완해야 합니다.\n\n${mg==='편재'||mg==='겁재'?'수입과 지출의 속도가 함께 빨라질 수 있으니 상한선을 숫자로 정하는 방식이 잘 맞습니다.':mg==='정재'||mg==='식신'?'안정 구조를 잘 만들 수 있지만 오래된 고정비를 관성으로 유지하지 않는지 정기 점검이 중요합니다.':mg==='편인'||mg==='정인'?'배움·장비·준비 비용이 실제 수입으로 연결되는 시점을 확인하면 과투자를 줄일 수 있습니다.':'책임 때문에 대신 부담하는 비용이 생기지 않도록 개인비용과 공동비용을 분리하는 것이 중요합니다.'}`,
      c,[`월주 ${mg}`,`${hi[0]} ${hi[1]}%`,`${lo[0]} ${lo[1]}%`]
    ));

    rows.push(section('연애와 가까운 관계',
      `${n}님은 ${DAY_REL[branch]||'관계의 반복 행동과 역할 균형을 중요하게 보는 편'}입니다.`,
      `${GOD_CONTACT[privateGod]||GOD_CONTACT[mg]||'서로의 리듬을 존중하는지가 중요'}합니다. ${rs.negative.length?`원국에 ${rs.negative.map(x=>x.type).slice(0,3).join('·')} 신호가 있어, 서운함이 생겼을 때 “그 사건 하나”보다 그동안 쌓인 패턴 전체를 평가하기 쉬울 수 있습니다.`:`강한 긴장 관계가 적어, 실제 만족도는 사주상의 충돌보다 연락·돈·시간·경계의 합의에 더 좌우될 가능성이 큽니다.`}\n\n${hi[0]==='토'||branch==='미'||branch==='축'?'돌봄이나 책임을 사랑의 증명으로 바꾸면 한쪽이 오래 떠안는 구조가 되기 쉬우니 “도와주는 범위”를 먼저 정하는 게 좋습니다.':hi[0]==='화'||branch==='사'||branch==='오'?'마음이 올라올 때 표현이 빨라질 수 있으므로, 감정의 크기와 관계 전체에 대한 결론을 분리하는 것이 중요합니다.':hi[0]==='금'||branch==='유'||branch==='술'?'약속의 정확성과 반복 행동을 크게 보기 때문에 작은 약속 위반이 쌓이기 전에 기준을 말로 맞추는 편이 좋습니다.':'상대의 사정을 넓게 읽다가 자기 요구를 늦게 말할 수 있으므로, 이해와 동의를 같은 것으로 취급하지 않는 것이 중요합니다.'}\n\n잘 맞는 관계는 애정 표현 방식이 똑같은 관계보다, ${n}님이 자동으로 떠맡는 역할을 상대가 당연하게 여기지 않는 관계에 가깝습니다.`,
      c,[`일주 ${c?.pillars?.day?.ko||'-'}`,`일지 본기 ${privateGod}`,rel]
    ));

    try{
      const sg=BaseExpert.starGroups?BaseExpert.starGroups(c):null;
      const starRows=(sg?.rows||[]).slice().sort((a,b)=>(b.count||0)-(a.count||0)).slice(0,3);
      if(starRows.length){
        const names=starRows.map(x=>`${x.name}${x.count>1?`×${x.count}`:''}`).join(' · ');
        rows.push(section('보조 신호로 다시 확인되는 패턴',
          `현재 눈에 띄는 보조 신호는 ${names}입니다. 앞의 구조를 확인하는 보조 근거로만 사용합니다.`,
          `${n}님의 경우 이 신살 이름들 자체보다 ${hi[0]} 우세, 월주 ${mg}, 관계 신호와 같은 방향을 가리키는지가 중요합니다. ${starRows[0]?.name==='도화살'||starRows[0]?.name==='홍염살'?'사람의 시선과 관계 반응이 눈에 띌 수 있지만, 호감과 장기 관계의 안정성은 별개로 봅니다.':starRows[0]?.name==='화개살'||starRows[0]?.name==='귀문관살'?'혼자 깊게 몰입하거나 미묘한 차이를 읽는 성향을 보조할 수 있지만, 불안이나 고립을 확정하는 근거로 쓰지 않습니다.':'신살 하나로 사건이나 성격을 확정하지 않고 실제 행동과 다른 구조가 반복해서 같은 방향을 가리킬 때만 참고합니다.'}`,
          c,[`보조 신호 ${names}`]
        ));
      }
    }catch(_e){}

    if(lk||yg){
      const tx=timingCross(c);
      const luckHit=tx.luckRelations.list?.[0], yearHit=tx.yearRelations.list?.[0];
      rows.push(section('지금의 시간축',
        `${n}님의 현재 운은 “무슨 십성이 왔나”보다 원국의 어느 자리를 건드리는지가 핵심입니다.`,
        `${lk?`현재 대운 ${lk.ko}(${lk.god})${hasBatchim(lk.god)?'은':'는'} ${josa(GOD[lk.god]?.core||'특정 역할','을/를')} 장기 주제로 올립니다.`:''}${yg?` ${tx.year}년 천간 십성은 ${yg}입니다.`:''}\n\n대운 교차 · ${tx.luckRelations.text}\n세운 교차 · ${tx.yearRelations.text}\n\n${luckHit||yearHit?`현재는 ${luckHit?.label||yearHit?.label||'원국 특정 자리'} 쪽이 직접 건드려져, 그 영역의 기존 방식을 그대로 유지하기보다 조정해야 한다는 체감이 커질 수 있습니다.`:'강한 직접 충돌보다 기본 십성 주제가 반복되는 시기라, 사건 하나보다 생활의 누적 변화를 보는 편이 맞습니다.'} 합은 연결·조정 압력을, 충·형·해·파는 기존 방식을 수정해야 하는 압력을 상징적으로 봅니다. 사건을 확정해서 예언하지는 않습니다.`,
        c,[lk?`대운 ${lk.ko} ${lk.god}`:null,yg?`${tx.year} 세운 ${yg}`:null,tx.luckRelations.text,tx.yearRelations.text]
      ));
    }

    const task = strength.score>=68
      ? `${n}님의 핵심 과제는 더 강해지는 것이 아니라, 강한 ${hi[0]} 기능을 어디에서 멈추고 누구와 나눌지를 먼저 정하는 것입니다.`
      : strength.score<=44
        ? `${n}님의 핵심 과제는 혼자 버티는 양을 늘리는 것이 아니라, 실력을 안정적으로 꺼낼 수 있는 환경과 지지대를 먼저 확보하는 것입니다.`
        : `${n}님의 핵심 과제는 상황마다 출력이 달라지는 이유를 알고, ${hi[0]}의 장점과 ${lo[0]} 보완을 같은 계획 안에 넣는 것입니다.`;
    rows.push(section('이 사주의 핵심 과제',task,
      `${hi[0]} ${hi[1]}%가 주는 ${high.asset}은 분명한 자산입니다. 다만 ${lo[0]} ${lo[1]}% 쪽의 ${low}이 빠지면 그 자산을 오래 유지하기 어렵습니다.\n\n${mg}의 장점인 ${g.asset}을 살리되 함정인 ${g.trap}이 시작되는 시점을 자기 기준으로 정해두는 것이 중요합니다. ${climateLine}\n\n결국 ${n}님에게 필요한 질문은 “더 할 수 있나?” 하나가 아니라 “이 선택이 내 강점을 살리면서도 회복 가능하게 남아 있나?”입니다.`,
      c,[`${hi[0]} ${hi[1]}% ↔ ${lo[0]} ${lo[1]}%`,`지지력 ${strength.label}`,`월주 ${mg}`]
    ));
    return dedupeSections(rows);
  }

  function personalitySections(c){
    const all=coreSections(c);
    return all.filter(s=>['핵심 진단','구조를 뜯어보면','약점과 함정','남들이 오해하기 쉬운 점','무너질 때 나타나는 순서','감정이 켜지는 방식','보조 신호로 다시 확인되는 패턴','이 사주의 핵심 과제'].includes(s.eyebrow));
  }
  function fieldSections(c){
    const all=coreSections(c);
    return all.filter(s=>['실력이 터지는 조건','결정 방식','일과 돈','연애와 가까운 관계','지금의 시간축'].includes(s.eyebrow));
  }
  function personModel(c){
    const m=primaryMechanism(c), lk=currentLuck(c), yg=yearGod(c), rel=relationList(c);
    return {
      version:'deep-v3-qa3',
      core_thesis:m.thesis,
      structure:{
        day_pillar:c?.pillars?.day?.ko||null,
        month_pillar:c?.pillars?.month?.ko||null,
        month_season:seasonOf(c)||null,
        day_master_element:dmEl(c)||null,
        month_god:m.mg,
        strongest:{element:m.hi[0],percent:m.hi[1]},
        weakest:{element:m.lo[0],percent:m.lo[1]},
        roots:roots(c).length,
        day_stage:dayStage(c)||null,
        strength:strengthAssessment(c),
        climate:climateAssessment(c),
        ten_god_placement:placementSummary(c),
        signatures:patternSignatures(c)
      },
      mechanisms:[
        `${m.hi[0]} 기능은 자동으로 강하게 켜지고 ${m.lo[0]} 기능은 의식적으로 구조화해야 함`,
        `${m.mg}의 ${josa(m.g.core,'이/가')} 사회적 역할에서 반복될 가능성`,
        relationText(c)
      ],
      strengths:[EL_WORD[m.hi[0]].asset,m.g.asset],
      risks:[EL_WORD[m.hi[0]].over,m.g.trap,`${m.lo[0]} 보완을 늦출 때 경계와 회복이 약해질 수 있음`],
      operating_rules:[
        '책임을 맡기 전에 결정권과 종료 기준을 확인할 것',
        '감정이 쌓인 뒤 결론을 통보하기보다 사실-감정-요청 순서로 말할 것',
        '큰 결정은 6개월 유지 가능성과 회복 비용까지 계산할 것'
      ],
      current_timing:{luck:lk?`${lk.ko} ${lk.god}`:null,year_god:yg||null},
      relation_signal_types:[...new Set(rel.map(x=>x?.type).filter(Boolean))]
    };
  }

  // ---------------- 궁합: 구조 vs 구조 ----------------
  function tg(a,b){
    if(typeof Engine.tenGod!=='function')return '-';
    try{return Engine.tenGod(a?.pillars?.day?.stemIndex,b?.pillars?.day?.stemIndex)||'-';}catch(_e){return '-';}
  }
  function profile(c){
    const a=sorted(c),p=pct(c);
    return {name:nameOf(c),p,hi:a[0]||['목',20],lo:a[a.length-1]||['수',20],dm:dmEl(c),stem:c?.pillars?.day?.stem||'',branch:c?.pillars?.day?.branch||'',month:c?.pillars?.month?.branch||'',season:seasonOf(c),mg:monthGod(c),stage:dayStage(c),strength:strengthAssessment(c),climate:climateAssessment(c),placement:placementSummary(c)};
  }
  function crossHits(a,b){
    const hits=[];
    const A=PILLARS.map(k=>({side:'A',k,p:a?.pillars?.[k]})).filter(x=>x.p);
    const B=PILLARS.map(k=>({side:'B',k,p:b?.pillars?.[k]})).filter(x=>x.p);
    const push=(type,x,y,layer,weight)=>hits.push({type,ak:x.k,bk:y.k,layer,weight,desc:`${LABEL[x.k]} ${layer==='천간'?x.p.stem:x.p.branch} ↔ ${LABEL[y.k]} ${layer==='천간'?y.p.stem:y.p.branch}`});
    for(const x of A)for(const y of B){
      const w=(x.k==='day'&&y.k==='day')?4:((x.k==='day'||y.k==='day')?2:1);
      if(STEM_COMBINE[x.p.stemIndex]===y.p.stemIndex)push('천간합',x,y,'천간',w);
      if(BRANCH_COMBINE[x.p.branchIndex]===y.p.branchIndex)push('육합',x,y,'지지',w);
      if(BRANCH_CLASH[x.p.branchIndex]===y.p.branchIndex)push('충',x,y,'지지',w);
      if(BRANCH_HARM[x.p.branchIndex]===y.p.branchIndex)push('해',x,y,'지지',w);
      if(BRANCH_BREAK[x.p.branchIndex]===y.p.branchIndex)push('파',x,y,'지지',w);
      if(PUNISH.some(([u,v])=>(x.p.branchIndex===u&&y.p.branchIndex===v)||(x.p.branchIndex===v&&y.p.branchIndex===u))||(x.p.branchIndex===y.p.branchIndex&&SELF_PUNISH.has(x.p.branchIndex)))push('형',x,y,'지지',w);
      if(HALF_COMBINE.some(([u,v])=>(x.p.branchIndex===u&&y.p.branchIndex===v)||(x.p.branchIndex===v&&y.p.branchIndex===u)))push('반합',x,y,'지지',Math.max(1,w-1));
    }
    const all=[...A,...B];
    for(const t of TRIADS){
      const branches=new Set(all.map(x=>x.p.branchIndex));
      const sides=new Set(all.filter(x=>t.idx.includes(x.p.branchIndex)).map(x=>x.side));
      if(t.idx.every(i=>branches.has(i))&&sides.size===2){
        hits.push({type:'교차삼합',weight:4,layer:'지지',desc:`두 명식을 합쳐 ${t.name} 성립`});
      }
    }
    return hits;
  }
  function bestHits(hits,positive=true){
    const types=positive?new Set(['천간합','육합','반합','교차삼합']):new Set(['충','형','해','파']);
    return hits.filter(h=>types.has(h.type)).sort((a,b)=>b.weight-a.weight).slice(0,5);
  }
  function hitSummary(list){return list.length?list.map(h=>`${h.type}(${h.desc})`).join(' · '):'강하게 겹치는 신호 없음';}
  function seasonContrast(A,B){
    if(A.season===B.season)return `두 사람 모두 ${A.season}의 계절감을 공유해 기본 반응 속도가 닮은 편입니다.`;
    return `${josa(A.name+'님','은/는')} ${A.month}월(${A.season}), ${josa(B.name+'님','은/는')} ${B.month}월(${B.season})이라 같은 일간이라도 힘을 쓰는 온도와 속도가 다를 수 있습니다.`;
  }
  function elementLink(a,b){
    if(!a||!b)return {kind:'unknown',text:'두 사람의 오행 사용 방식 차이를 봅니다.'};
    if(a===b)return {kind:'same',text:`둘 다 ${a} 기능을 기본 언어처럼 써서 이해는 빠르지만, 같은 방식이 겹치면 주도권이나 과사용도 함께 커질 수 있습니다.`};
    if(elAt(a,1)===b)return {kind:'aFeeds',text:`${josa(a,'이/가')} ${josa(b,'을/를')} 생하는 흐름이라, 앞사람의 표현·행동이 뒷사람의 기능을 살리는 식으로 연결될 수 있습니다. 다만 한쪽만 계속 에너지를 공급하는 역할이 되지 않는지 봐야 합니다.`};
    if(elAt(b,1)===a)return {kind:'bFeeds',text:`${josa(b,'이/가')} ${josa(a,'을/를')} 생하는 흐름이라, 뒷사람의 반응이 앞사람의 기능을 살리는 식으로 연결될 수 있습니다. 받는 쪽과 주는 쪽이 고정되면 피로가 생길 수 있습니다.`};
    if(elAt(a,2)===b)return {kind:'aControls',text:`${josa(a,'과/와')} ${josa(b,'은/는')} 제어 관계가 걸려, 한쪽의 기준이 다른 쪽에게는 정리로 느껴질 수도 있고 통제로 느껴질 수도 있습니다.`};
    if(elAt(b,2)===a)return {kind:'bControls',text:`${josa(b,'과/와')} ${josa(a,'은/는')} 제어 관계가 걸려, 서로가 상대의 속도나 선택을 조정하려 들 때 긴장이 커질 수 있습니다.`};
    return {kind:'other',text:`${josa(a,'과/와')} ${b}의 기능이 서로 다른 방향으로 작동해, 역할 분담이 되면 보완이지만 같은 장면에서 동시에 주도하려 하면 피로가 생길 수 있습니다.`};
  }
  function signalMeaning(h){
    if(!h)return '';
    const map={천간합:'생각·의사결정·표현의 접점이 생기기 쉬운 신호',육합:'일상에서 다시 맞춰보려는 접착력이 생기기 쉬운 신호',반합:'특정 장면에서 부분적으로 호흡이 맞는 신호',교차삼합:'두 명식을 합쳤을 때만 완성되는 큰 흐름',충:'속도·방향·생활 방식을 크게 수정하게 만드는 긴장',형:'같은 문제를 반복 점검하거나 서로를 압박하기 쉬운 긴장',해:'겉으로 크게 부딪히지 않아도 서운함·오해가 남기 쉬운 긴장',파:'약속·계획·기대가 자주 수정되며 피로가 생기기 쉬운 긴장'};
    return `${josa(h.type,'은/는')} ${map[h.type]||'관계의 특정 접점을 보여주는 신호'}입니다.`;
  }
  function contactNeed(P){return GOD_CONTACT[P.mg]||'연락 횟수보다 서로의 기본 리듬을 존중하는지가 중요';}
  function recoveryNeed(P){
    if(P.hi[0]==='화')return '말과 행동의 속도를 먼저 낮춰야 회복이 시작되는 편';
    if(P.hi[0]==='수')return '혼자 생각을 정리할 시간이 있어야 다시 대화가 가능한 편';
    if(P.hi[0]==='금')return '무엇이 잘못됐고 다음에는 어떻게 할지 기준이 정리돼야 풀리는 편';
    if(P.hi[0]==='토')return '말보다 실제 행동과 역할이 다시 안정돼야 마음이 풀리는 편';
    return '앞으로 어떻게 바꿀지 새 방향이 보여야 감정이 정리되는 편';
  }
  function moneyRole(P){
    const high={목:'새 기회·배움·확장 비용을 먼저 보는 쪽',화:'경험·편의·관계 분위기에 돈을 빠르게 쓰는 쪽',토:'생활비·고정비·돌봄 비용을 책임지는 쪽',금:'예산·기준·비용 대비 효과를 따지는 쪽',수:'정보를 모으고 타이밍을 보며 지출을 늦추는 쪽'}[P.hi[0]];
    return high||'현실적인 비용 구조를 확인하는 쪽';
  }
  function livingNeed(P){return BRANCH_LIVING[P.branch]||'반복되는 생활 규칙';}
  function compatTitleDifference(A,B,sameStem){return sameStem?`같은 ${A.stem} 일간인데도 반응이 갈리는 이유`:`${A.stem} 일간과 ${B.stem} 일간의 반응 속도 차이`;}

  function compatBuild(a,b,score){
    const A=profile(a),B=profile(b), hits=crossHits(a,b), pos=bestHits(hits,true), neg=bestHits(hits,false);
    const aSees=tg(a,b),bSees=tg(b,a), sameStem=A.stem&&A.stem===B.stem, sameEl=A.dm&&A.dm===B.dm;
    const lkA=currentLuck(a),lkB=currentLuck(b), year=new Date().getFullYear(), ygA=yearGod(a,year),ygB=yearGod(b,year);
    const nA=A.name,nB=B.name, elLink=elementLink(A.dm,B.dm), gap=Math.abs(A.strength.score-B.strength.score);
    const leadPos=pos[0]||null, leadNeg=neg[0]||null;
    const sections=[];

    sections.push({id:'core',category:'summary',title:'이 관계의 본질',body:
      `${sameStem?`${nA}님과 ${nB}님은 같은 ${A.stem} 일간이지만, 같은 글자라는 사실보다 월령과 지지력 차이가 더 중요합니다.`:`${nA}님은 ${A.stem}(${A.dm}), ${nB}님은 ${B.stem}(${B.dm}) 일간이라 기본적으로 에너지를 쓰는 언어가 다릅니다.`}\n\n${elLink.text} ${seasonContrast(A,B)}\n\n지지력은 ${nA}님 ${A.strength.label} ${A.strength.score}/100, ${nB}님 ${B.strength.label} ${B.strength.score}/100로 ${gap}점 차이입니다. ${gap>=20?'한쪽은 밀어붙여도 버티는 시간이 길고 다른 쪽은 환경·회복의 영향을 더 크게 받을 수 있어, 같은 일정도 피로도가 다르게 느껴질 수 있습니다.':'기본 체력감 차이가 극단적이지 않아 누가 더 강하냐보다 각자 어떤 기능을 먼저 쓰는지가 중요합니다.'}\n\n${leadPos?`붙는 쪽의 대표 신호는 ${leadPos.type}(${leadPos.desc})이고, `:''}${leadNeg?`긴장 쪽의 대표 신호는 ${leadNeg.type}(${leadNeg.desc})입니다.`:'직접적인 강한 충돌 신호는 두드러지지 않습니다.'} 이 관계는 점수 하나보다 “어떤 장면에서 붙고 어떤 장면에서 수정이 필요한가”를 나눠 보는 편이 정확합니다.`,
      evidence:`일간 ${A.stem}/${B.stem} · 월령 ${A.month}/${B.month} · 지지력 ${A.strength.score}/${B.strength.score} · 중심 오행 ${A.hi[0]}/${B.hi[0]}`});

    sections.push({id:'difference',category:'summary',title:compatTitleDifference(A,B,sameStem),body:
      `${sameStem?`같은 ${A.stem} 일간이어도 ${nA}님은 ${A.season} 월령·${A.strength.label}, ${nB}님은 ${B.season} 월령·${B.strength.label}이라 반응 속도가 같을 이유는 없습니다.`:`${nA}님의 ${josa(A.dm,'은/는')} ${EL_WORD[A.hi[0]].asset} 쪽을 먼저 쓰고, ${nB}님의 ${josa(B.dm,'은/는')} ${EL_WORD[B.hi[0]].asset} 쪽으로 반응하기 쉽습니다.`}\n\n조후도 ${nA}님은 ${A.climate.tempLabel}·${A.climate.moistureLabel}, ${nB}님은 ${B.climate.tempLabel}·${B.climate.moistureLabel}입니다. ${A.climate.temp-B.climate.temp>20?`${nA}님 쪽이 상대적으로 반응 온도가 높아 먼저 말하거나 움직일 가능성이 큽니다.`:B.climate.temp-A.climate.temp>20?`${nB}님 쪽이 상대적으로 반응 온도가 높아 먼저 말하거나 움직일 가능성이 큽니다.`:'온도 차이보다 월주 십성과 중심 오행의 차이가 실제 속도를 더 크게 만듭니다.'}\n\n따라서 “왜 나처럼 생각하지 않지?”보다 “누가 먼저 결론을 만들고, 누가 더 오래 흡수하고, 언제 공유해야 서로가 갑작스럽지 않은가”를 맞추는 것이 이 궁합의 핵심입니다.`,
      evidence:`지지력 ${nA} ${A.strength.label} ${A.strength.score} ↔ ${nB} ${B.strength.label} ${B.strength.score} · 조후 ${A.climate.tempLabel}/${B.climate.tempLabel}`});

    sections.push({id:'why',category:'summary',title:`${nA}님은 ${aSees}, ${nB}님은 ${bSees}로 상대를 읽습니다`,body:
      `${nA}님이 ${nB}님의 일간을 만날 때 ${aSees}의 ${josa(GOD[aSees]?.core||aSees,'이/가')} 켜지고, ${nB}님이 ${nA}님을 볼 때는 ${bSees}의 ${josa(GOD[bSees]?.core||bSees,'이/가')} 켜집니다. 이건 상대의 성격 판정이 아니라 “내가 그 사람에게 기대하거나 반응하기 쉬운 역할”을 뜻합니다.\n\n${aSees===bSees?`서로 비슷한 역할 언어로 상대를 보기 때문에 처음 이해는 빠를 수 있지만, 기대가 겹쳐 누가 먼저 양보할지가 애매해질 수 있습니다.`:`서로가 상대에게 기대하는 역할이 다르기 때문에 한쪽은 ${GOD[aSees]?.asset||aSees}을 원하고, 다른 쪽은 ${GOD[bSees]?.asset||bSees}을 기대하는 식의 엇갈림이 생길 수 있습니다.`}\n\n${leadPos?`${signalMeaning(leadPos)} 이 역할 기대와 합 신호가 같은 방향으로 겹치면 초반 친밀감이나 “이 사람은 뭔가 통한다”는 체감이 커질 수 있습니다.`:'강한 합보다 실제 대화와 반복 행동이 상대 역할 기대를 채우는지가 더 중요합니다.'}`,
      evidence:`교차 십신 ${nA}→${nB} ${aSees} · ${nB}→${nA} ${bSees}`});

    const crossTriad=pos.find(h=>h.type==='교차삼합');
    sections.push({id:'bond',category:'summary',title:leadPos?`${leadPos.type}에서 보이는 두 사람의 접착점`:'강한 합보다 생활에서 만들어야 하는 접착점',body:
      `${leadPos?`${signalMeaning(leadPos)} 실제 교차 위치는 ${leadPos.desc}입니다.`:'두 명식을 직접 겹쳤을 때 천간합·육합·반합·교차삼합이 강하게 앞서지 않습니다. 그래서 “운명적으로 붙는다”보다 생활 속에서 신뢰를 만드는 방식이 더 중요합니다.'}\n\n${crossTriad?`${crossTriad.desc}은 한 사람의 원국만으로 완성되지 않고 두 명식을 합쳤을 때 만들어집니다. 이런 신호는 함께 있을 때 특정 역할이나 관심사가 더 강하게 살아나는 보조 근거로 볼 수 있습니다.`:leadPos?.type==='육합'?`육합은 일상의 친숙함과 다시 맞춰보려는 성향으로 체감되기 쉬워, 싸운 뒤에도 생활의 연결고리가 남을 수 있습니다.`:leadPos?.type==='천간합'?`천간합은 생각·표현·판단의 접점으로 체감되기 쉬워, 중요한 이야기를 할 때 예상보다 빨리 합의점이 생길 수 있습니다.`:'합 신호가 있더라도 관계의 질을 자동으로 보장하지는 않습니다.'}\n\n붙는 힘이 강할수록 “좋아서 붙는 것”과 “익숙해서 못 놓는 것”을 구분해야 합니다. 이 신호가 장점이 되는 조건은 서로 다른 방식으로 해준 일을 실제로 인정할 때입니다.`,
      evidence:`긍정 교차 · ${hitSummary(pos)}`});

    sections.push({id:'friction',category:'love',title:leadNeg?`${leadNeg.type}에서 드러나는 가장 큰 마찰`:'큰 충돌보다 속도·역할 차이가 만드는 마찰',body:
      `${leadNeg?`${signalMeaning(leadNeg)} 실제 교차 위치는 ${leadNeg.desc}입니다.`:'직접적인 충·형·해·파가 강하게 앞서지 않아, 갈등은 오행 사용법과 기대 역할에서 생길 가능성이 큽니다.'}\n\n${nA}님은 ${A.hi[0]}의 ${EL_WORD[A.hi[0]].asset}을 먼저 쓰고 ${nB}님은 ${B.hi[0]}의 ${EL_WORD[B.hi[0]].asset}을 먼저 씁니다. ${elLink.kind==='same'?'같은 기능을 동시에 강하게 쓰면 서로 “내 방식이 더 자연스럽다”고 느끼기 쉽습니다.':elLink.kind==='aControls'||elLink.kind==='bControls'?'제어 관계까지 있어 조언이 쉽게 간섭으로 번역될 수 있습니다.':'이 차이를 역할로 나누면 보완이지만, 같은 문제를 동시에 자기 방식으로 처리하려 하면 마찰이 커집니다.'}\n\n${leadNeg?.type==='충'?'충이 강한 장면에서는 결론의 방향과 타이밍을 동시에 바꾸려 하지 말고, 먼저 “지금 바꿀 것 하나”만 합의하는 편이 좋습니다.':leadNeg?.type==='형'?'형이 강한 장면에서는 누가 잘못했는지 반복 검토하기보다 같은 문제가 다시 생기지 않을 규칙 하나를 정하는 편이 좋습니다.':leadNeg?.type==='해'?'해가 강한 장면에서는 말하지 않은 추측을 사실처럼 굳히지 말고 서로의 의도를 직접 확인해야 합니다.':leadNeg?.type==='파'?'파가 강한 장면에서는 변경된 약속을 다시 명확히 적어 “알아서 이해했겠지”를 줄여야 합니다.':'갈등 때는 성격 평가보다 처리 순서를 맞추는 것이 우선입니다.'}`,
      evidence:`긴장 교차 · ${hitSummary(neg)}`});

    sections.push({id:'communication',category:'love',title:`싸움이 시작될 때 두 사람의 첫 반응`,body:
      `${nA}님은 피곤할수록 ${A.hi[0]}의 ${EL_WORD[A.hi[0]].over} 쪽으로, ${nB}님은 ${B.hi[0]}의 ${EL_WORD[B.hi[0]].over} 쪽으로 기울 수 있습니다. 그래서 같은 싸움에서도 ${nA}님은 ${recoveryNeed(A)}, ${nB}님은 ${recoveryNeed(B)}입니다.\n\n${gap>=20?`지지력 차이가 ${gap}점이라 한 사람이 대화를 계속할 수 있는 시점에도 다른 사람은 이미 회복 시간이 필요할 수 있습니다.`:'지지력 차이는 크지 않지만 조후와 월주 십성 차이 때문에 말하는 타이밍은 달라질 수 있습니다.'}\n\n이 관계의 대화 규칙은 “당장 끝내기”보다 각자 언제 다시 이야기할 수 있는지를 구체적으로 잡는 게 맞습니다. ${leadNeg?`${leadNeg.type} 신호가 있어 감정 최고점에서 관계 전체를 평가하는 말은 특히 피하는 편이 좋습니다.`:'강한 긴장 신호가 적어도 반복되는 비난 문장은 실제 관계에서 별개의 상처를 만들 수 있습니다.'}`,
      evidence:`과사용 ${A.hi[0]}/${B.hi[0]} · 지지력 차이 ${gap} · 월주 ${A.mg}/${B.mg}`});

    sections.push({id:'contact',category:'love',title:'연락과 거리감은 같은 기준으로 재면 안 됩니다',body:
      `${nA}님에게는 ${contactNeed(A)}하고, ${nB}님에게는 ${contactNeed(B)}합니다. 따라서 연락 횟수가 같아도 만족도는 다를 수 있습니다.\n\n${A.mg===B.mg?`월주 십성이 둘 다 ${A.mg}이라 기본적인 연락 기대가 닮을 수 있지만, 일지와 조후가 달라 “언제 답해야 충분한가”는 다를 수 있습니다.`:`${nA}님은 ${A.mg}에서 ${josa(GOD[A.mg]?.core||A.mg,'을/를')} 먼저 쓰고, ${nB}님은 ${B.mg}에서 ${josa(GOD[B.mg]?.core||B.mg,'을/를')} 먼저 쓰므로 한쪽은 설명을, 다른 쪽은 행동을 애정 표현으로 느끼는 식의 차이가 생길 수 있습니다.`}\n\n두 사람에게 맞는 합의는 횟수를 정하는 것보다 “바쁠 때 최소한 무엇을 알려줄지 / 혼자 있는 시간을 언제 보장할지 / 중요한 일은 어느 시간 안에 공유할지”를 정하는 방식입니다.`,
      evidence:`월주 십성 ${A.mg} ↔ ${B.mg} · 일지 ${A.branch}/${B.branch}`});

    sections.push({id:'repair',category:'love',title:'싸운 뒤 회복 속도와 필요한 증거가 다릅니다',body:
      `${nA}님은 ${recoveryNeed(A)}이고, ${nB}님은 ${recoveryNeed(B)}입니다. 한쪽이 “이제 끝났다”고 느끼는 시점과 다른 쪽이 실제로 풀리는 시점이 다를 수 있습니다.\n\n${leadNeg?`대표 긴장 신호는 ${leadNeg.type}(${leadNeg.desc})입니다. 같은 주제가 다시 나오지 않게 만드는 “다음 행동”이 화해의 핵심입니다.`:'강한 직접 충돌보다 기대 역할 차이가 중요하므로, 사과의 문구보다 상대가 원했던 역할을 이해했는지 확인하는 것이 중요합니다.'}\n\n${A.hi[0]===B.hi[0]?`둘 다 ${A.hi[0]} 기능을 강하게 써서 동시에 같은 방식으로 해결하려 들 수 있습니다. 한 사람은 말하고 한 사람은 정리하는 식으로 역할을 잠깐 나누면 속도가 오히려 빨라집니다.`:`회복 방식이 다르므로 “내가 풀렸으니 너도 풀렸겠지”를 가정하지 않는 것이 좋습니다.`}`,
      evidence:`회복 모드 ${A.hi[0]}/${B.hi[0]} · 긴장 ${hitSummary(neg.slice(0,3))}`});

    sections.push({id:'boundary',category:'marriage',title:'가족·친구·돌봄이 들어오면 누구의 책임이 커지는가',body:
      `제3자 문제가 끼면 ${nA}님에게서는 ${A.mg}의 함정인 ${josa(GOD[A.mg]?.trap||'과사용','이/가')} 과해질 수 있고, ${nB}님에게서는 ${B.mg}의 ${josa(GOD[B.mg]?.trap||'과사용','이/가')} 과해질 수 있습니다.\n\n특히 ${livingNeed(A)}를 중요하게 보는 ${nA}님과 ${livingNeed(B)}를 중요하게 보는 ${nB}님은 가족 일정·친구 부탁·반려동물·간병처럼 관계 밖의 책임이 들어올 때 우선순위가 달라질 수 있습니다.\n\n${A.lo[0]===B.lo[0]?`둘 다 ${A.lo[0]} 기능이 상대적으로 낮아 그 역할을 상대가 알아서 해주길 기대하면 공백이 생기기 쉽습니다.`:`${nA}님의 ${josa(`약한 ${A.lo[0]}`,'과/와')} ${nB}님의 ${josa(`약한 ${B.lo[0]}`,'은/는')} 서로 다른 영역이라 역할 분담으로 보완할 여지가 있습니다.`} 제3자에게 도움을 줄 때는 결정권·비용·기간 세 항목을 둘 사이에서 먼저 합의하는 편이 좋습니다.`,
      evidence:`월주 ${A.mg}/${B.mg} · 일지 ${A.branch}/${B.branch} · 약한 오행 ${A.lo[0]}/${B.lo[0]}`});

    sections.push({id:'money',category:'marriage',title:'돈과 생활비에서 역할이 고정되는 순간을 봐야 합니다',body:
      `${nA}님은 ${moneyRole(A)}, ${nB}님은 ${moneyRole(B)}에 가깝습니다. 이 차이는 잘 나누면 보완이지만 한 사람이 계속 계획하고 다른 사람이 계속 쓰는 식으로 굳으면 감정 문제로 번집니다.\n\n${A.lo[0]===B.lo[0]?`두 사람 모두 ${A.lo[0]} 기능이 낮아 ${lowHabit(A.lo[0])}이 공동 과제가 됩니다.`:`${nA}님에게 필요한 ${lowHabit(A.lo[0])}, ${nB}님에게 필요한 ${lowHabit(B.lo[0])}은 서로 다릅니다. 서로 대신해 주기보다 각자 최소 기준을 갖는 편이 오래갑니다.`}\n\n공동비용·개인비용·가족지원·돌봄비·비상금 중 반복되는 항목만이라도 숫자로 분리하면 “누가 더 사랑하니까 더 내야 하나” 같은 감정 계산을 줄일 수 있습니다.`,
      evidence:`중심 ${A.hi[0]}/${B.hi[0]} · 약한 ${A.lo[0]} ${A.lo[1]}%/${B.lo[0]} ${B.lo[1]}%`});

    sections.push({id:'marriage',category:'marriage',title:'같이 살면 취향보다 반복 규칙이 먼저 드러납니다',body:
      `${nA}님은 일지 ${A.branch}에서 ${livingNeed(A)}를, ${nB}님은 일지 ${B.branch}에서 ${livingNeed(B)}를 관계의 체감 포인트로 두기 쉽습니다. 연애할 때는 넘어가던 차이가 매일 반복되면 훨씬 크게 느껴질 수 있습니다.\n\n${leadPos?`${leadPos.type}은 맞춰갈 동력을 보탭니다.`:'강한 합이 없더라도 생활 규칙이 명확하면 충분히 안정적으로 운영할 수 있습니다.'} ${leadNeg?`${josa(leadNeg.type,'은/는')} 특히 ${leadNeg.desc} 영역에서 “원래 하던 방식”을 수정하게 만들 수 있습니다.`:'강한 충돌 신호보다 실제 습관 차이를 확인하는 것이 중요합니다.'}\n\n동거 전에는 청소·수면·외출·돈·가족·돌봄·혼자 있는 시간을 추상적으로 “잘하자”가 아니라 누가/언제/어디까지 할지 문장으로 정하는 방식이 이 두 명식에 더 맞습니다.`,
      evidence:`일주 ${a?.pillars?.day?.ko||'-'}/${b?.pillars?.day?.ko||'-'} · 월주 ${a?.pillars?.month?.ko||'-'}/${b?.pillars?.month?.ko||'-'}`});

    if(lkA||lkB||ygA||ygB){
      const txA=timingCross(a),txB=timingCross(b);
      sections.push({id:'timing',category:'summary',title:'지금은 두 사람이 같은 관계를 다르게 느낄 수 있는 시기인가',body:
        `${nA}님은 ${lkA?`${lkA.ko} 대운(${lkA.god})`:'대운 미확인'}${ygA?`·${year}년 ${ygA}`:''}, ${nB}님은 ${lkB?`${lkB.ko} 대운(${lkB.god})`:'대운 미확인'}${ygB?`·${year}년 ${ygB}`:''}의 흐름입니다.\n\n${nA}님 교차 · ${txA.luckRelations.text} / ${txA.yearRelations.text}\n${nB}님 교차 · ${txB.luckRelations.text} / ${txB.yearRelations.text}\n\n${lkA?.god===lkB?.god&&ygA===ygB?'두 사람의 큰 주제가 비슷하게 올라와 서로의 부담을 이해하기 쉬운 대신, 같은 문제에 동시에 예민해질 수 있습니다.':'각자 원국에서 건드려지는 자리와 십성 주제가 다르면 관계 자체가 나빠진 것이 아니라 에너지를 써야 하는 곳이 달라 거리감이 생길 수 있습니다.'} 현재 운은 사건 예언보다 “요즘 무엇 때문에 여유가 줄었는가”를 설명하는 보조축으로 쓰는 편이 맞습니다.`,
        evidence:`현재 ${nA} ${lkA?lkA.ko+' '+lkA.god:'-'} ↔ ${nB} ${lkB?lkB.ko+' '+lkB.god:'-'} · ${year} ${ygA||'-'}/${ygB||'-'}`});
    }

    const balance = pos.length-neg.length;
    sections.push({id:'task',category:'summary',title:'이 관계의 핵심 과제',body:
      `${balance>=2?`붙는 신호가 긴장 신호보다 많은 관계라, 친밀함을 만드는 것보다 친밀함 속에서 역할이 한쪽으로 고정되지 않게 하는 것이 더 중요합니다.`:balance<=-2?`긴장 신호가 더 눈에 띄는 관계라, 감정의 크기로 버티기보다 반복되는 마찰을 규칙으로 바꿀 수 있는지가 핵심입니다.`:`붙는 힘과 긴장이 함께 있어, 잘 맞는 부분과 수정해야 할 부분을 섞지 않는 것이 핵심입니다.`}\n\n${sameEl?`같은 ${A.dm} 계열을 기본 언어로 써 “말 안 해도 알겠지”가 생기기 쉽습니다. 닮았다는 이유로 확인을 생략하지 않는 편이 좋습니다.`:`${josa(A.dm,'과/와')} ${B.dm}의 기능이 달라 상대의 방식이 내 기준에 비효율적으로 보여도, 실제로는 내가 약한 기능을 맡고 있을 수 있습니다.`}\n\n이 관계를 오래 운영하는 질문은 하나입니다. “지금 문제는 애정 부족인가, 아니면 연락·돈·시간·돌봄·경계 중 어느 규칙이 비어 있는가?” 규칙이 비어 있다면 감정을 더 증명하기보다 그 규칙부터 합의하는 편이 낫습니다.`,
      evidence:`긍정 교차 ${pos.length} · 긴장 교차 ${neg.length} · 교차 십신 ${aSees}/${bSees}`});

    return {meta:{version:'deep-v3-qa3',aName:nA,bName:nB,score:Number.isFinite(score)?score:null,crossTenGod:{aSeesB:aSees,bSeesA:bSees},positiveSignals:pos,negativeSignals:neg,allSignals:hits},sections};
  }

  function compatPick(analysis,tab){
    const s=analysis?.sections||[];
    if(tab==='summary')return s;
    if(tab==='love')return s.filter(x=>['core','difference','why','bond','friction','communication','contact','repair','timing','task'].includes(x.id));
    if(tab==='marriage')return s.filter(x=>['core','difference','bond','friction','repair','boundary','money','marriage','timing','task'].includes(x.id));
    if(tab==='partner')return s.filter(x=>['core','difference','why','friction','communication','contact','repair','task'].includes(x.id));
    return s;
  }

  root.GuiinExpert={...BaseExpert,fullSections:coreSections,personalitySections,fieldSections,personModel,pct,esc,evidence};
  root.GuiinCompat={...BaseCompat,build:compatBuild,pick:compatPick};
})(typeof globalThis!=='undefined'?globalThis:this);
