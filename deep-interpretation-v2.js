/**
 * 귀인사주 Deep Interpretation V2
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
      const f=Engine.flowForDate&&Engine.flowForDate(year,9,10,c?.pillars?.day?.stemIndex,12,0,{dayBoundary:c?.input?.dayBoundary||'23'});
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
  function primaryMechanism(c){
    const n=nameOf(c), arr=sorted(c), hi=arr[0]||['목',20], lo=arr[arr.length-1]||['수',20], mg=monthGod(c), g=GOD[mg]||GOD.일간;
    return {
      hi,lo,mg,g,
      thesis:`${n}님의 핵심은 ${EL_WORD[hi[0]].asset}이 자동으로 켜지는 반면, ${EL_WORD[lo[0]].low}은 의식적으로 만들어야 한다는 데 있습니다.`
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
    const n=nameOf(c), arr=sorted(c), hi=arr[0]||['목',20], lo=arr[arr.length-1]||['수',20], p=pct(c);
    const el=dmEl(c), mg=monthGod(c), g=GOD[mg]||GOD.일간, season=seasonOf(c), stage=dayStage(c), r=roots(c), lk=currentLuck(c), yg=yearGod(c);
    const climate=monthClimate(c), shape=strengthShape(c), rel=relationText(c);
    const high=EL_WORD[hi[0]], low=EL_WORD[lo[0]];

    const rows=[];
    const diagnosisTitle =
      hi[0]===el && hi[1]>=35
        ? `${n}님은 힘이 부족한 사람이 아니라, 이미 강한 ${hi[0]} 기운을 어디서 멈출지 정하는 능력이 더 중요한 사람입니다.`
        : r.length===0
          ? `${n}님은 힘으로 밀어붙이기보다, 환경을 읽고 ${hi[0]}의 강점을 결과로 바꿀 때 가장 강한 사람입니다.`
          : `${n}님은 ${high.asset}으로 성과를 만들지만, ${lo[0]} 기능을 늦게 챙기면 강점이 그대로 소모로 바뀌는 사람입니다.`;
    rows.push(section('핵심 진단',
      diagnosisTitle,
      `${n}님의 중심은 ${c?.pillars?.day?.ko||c?.dayMaster?.stem||'일간'}이고, 태어난 달은 ${c?.pillars?.month?.branch||''}월(${season||'계절'})입니다. 같은 일간이라도 계절이 달라지면 힘을 쓰는 방식이 달라지는데, ${n}님은 ${climate}에 가깝습니다.\n\n오행에서는 ${hi[0]} ${hi[1]}%가 가장 두드러지고 ${lo[0]} ${lo[1]}%가 가장 낮습니다. 그래서 ${high.asset}은 생각하기 전에 먼저 나오기 쉽고, 반대로 ${low.low}은 일부러 구조를 만들어야 안정됩니다.\n\n한마디로 정리하면, ${shape}입니다. 능력의 부족보다 ‘무엇을 자동으로 너무 많이 쓰는가’를 보는 편이 이 명식을 더 정확하게 읽는 방법입니다.`,
      c,[`${hi[0]} ${hi[1]}%`,`${lo[0]} ${lo[1]}%`,stage?`일지 12운성 ${stage}`:null]
    ));

    rows.push(section('구조를 뜯어보면',
      `겉으로 보이는 성격보다 월령과 뿌리가 ${n}님의 실제 반응 속도를 더 잘 설명합니다.`,
      `월주는 ${c?.pillars?.month?.ko||'-'}이고 십성은 ${mg}입니다. ${mg}은 ${g.core}과 연결되며, 사회에서는 특히 ${g.asset}이 강점으로 쓰이기 쉽습니다.\n\n일간의 뿌리는 지장간에서 ${r.length}곳 확인됩니다. ${r.length?`이는 힘이 빠져도 내부 기준을 다시 끌어올릴 통로가 ${r.length}곳 있다는 뜻으로 볼 수 있습니다.`:'같은 천간의 뿌리가 직접 확인되지 않는 만큼, 컨디션과 환경이 실력 발휘에 더 직접적인 영향을 줄 수 있습니다.'}\n\n${stage?`일지의 12운성은 ${euro(stage)}, ${stageMeaning(stage)}입니다. `:''}이 요소들을 합치면 ${n}님은 ‘무조건 강하다/약하다’보다, 특정 조건에서 힘이 급격히 살아나거나 급격히 소모되는 타입으로 보는 편이 정확합니다.`,
      c,[`월주 십성 ${mg}`,`통근 ${r.length}곳`,stage?`12운성 ${stage}`:null]
    ));

    rows.push(section('실력이 터지는 조건',
      `${n}님은 자유가 많을 때보다, 책임과 결정권이 같은 방향을 볼 때 가장 강합니다.`,
      `${high.asset}이 장점으로 바뀌는 조건은 분명합니다. 목표가 구체적이고, 내가 어디까지 책임지는지 보이며, 결과를 직접 확인할 수 있을 때입니다. 이때는 ${g.asset}까지 같이 붙으면서 속도와 완성도가 동시에 올라갈 수 있습니다.\n\n반대로 책임은 큰데 권한이 없거나, 계속 사람 감정을 대신 처리해야 하는 환경에서는 같은 장점이 피로로 뒤집힙니다. 잘해서 맡는 일이 계속 늘어나는 구조가 오래가면 ‘왜 결국 내가 다 하지?’라는 감정이 뒤늦게 올라오기 쉽습니다.\n\n칭찬을 하나 정확히 하자면, ${n}님은 아무 데서나 강한 사람이 아니라 구조가 맞는 자리에서 유난히 강한 사람입니다. 그래서 환경 선택이 실력만큼 중요합니다.`,
      c,[`${hi[0]} 우세`,`${mg}의 사회 작동`]
    ));

    rows.push(section('약점과 함정',
      `${n}님의 약점은 능력이 부족한 것이 아니라, 경계선을 늦게 긋는 순간 강점이 과잉으로 바뀐다는 점입니다.`,
      `${josa(hi[0],'이/가')} 강할 때의 함정은 ${high.over}입니다. ${josa(lo[0],'이/가')} 낮다는 건 ${josa(low.low,'이/가')} 자동으로 나오지 않을 수 있다는 뜻이라, 피곤할수록 잘하는 방식 하나만 반복하게 됩니다.\n\n이 패턴이 반복되면 처음에는 ‘내가 하면 빠르니까’로 시작하지만, 나중에는 선택권 없이 계속 책임지는 구조로 굳을 수 있습니다. 그때 문제는 일이 많다는 사실보다 내가 어디까지 맡기로 했는지 스스로도 모호해진다는 것입니다.\n\n${g.trap}도 같은 방향을 강화할 수 있습니다. 그래서 ${n}님에게 필요한 건 더 잘하는 법이 아니라, 잘하는 힘을 어디까지 쓸지 먼저 결정하는 법입니다.`,
      c,[`${hi[0]} 과잉 가능성`,`${lo[0]} 보완`,`${mg} 함정`]
    ));

    rows.push(section('감정이 켜지는 방식',
      `${n}님은 감정이 약한 사람이 아니라, 감정을 처리하는 자기 방식이 분명한 사람입니다.`,
      `가까운 관계에서는 ${josa(`일지 ${c?.pillars?.day?.branch||'-'}`,'과/와')} 원국 관계 신호를 같이 봅니다. 현재 원국 신호는 ${rel}\n\n이 신호를 사건 예언으로 읽을 필요는 없습니다. 대신 감정이 가까워질수록 어떤 반응이 반복되는지 확인하는 근거로 씁니다. 합이 많으면 관계를 쉽게 끊기보다 조정하려는 쪽으로, 충·형·해가 겹치면 참다가 방향을 크게 바꾸거나 말하지 않은 불편함이 오래 남는 쪽으로 나타날 수 있습니다.\n\n${n}님에게 중요한 건 ‘감정이 맞느냐’보다 감정이 쌓이는 속도와 말로 꺼내는 속도가 같은가입니다. 이 둘이 벌어지면 본인은 이미 오래 생각했는데 상대는 갑자기 통보받는 것처럼 느낄 수 있습니다.`,
      c,[rel]
    ));

    rows.push(section('남들이 오해하기 쉬운 점',
      `${n}님은 차갑거나 무심해서 거리를 두는 사람이 아니라, 확신이 없는 상태에서 함부로 약속하지 않으려는 면이 있을 수 있습니다.`,
      `겉으로는 반응이 빠르거나 단호해 보여도, 실제 안쪽에서는 ${mg}의 ${g.core}과 ${lo[0]} 보완 문제가 같이 돌아갈 수 있습니다. 그래서 어떤 일은 즉시 결정하면서도, 중요한 관계나 책임 문제에서는 예상보다 오래 생각할 수 있습니다.\n\n주변에서는 이 차이를 ‘기분에 따라 바뀐다’고 오해할 수 있지만, 실제로는 결정에 필요한 기준이 분야마다 다른 경우가 많습니다. 익숙한 일은 경험으로 빨리 자르고, 책임이 길게 남는 일은 회복 비용까지 계산하기 때문입니다.\n\n${n}님에게 필요한 건 모든 선택의 속도를 같게 만드는 게 아니라, 상대에게 “지금 결론이 없는 이유”를 한 문장으로 설명하는 것입니다. 설명이 없으면 신중함도 거리두기로 보일 수 있습니다.`,
      c,[`월주 ${mg}`,`${lo[0]} ${lo[1]}%`]
    ));

    rows.push(section('무너질 때 나타나는 순서',
      `${n}님은 갑자기 무너지는 것보다, 잘 버티는 시간이 길어서 한계를 늦게 알아차리는 쪽에 가깝습니다.`,
      `첫 단계에서는 원래 잘하던 ${high.asset}을 더 세게 씁니다. 두 번째 단계에서는 ${g.trap}이 나타나기 쉬워지고, 세 번째 단계에서는 ${low.low}을 챙길 여유가 줄어듭니다.\n\n그래서 밖에서는 여전히 일을 하고 있는데 안에서는 이미 ‘더는 하기 싫다’는 결론이 커질 수 있습니다. 이 상태가 길어지면 작은 수정으로 끝낼 수 있는 일을 한 번에 끊거나 크게 바꾸고 싶어질 수 있습니다.\n\n회복 신호는 의욕보다 먼저 봐야 합니다. 수면·식사·말수·지출·연락 빈도 중 평소와 달라지는 것이 두 가지 이상 생기면, 그때는 능력 문제가 아니라 과사용 신호로 보고 일정을 줄이는 편이 좋습니다.`,
      c,[`${hi[0]} 과사용`,`${mg} 함정`,`${lo[0]} 보완`]
    ));

    rows.push(section('결정 방식',
      `${n}님은 우유부단해서 늦는 사람이 아니라, 납득 기준이 채워질 때까지 보류하는 결정이 있는 사람입니다.`,
      `${mg}의 ${g.core}과 ${hi[0]} 우세가 함께 작동하면, 익숙한 분야에서는 판단이 매우 빨라질 수 있습니다. 반대로 책임 범위가 모호하거나 정보가 부족한 문제에서는 결론을 미루며 머릿속 시뮬레이션이 길어질 수 있습니다.\n\n그래서 ‘결정을 빨리 해라’는 조언은 잘 맞지 않습니다. 대신 큰 선택을 할 때 ① 내가 책임질 범위 ② 6개월 뒤 유지 가능성 ③ 실패했을 때 회복 비용, 이 세 가지를 먼저 적는 편이 훨씬 잘 맞습니다.\n\n이 세 항목이 선명하면 ${n}님은 결정을 오래 끌기보다 실행으로 옮기는 속도가 빨라지는 편입니다.`,
      c,[`월주 ${mg}`,`${hi[0]} ${hi[1]}%`]
    ));

    rows.push(section('일과 돈',
      `돈은 많이 버는 운보다, ${n}님이 어떤 방식으로 벌 때 덜 새는지를 보는 편이 더 중요합니다.`,
      `일에서는 ${g.asset}이 수입과 연결되기 쉽습니다. ${hi[0]}의 ${high.asset}을 결과물·기술·고객·성과처럼 반복 가능한 형태로 바꾸면 장점이 오래갑니다.\n\n반대로 바쁠수록 돈을 ‘시간을 사는 비용’이나 ‘관계를 유지하는 비용’으로 쓰기 시작하면 지출이 눈에 띄게 늘 수 있습니다. 특히 ${lo[0]} 기능이 낮을 때는 ${low.low}이 약해져, 거절해야 할 비용이나 끊어야 할 고정비가 오래 남을 수 있습니다.\n\n운용법은 단순합니다. 수입이 들어오면 고정비·저축·자유비용을 먼저 나누고, 다른 사람을 위해 쓰는 비용은 별도 항목으로 보이게 하세요. 숫자가 보이면 감정으로 대신 부담하는 돈이 줄어듭니다.`,
      c,[`월주 ${mg}`,`${hi[0]} ${hi[1]}%`,`${lo[0]} ${lo[1]}%`]
    ));

    rows.push(section('연애와 가까운 관계',
      `좋아하는 마음보다 ‘관계에서 어떤 역할을 맡게 되는가’가 ${n}님의 만족도를 더 크게 좌우할 수 있습니다.`,
      `${n}님은 가까워질수록 상대의 말보다 반복되는 행동을 더 크게 보는 편일 수 있습니다. 신뢰가 생기면 쉽게 버리지 않지만, 그만큼 한 번 맡은 역할도 오래 유지하려는 경향이 생길 수 있습니다.\n\n여기서 가장 위험한 건 사랑과 책임을 같은 것으로 보는 순간입니다. 상대의 문제를 해결해 주는 일이 애정 표현이 되기 시작하면, 처음에는 내가 선택한 돌봄이 나중에는 의무처럼 느껴질 수 있습니다.\n\n좋은 관계의 기준은 ‘얼마나 좋아하나’ 하나가 아니라 편안함·존중·책임 분담이 동시에 있는가입니다. 셋 중 하나가 계속 빠지면 감정이 커도 구조적으로는 피곤한 관계가 될 수 있습니다.`,
      c,[`일주 ${c?.pillars?.day?.ko||'-'}`,rel]
    ));

    try{
      const sg=BaseExpert.starGroups?BaseExpert.starGroups(c):null;
      const starRows=(sg?.rows||[]).slice().sort((a,b)=>(b.count||0)-(a.count||0)).slice(0,3);
      if(starRows.length){
        const names=starRows.map(x=>`${x.name}${x.count>1?`×${x.count}`:''}`).join(' · ');
        rows.push(section('보조 신호로 다시 확인되는 패턴',
          `신살은 결론을 만드는 재료가 아니라, 앞에서 읽은 구조가 어디에서 더 눈에 띄는지 확인하는 보조 근거입니다.`,
          `현재 원국에서 눈에 띄는 보조 신호는 ${names}입니다. 이 이름들만으로 연애·사고·재물 같은 사건을 예언하지 않습니다.\n\n대신 앞에서 확인한 ${hi[0]} 우세, ${mg}의 ${g.core}, 관계 신호와 같은 방향을 가리키는지 봅니다. 같은 패턴이 월령·십성·합충·신살에서 반복되면 그 성향은 특정 상황에서 더 쉽게 켜질 가능성이 있다고 해석할 수 있습니다.\n\n중요한 건 별의 이름보다 실제 행동입니다. ‘나는 언제 이 패턴을 반복하는가’를 현실 경험과 대조할 때만 신살 정보가 의미가 있습니다.`,
          c,[`보조 신호 ${names}`]
        ));
      }
    }catch(_e){}

    if(lk||yg){
      rows.push(section('지금의 시간축',
        `원국이 기본 체질이라면, 지금은 ${lk?`${lk.ko} 대운(${lk.god})`:''}${lk&&yg?' 위에 ':''}${yg?`${new Date().getFullYear()}년 ${yg}`:''}의 주제가 겹친 시기입니다.`,
        `${lk?`현재 대운의 ${josa(lk.god,'은/는')} ${josa(GOD[lk.god]?.core||'특정 역할','을/를')} 장기 과제로 올립니다. `:''}${yg?`올해의 ${josa(yg,'은/는')} ${josa(GOD[yg]?.core||'특정 역할','을/를')} 단기적으로 더 크게 느끼게 할 수 있습니다.`:''}\n\n이 둘이 같은 방향이면 한 가지 주제가 반복해서 눈앞에 나타나는 느낌이 강해질 수 있고, 서로 다른 방향이면 일·관계·돈 중 어디에 우선순위를 둘지 갈등이 생길 수 있습니다.\n\n중요한 건 ‘무슨 일이 반드시 생긴다’가 아닙니다. 원국에서 이미 가진 약점이 어떤 상황에서 더 쉽게 켜지는가를 보는 겁니다. 지금 선택할 때는 기회의 크기보다, 이 구조를 6개월 이상 유지해도 내가 괜찮은지 먼저 확인하는 편이 좋습니다.`,
        c,[lk?`현재 대운 ${lk.ko} ${lk.god}`:null,yg?`${new Date().getFullYear()} 세운 ${yg}`:null]
      ));
    }

    rows.push(section('이 사주의 핵심 과제',
      `${n}님의 과제는 더 강해지는 것이 아니라, 강한 힘을 어디까지 쓸지 스스로 정하는 것입니다.`,
      `이 명식에서 반복해서 보이는 핵심은 ${hi[0]}의 ${high.asset}과 ${lo[0]}의 보완 문제입니다. 잘할 수 있다는 이유로 계속 맡으면 강점은 결국 소모가 되고, 반대로 선을 너무 일찍 닫으면 원래 가진 실행력과 집중력이 충분히 쓰이지 못합니다.\n\n그래서 평생 운용 원칙은 하나로 압축할 수 있습니다. “할 수 있는가?”를 묻기 전에 “이게 내 몫인가, 그리고 계속 감당할 수 있는가?”를 먼저 묻는 것.\n\n이 질문이 선명해질수록 ${n}님의 장점은 덜 소모되고 더 오래 갑니다.`,
      c,[`${hi[0]} ${hi[1]}% ↔ ${lo[0]} ${lo[1]}%`,`월주 ${mg}`]
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
      version:'deep-v2',
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
        day_stage:dayStage(c)||null
      },
      mechanisms:[
        `${m.hi[0]} 기능은 자동으로 강하게 켜지고 ${m.lo[0]} 기능은 의식적으로 구조화해야 함`,
        `${m.mg}의 ${m.g.core}이 사회적 역할에서 반복될 가능성`,
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
    return {name:nameOf(c),p,hi:a[0]||['목',20],lo:a[a.length-1]||['수',20],dm:dmEl(c),stem:c?.pillars?.day?.stem||'',branch:c?.pillars?.day?.branch||'',month:c?.pillars?.month?.branch||'',season:seasonOf(c),mg:monthGod(c),stage:dayStage(c)};
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
  function compatBuild(a,b,score){
    const A=profile(a),B=profile(b), hits=crossHits(a,b), pos=bestHits(hits,true), neg=bestHits(hits,false);
    const aSees=tg(a,b),bSees=tg(b,a), sameStem=A.stem&&A.stem===B.stem, sameEl=A.dm&&A.dm===B.dm;
    const lkA=currentLuck(a),lkB=currentLuck(b), year=new Date().getFullYear(), ygA=yearGod(a,year),ygB=yearGod(b,year);
    const nA=A.name,nB=B.name;

    const sections=[];
    sections.push({id:'core',category:'summary',title:'이 관계의 본질',body:
      `${sameStem?`두 사람은 같은 ${A.stem} 일간이라 기본 감각이 닮았습니다. 하지만 같은 글자라고 같은 사람은 아닙니다. `:''}${seasonContrast(A,B)}\n\n${nA}님의 자동 강점은 ${A.hi[0]} ${A.hi[1]}%, ${nB}님은 ${B.hi[0]} ${B.hi[1]}%에서 가장 강하게 보입니다. 그래서 이 관계는 ‘성격이 비슷한가’보다 서로의 속도와 책임 방식을 어떻게 나누는가가 만족도를 더 크게 좌우합니다.\n\n좋을 때는 한 사람의 강점이 다른 사람의 빈 부분을 메우지만, 피곤할 때는 같은 차이가 ‘왜 저렇게 하지?’라는 평가로 바뀝니다. 이 관계의 핵심은 차이를 없애는 것이 아니라 차이를 역할로 번역하는 것입니다.`,
      evidence:`일간 ${A.stem}/${B.stem} · 월령 ${A.month}/${B.month} · 중심 오행 ${A.hi[0]} ${A.hi[1]}% ↔ ${B.hi[0]} ${B.hi[1]}%`});

    sections.push({id:'why',category:'summary',title:'왜 서로에게 강하게 반응하는가',body:
      `${nA}님이 ${nB}님의 일간을 볼 때 교차 십신은 ${aSees}, ${nB}님이 ${nA}님을 볼 때는 ${bSees}입니다. 이건 상대의 실제 성격 그 자체라기보다 내가 그 사람에게 어떤 역할을 기대하기 쉬운지를 보여주는 단서입니다.\n\n${nA}님 쪽에서는 ${GOD[aSees]?.core||aSees}의 감각이, ${nB}님 쪽에서는 ${GOD[bSees]?.core||bSees}의 감각이 먼저 켜질 수 있습니다. 그래서 한쪽은 보호·안정으로 받아들이는데 다른 쪽은 경쟁·자극으로 받아들이는 식의 번역 차이가 생길 수 있습니다.\n\n관계 초반의 끌림은 이런 역할 기대와 합 신호가 겹칠 때 커지지만, 오래 가는지는 그 기대를 현실 역할로 조정할 수 있는지에 달려 있습니다.`,
      evidence:`교차 십신 ${nA}→${nB} ${aSees} · ${nB}→${nA} ${bSees}`});

    const crossTriad=pos.find(h=>h.type==='교차삼합');
    sections.push({id:'bond',category:'summary',title:'둘을 붙게 만드는 힘',body:
      `${pos.length?`두 명식을 직접 겹쳤을 때 붙는 신호가 확인됩니다. ${hitSummary(pos)}.`:'두 명식을 겹쳤을 때 강한 합 신호보다 생활 방식과 정서적 선택이 관계를 더 크게 좌우하는 구조입니다.'}${crossTriad?` 특히 ${crossTriad.desc}은 한 사람 원국만 봐서는 완성되지 않고 두 명식을 겹쳤을 때 비로소 잡히는 구조라, 서로 만났을 때 특정 기능이나 역할감이 더 강하게 체감될 수 있다는 보조 근거가 됩니다.`:''}\n\n합은 ‘무조건 좋은 인연’이라는 뜻이 아닙니다. 실제로는 서로를 쉽게 지나치지 못하고, 조정하고, 다시 붙여보려는 힘으로 보는 편이 정확합니다. 특히 일주가 포함된 합은 가까운 관계에서 체감이 더 클 수 있습니다.\n\n좋은 방향으로 쓰면 서로가 다른 방식으로 해준 일을 인정하는 힘이 되고, 나쁘게 쓰면 불편한데도 익숙해서 계속 붙잡는 힘이 될 수 있습니다.`,
      evidence:`긍정 교차 신호 · ${hitSummary(pos)}`});

    sections.push({id:'friction',category:'love',title:'둘이 가장 쉽게 부딪히는 지점',body:
      `${neg.length?`긴장 신호는 ${hitSummary(neg)}로 잡힙니다.`:'직접적인 충·형·해·파가 강하게 겹치지 않아, 갈등은 주로 속도·역할·기대치에서 생기기 쉽습니다.'}\n\n여기서 중요한 건 ‘싸운다’는 예언이 아니라 같은 사건을 처리하는 순서가 다를 수 있다는 것입니다. ${nA}님은 ${A.hi[0]}의 ${EL_WORD[A.hi[0]].asset}을 먼저 쓰고, ${nB}님은 ${B.hi[0]}의 ${EL_WORD[B.hi[0]].asset}을 먼저 씁니다.\n\n이 차이가 피곤한 날에는 한쪽에게는 신중함이 답답함으로, 다른 쪽에게는 추진력이 압박으로 번역될 수 있습니다. 갈등의 핵심은 누가 맞느냐보다 누가 언제 결론을 내리고, 언제 말하고, 언제 행동하느냐의 순서입니다.`,
      evidence:`긴장 교차 신호 · ${hitSummary(neg)}`});

    sections.push({id:'communication',category:'love',title:'싸울 때 실제로 벌어지기 쉬운 장면',body:
      `${josa(nA+'님','과/와')} ${nB}님 모두 피곤할 때는 자기 자동 기능을 더 세게 씁니다. ${nA}님은 ${A.hi[0]} 쪽으로, ${nB}님은 ${B.hi[0]} 쪽으로 기울기 쉬워 서로의 반응을 성격 문제로 오해할 수 있습니다.\n\n이 관계에서 가장 피해야 할 건 감정이 올라온 상태에서 관계 전체를 평가하는 겁니다. “너는 원래 그래”가 나오기 시작하면 구조 차이를 인격 평가로 바꾸게 됩니다.\n\n실전 규칙은 세 가지면 충분합니다. ① 사실과 해석을 분리해서 말하기 ② 큰 결론은 감정 최고점에서 내리지 않기 ③ 다시 이야기할 시간을 구체적으로 정하기. 이 세 가지가 없으면 좋은 합도 소모되고, 긴장 신호는 반복 패턴으로 굳기 쉽습니다.`,
      evidence:`중심 오행 ${A.hi[0]} ↔ ${B.hi[0]} · 월주 십성 ${A.mg} ↔ ${B.mg}`});

    sections.push({id:'money',category:'marriage',title:'돈·시간·돌봄에서 진짜 궁합이 갈립니다',body:
      `연애 감정과 생활 책임은 별개입니다. ${nA}님의 낮은 기능은 ${A.lo[0]} ${A.lo[1]}%, ${nB}님은 ${B.lo[0]} ${B.lo[1]}%입니다. 한 사람이 상대적으로 약한 기능을 다른 사람이 계속 대신 맡게 되면 처음에는 보완이지만 나중에는 고정 역할이 됩니다.\n\n특히 돈·집안일·반려동물·가족 일정·정서적 돌봄처럼 반복되는 일은 “더 잘하는 사람이 하면 되지”로 시작하면 한쪽에 일이 몰리기 쉽습니다.\n\n그래서 이 관계는 사랑의 크기보다 공동비용 / 개인비용 / 돌봄 시간 / 혼자 있는 시간 네 항목을 실제 문장으로 합의했을 때 훨씬 안정됩니다.`,
      evidence:`약한 오행 ${nA} ${A.lo[0]} ${A.lo[1]}% · ${nB} ${B.lo[0]} ${B.lo[1]}%`});

    sections.push({id:'marriage',category:'marriage',title:'같이 살면 드러나는 구조',body:
      `${nA}님의 월주는 ${a?.pillars?.month?.ko||'-'}(${A.mg}), 일주는 ${a?.pillars?.day?.ko||'-'}이고, ${nB}님의 월주는 ${b?.pillars?.month?.ko||'-'}(${B.mg}), 일주는 ${b?.pillars?.day?.ko||'-'}입니다. 월주는 사회와 생활 운영의 결을, 일주는 가까운 관계에서의 반응을 읽는 핵심 축입니다.\n\n함께 살면 연애 때는 보이지 않던 ‘정리 기준, 수면, 외출, 돈, 가족, 돌봄’이 매일 반복됩니다. 이때 합은 같이 맞춰가는 힘이 되고, 충·형은 계속 손봐야 하는 영역이 됩니다.\n\n좋은 동거 궁합은 같은 취향보다 반복되는 일을 누가 언제 책임지는지 명확한 관계입니다. 이 구조가 잡히면 차이가 오히려 역할 분담이 됩니다.`,
      evidence:`월주 ${a?.pillars?.month?.ko||'-'}/${b?.pillars?.month?.ko||'-'} · 일주 ${a?.pillars?.day?.ko||'-'}/${b?.pillars?.day?.ko||'-'}`});

    if(lkA||lkB||ygA||ygB){
      sections.push({id:'timing',category:'summary',title:'지금 두 사람이 같은 문제를 다르게 느낄 수 있는 이유',body:
        `${nA}님은 현재 ${lkA?`${lkA.ko} 대운(${lkA.god})`:'대운'}${ygA?` 위에 ${year}년 ${ygA}`:''}, ${nB}님은 ${lkB?`${lkB.ko} 대운(${lkB.god})`:'대운'}${ygB?` 위에 ${year}년 ${ygB}`:''}의 흐름을 지나고 있습니다.\n\n원국 궁합이 같아도 시기마다 관계 체감은 달라집니다. 한쪽은 일과 책임이 커지는 시기인데 다른 쪽은 사람·변화·자기 선택이 커지는 시기라면, 사랑이 줄어서가 아니라 에너지를 써야 하는 곳이 달라져서 거리감이 생길 수 있습니다.\n\n이럴 때는 “우리 사이가 왜 이래?”보다 “지금 각자 무엇에 에너지를 빼앗기고 있나?”를 먼저 확인하는 편이 정확합니다.`,
        evidence:`현재 흐름 ${lkA?lkA.ko+' '+lkA.god:'-'} ↔ ${lkB?lkB.ko+' '+lkB.god:'-'}${ygA||ygB?` · ${year} ${ygA||'-'} ↔ ${ygB||'-'}`:''}`});
    }

    sections.push({id:'task',category:'summary',title:'이 관계의 핵심 과제',body:
      `이 관계의 과제는 서로를 더 이해하려고 끝없이 분석하는 것이 아니라, 차이를 실제 역할과 규칙으로 번역하는 것입니다.\n\n${sameEl?'기본 감각이 닮았기 때문에 오히려 “이 정도는 말 안 해도 알겠지”라는 기대가 생길 수 있습니다. 닮은 사람끼리의 갈등은 다름보다 기대 불일치에서 더 크게 생기기도 합니다.':'기본 에너지 사용법이 다르기 때문에 상대의 방식을 틀렸다고 판단하기 전에 기능의 차이로 볼 필요가 있습니다.'}\n\n둘이 오래 가려면 사랑을 증명하는 방식보다 연락·돈·시간·돌봄·경계의 운영 규칙을 계속 업데이트해야 합니다. 좋은 궁합은 차이가 없는 관계가 아니라, 차이가 생겼을 때 수정 가능한 관계입니다.`,
      evidence:`교차 합 ${pos.length}개 · 교차 긴장 ${neg.length}개 · 교차 십신 ${aSees}/${bSees}`});

    return {meta:{version:'deep-v2',aName:nA,bName:nB,score:Number.isFinite(score)?score:null,crossTenGod:{aSeesB:aSees,bSeesA:bSees},positiveSignals:pos,negativeSignals:neg,allSignals:hits},sections};
  }
  function compatPick(analysis,tab){
    const s=analysis?.sections||[];
    if(tab==='summary')return s;
    if(tab==='love')return s.filter(x=>['core','why','bond','friction','communication','timing','task'].includes(x.id));
    if(tab==='marriage')return s.filter(x=>['core','bond','friction','money','marriage','timing','task'].includes(x.id));
    if(tab==='partner')return s.filter(x=>['core','why','friction','communication','task'].includes(x.id));
    return s;
  }

  root.GuiinExpert={...BaseExpert,fullSections:coreSections,personalitySections,fieldSections,personModel,pct,esc,evidence};
  root.GuiinCompat={...BaseCompat,build:compatBuild,pick:compatPick};
})(typeof globalThis!=='undefined'?globalThis:this);
