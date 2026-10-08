/** GUIIN Interpretation V4 — human-first confident Korean output layer.
 * Load AFTER deep-interpretation-v3.js. Calculation engines are not modified.
 */
(function(root){'use strict';
const BaseExpert=root.GuiinExpert||{}, BaseCompat=root.GuiinCompat||{}, E=['목','화','토','금','수'];
const SEASON={인:'봄',묘:'봄',진:'봄',사:'여름',오:'여름',미:'여름',신:'가을',유:'가을',술:'가을',해:'겨울',자:'겨울',축:'겨울'};
const WORK={비견:['남이 정해준 답보다 자기 기준으로 결과를 만들 때 실력이 확 살아나.','결정권이 있는 자리에서 속도가 붙고, 간섭이 많으면 일 자체보다 답답함에 먼저 지쳐.'],겁재:['사람과 일이 빠르게 움직이는 현장에서 순발력이 좋아.','경쟁이 붙으면 더 세게 달리는 편이라 남의 속도까지 떠안지 않는 게 중요해.'],식신:['한번 익힌 기술을 자기 것으로 만들고, 반복할수록 완성도를 올리는 데 강해.','빨리빨리 결과만 내라고 몰아붙이는 곳보다 실력이 쌓이는 일이 훨씬 잘 맞아.'],상관:['잘못된 점을 그냥 지나치지 않아. 불편한 걸 발견하면 더 나은 방식으로 고치려는 힘이 강해.','답답한 방식에 오래 맞추면 참는 게 아니라 속에서 계속 수정점을 찾다가 결국 확 터져.'],편재:['사람 반응과 기회를 빨리 읽고 움직이는 감각이 좋아.','판이 움직일수록 강하지만 사람 부탁과 기회까지 전부 잡으려 하면 일정과 돈이 같이 새기 쉬워.'],정재:['현실적으로 유지되는 구조를 만드는 데 강해.','한번 책임진 걸 쉽게 놓지 않아서 이미 손해인 상황도 오래 끌고 갈 때가 있어.'],편관:['압박이 생기면 오히려 집중력이 올라가는 타입이야.','문제가 터졌을 때 강하지만 늘 긴장해야 하는 환경을 정상으로 여기면 금방 소진돼.'],정관:['맡은 일은 제대로 끝내야 마음이 놓여. 신뢰와 책임이 분명한 자리에서 강해.','책임은 네 몫인데 결정은 남이 하는 구조가 반복되면 능력보다 피로가 먼저 쌓여.'],편인:['남들이 그냥 넘긴 문제를 혼자 깊게 파고드는 힘이 있어.','납득이 안 된 채로 빨리 끝내라고 하면 집중력이 깨지고 일에 정이 떨어져.'],정인:['배운 걸 정리해서 자기 것으로 만드는 힘이 좋아.','충분히 준비한 뒤 움직이려 해서 시작이 늦어질 때만 조심하면 돼.'],일간:['네가 납득한 방식으로 움직일 때 가장 안정적으로 실력을 내.','억지로 남의 방식에 오래 맞추면 일보다 답답함이 먼저 커져.']};
const DAY={자:'가까운 사람의 말보다 분위기와 미묘한 변화를 먼저 읽어. 바로 묻기보다 혼자 생각을 정리한 뒤 말하는 편이야.',축:'사람을 쉽게 믿지는 않지만 한번 내 사람이라고 생각하면 오래 책임져. 그래서 관계를 끊기 전까지 참는 시간이 긴 편이야.',인:'좋아하는 사람과 가만히 있는 것보다 같이 움직이고 새로운 걸 해볼 때 애정이 더 살아나.',묘:'말투, 표정, 연락의 온도가 달라지면 금방 알아채. 상대가 아무 일 아니라고 해도 너는 이미 변화를 느끼고 있어.',진:'감정 하나만 보지 않고 이 관계가 앞으로 어떻게 갈지까지 같이 생각해. 그래서 한번 고민이 시작되면 생각의 범위가 커져.',사:'마음이 움직이면 반응도 빠른 편이야. 애매하게 끌고 가는 관계보다 좋으면 좋다, 아니면 아니다가 분명한 쪽이 편해.',오:'좋고 싫은 감정이 비교적 분명하고 사랑받고 있다는 반응도 중요하게 봐. 무관심하게 느껴지는 태도를 오래 견디지 못해.',미:'좋아하는 사람은 정말 잘 챙겨. 문제는 상대 몫까지 자연스럽게 네가 해주다가 나중에 혼자 지치는 거야.',신:'관계에서도 현실을 봐. 말만 예쁘게 하는 것보다 실제 행동이 맞는지, 약속이 지켜지는지를 빠르게 판단해.',유:'작은 약속과 반복되는 행동을 아주 잘 기억해. 한두 번은 넘어가도 같은 실망이 반복되면 신뢰가 확 떨어져.',술:'내 사람이라고 생각하면 오래 지켜. 대신 한번 중요하다고 말한 선을 계속 넘으면 예전처럼 마음을 주기 어려워.',해:'상대 사정을 먼저 이해하려는 마음이 커. 그래서 서운해도 바로 따지기보다 이유를 생각해주다가 네 감정을 늦게 말하는 편이야.'};
const HIGH={목:['가만히 유지하는 것보다 다음 단계가 보여야 힘이 나.','아이디어와 계획을 넓히는 속도가 빠르고, 막힌 상황에서도 다른 길을 찾는 편이야.'],화:['반응이 빠르고 분위기를 움직이는 힘이 있어.','마음이 정해지면 행동까지 오래 끌지 않고 바로 움직여.'],토:['쉽게 무너지기보다 끝까지 책임지고 버티는 힘이 강해.','남들이 중간에 놓는 일도 네가 맡으면 결국 마무리하려고 해.'],금:['대충 넘어가는 걸 잘 못 봐. 기준이 분명하고 틀린 부분을 빨리 찾아.','완성도와 정확도를 보는 눈이 좋아서 결과물의 질을 끌어올리는 힘이 있어.'],수:['사람과 상황의 흐름을 읽는 속도가 빨라.','겉으로 바로 반응하지 않아도 머릿속에서는 이미 여러 경우를 비교하고 있어.']};
const STRESS={목:'할 일을 계속 늘리다가 정작 끝내야 할 일이 밀리기 시작하면 이미 과부하야.',화:'평소보다 말과 결론이 빨라지고 작은 일에도 확 끊어버리고 싶어지면 이미 많이 지친 거야.',토:'처음엔 더 떠안고 버티다가 어느 순간 아무것도 하기 싫어지는 식으로 무너져.',금:'수정할 것과 마음에 안 드는 게 계속 늘어나면 남보다 네가 먼저 지쳐.',수:'생각과 확인만 계속 늘고 연락이나 행동이 줄어들기 시작하면 피로가 꽤 쌓인 상태야.'};

const STEMSIG={갑:'방향이 정해지면 쉽게 흔들리지 않고',을:'상황을 읽어 길을 바꾸는 감각이 있고',병:'마음이 움직이면 밖으로 드러나는 속도가 빠르고',정:'겉보다 속에서 오래 집중하는 힘이 있고',무:'쉽게 무너지지 않고 중심을 잡으려 하고',기:'주변을 챙기면서 현실적으로 정리하는 힘이 있고',경:'필요할 때 단호하게 잘라내는 힘이 있고',신:'작은 차이와 완성도를 예민하게 보고',임:'큰 흐름을 보면서 선택지를 넓게 잡고',계:'미묘한 변화와 사람의 속도를 빨리 읽고'};
const MONTHSIG={자:'생각이 깊어질수록 혼자 정리하는 시간이 필요해',축:'확실히 믿을 수 있을 때까지 천천히 확인하는 편이야',인:'새로운 일이 생기면 먼저 가능성부터 보는 편이야',묘:'사람 사이의 분위기와 말투 변화에 민감해',진:'한 가지보다 전체 상황을 같이 보려 해',사:'결론이 서면 오래 끌기보다 움직이는 편이야',오:'반응이 분명해서 좋고 싫음이 행동에 드러나는 편이야',미:'주변 사람 몫까지 자연스럽게 챙길 때가 많아',신:'상황이 바뀌면 빠르게 현실적인 방법을 찾는 편이야',유:'작은 약속과 기준이 지켜지는지를 오래 봐',술:'한번 중요하다고 정한 원칙을 쉽게 바꾸지 않아',해:'상대 사정을 넓게 이해하려고 먼저 생각해'};
function signature(c,tag){const st=c?.dayMaster?.stem||c?.pillars?.day?.stem||'', mb=c?.pillars?.month?.branch||'', hb=c?.pillars?.hour?.branch||'', yk=c?.pillars?.year?.ko||'';const tails={자:'그래서 혼자 생각할 시간을 빼앗기면 평소보다 예민해져.',축:'그래서 급하게 답을 요구받으면 오히려 마음을 닫아.',인:'그래서 앞으로 나아갈 길이 막혀 있으면 금방 답답해져.',묘:'그래서 무심한 말 한마디도 관계의 온도로 받아들이는 편이야.',진:'그래서 단순한 답보다 전체 상황이 납득돼야 움직여.',사:'그래서 애매하게 미루는 상황이 길어지면 참기 어려워.',오:'그래서 반응 없는 관계나 일에서는 금방 힘이 빠져.',미:'그래서 네 호의를 당연하게 받는 사람에게 가장 지쳐.',신:'그래서 비효율이 반복되면 감정보다 해결책부터 찾게 돼.',유:'그래서 기준이 계속 바뀌는 사람이나 환경을 특히 싫어해.',술:'그래서 신뢰가 깨진 뒤에는 예전처럼 대하기가 쉽지 않아.',해:'그래서 상대를 이해하느라 네 마음을 뒤로 미루지 않는 게 중요해.'};const extra=(hash(yk+'|'+tag)%3===0)?'남이 정한 답보다 네가 직접 겪고 납득한 기준을 더 오래 믿는 편이야.':(hash(yk+'|'+tag)%3===1)?'겉으로 괜찮아 보여도 마음속 기준에서 벗어난 건 오래 기억하는 편이야.':'한번 네 방식이 맞다고 확인되면 다음에는 훨씬 빠르게 판단해.';return `${STEMSIG[st]||''} ${MONTHSIG[mb]||''}. ${tails[hb]||''} ${extra}`.replace(/\s+/g,' ').trim();}

const MONEY={비견:'돈도 남이 정한 방식보다 네가 직접 기준을 잡아 관리하는 게 맞아.',겁재:'사람과 활동이 늘면 돈도 같이 빨리 움직여. 특히 분위기에 휩쓸린 지출을 조심해야 해.',식신:'한 번 크게 버는 것보다 잘하는 기술을 반복해서 꾸준한 수입으로 만드는 방식이 잘 맞아.',상관:'아이디어와 개선 능력을 돈으로 바꾸는 힘이 있어. 대신 싫증 때문에 수입 구조를 너무 자주 바꾸지는 마.',편재:'기회를 잡아 수입 통로를 넓히는 감각이 있어. 들어오는 만큼 나가는 속도도 빨라질 수 있어.',정재:'꾸준히 벌고 지키는 힘이 좋아. 다만 이미 오래 낸 비용이라고 계속 유지할 필요는 없어.',편관:'큰 책임을 맡을수록 돈과 일이 함께 커질 수 있어. 책임 때문에 대신 내주는 돈은 선을 그어야 해.',정관:'안정적인 수입과 계획적인 관리가 잘 맞아. 체면이나 책임 때문에 네 몫 아닌 비용까지 떠안지 마.',편인:'전문성, 지식, 독특한 기술을 돈으로 연결하는 방식이 잘 맞아. 준비 비용만 계속 늘어나는 건 막아야 해.',정인:'배운 것과 신뢰를 오래 쌓아 수입으로 연결하는 타입이야. 급한 한방보다 기반이 중요해.',일간:'네가 통제할 수 있는 수입 구조를 만들수록 돈 때문에 흔들리는 일이 줄어.'};
const INCOME={비견:'내 기술과 판단을 직접 납품하는 일에서 수입의 주도권을 잡아.',겁재:'협업과 경쟁이 빠른 현장에서 사람을 연결하고 일을 성사시키는 힘을 수입으로 이어가.',식신:'한번 익힌 기술을 서비스나 상품으로 반복 제공할 때 수입 기반이 쌓여.',상관:'문제의 원인을 찾고 기존 방식을 개선한 결과에 대가를 받는 일이 맞아.',편재:'고객의 필요와 판매 기회를 연결하며 수입 통로를 넓혀가는 방식이 맞아.',정재:'반복 수요를 관리하고 비용 대비 결과를 꾸준히 유지하는 일에서 수입 기반이 단단해져.',편관:'난도가 높은 문제를 맡고 해결 범위를 분명히 할 때 전문성과 보상을 함께 쌓아.',정관:'경력과 신뢰가 인정되는 자리에서 맡은 역할에 맞는 보상을 쌓는 방식이 맞아.',편인:'깊게 파고든 특수 분야의 지식과 기술을 필요한 사람에게 제공하는 방식이 맞아.',정인:'배운 것을 정리해 교육·문서·지원 서비스로 전달할 때 수입으로 이어갈 길이 보여.',일간:'네가 직접 확인하고 관리할 수 있는 수입 통로부터 만드는 게 좋아.'};
const TIMING={비견:'스스로 정할 일과 함께 결정할 일을 나누는 게 중요해.',겁재:'협업의 기회만큼 경쟁과 공동 부담의 범위를 확인해야 해.',식신:'새 일을 계속 늘리기보다 익힌 기술을 꾸준히 제공할 리듬을 만들어.',상관:'바꾸고 싶은 방식이 늘어날수록 개선안과 실행 순서를 분리해.',편재:'넓힐 기회가 보여도 기존 약속과 자금을 얼마나 남길지 먼저 정해.',정재:'일정한 수입과 지출의 구조를 점검하고 오래 유지할 계획을 세워.',편관:'급한 과제가 몰릴 때 혼자 책임질 범위와 도움받을 범위를 정해.',정관:'역할이 분명해지는 만큼 책임에 맞는 권한과 시간을 확보해.',편인:'생각하고 탐구할 공간을 남기되 준비를 끝낼 시점도 정해.',정인:'배운 것을 정리하고 필요한 지원을 받으며 생활의 기반을 다져.'};
function name(c){return String(c?.input?.name||'너').replace(/님$/,'');} function mg(c){return c?.pillars?.month?.god||'일간';}
function pct(c){const x=c?.elCount||{},t=E.reduce((s,k)=>s+(+x[k]||0),0)||1,o={};E.forEach(k=>o[k]=Math.round((+x[k]||0)*100/t));return o;}
function order(c){const p=pct(c);return E.slice().sort((a,b)=>p[b]-p[a]).map(k=>[k,p[k]]);} function branch(c){return c?.pillars?.day?.branch||'';}
function rels(c){return Array.isArray(c?.relations)?c.relations:[];} function neg(c){return rels(c).filter(x=>['충','형','해','파'].includes(x?.type));}
function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;}
function seed(c,s=''){return hash([c?.pillars?.year?.ko,c?.pillars?.month?.ko,c?.pillars?.day?.ko,c?.pillars?.hour?.ko,c?.input?.gender,s].join('|'));}
function pick(a,c,s){return a[seed(c,s)%a.length];} function ev(c,extra=''){return [c?.pillars?.day?.ko&&`일주 ${c.pillars.day.ko}`,c?.pillars?.month?.ko&&`월주 ${c.pillars.month.ko}`,extra].filter(Boolean).join(' · ');}
function sec(id,title,body,c,evidence){return {id,eyebrow:title,title,body,evidence:ev(c,[`월간 ${mg(c)}`,`오행 상위 ${order(c).slice(0,2).map(x=>x[0]+' '+x[1]+'%').join(' / ')}`,evidence].filter(Boolean).join(' · '))};}
function closeStyle(c){const b=branch(c), base=DAY[b]||'가까운 사람일수록 말보다 반복되는 행동을 더 오래 봐.'; const n=neg(c); if(!n.length)return base+' 한번 믿은 관계는 쉽게 버리지 않지만 행동이 계속 어긋나면 마음이 서서히 멀어져.'; const t=n[0].type; return base+(t==='충'?' 참다가 선을 넘었다고 느끼는 순간에는 관계 방식을 통째로 바꾸려 해.':t==='형'?' 같은 문제가 반복되면 머릿속에서 계속 되짚다가 결국 지쳐.':t==='해'?' 겉으로 넘어간 일도 마음속에 남아 다음 실망과 연결돼.':' 약속이 자꾸 바뀌면 사랑보다 신뢰부터 흔들려.');}
function sections(c){
 const n=name(c),a=order(c),hi=a[0][0],lo=a[4][0],g=mg(c),w=WORK[g]||WORK.일간,b=branch(c),negative=neg(c),st=c?.dayMaster?.stem||c?.pillars?.day?.stem||'',month=c?.pillars?.month?.branch||'';
 const group=/비견|겁재/.test(g)?'self':/식신|상관/.test(g)?'output':/편재|정재/.test(g)?'money':/편관|정관/.test(g)?'duty':'thought';
 const independent=group==='self'||g==='상관'||g==='편재';
 const hidden=c?.pillars?.day?.hidden||[],privateGod=hidden.find(x=>x.role==='본기')?.god||hidden[0]?.god||'';
 const stars=new Set((c?.stars?.hits||[]).map(x=>x.name).filter(Boolean));
 const season=SEASON[month]||'', roots=c?.extras?.roots?.length||0;
 // Signals have different weights. Stars corroborate the structure; none defines a person alone.
 const dominantWeight=a[0][1]-a[1][1]<=3?1:2;
 const expressScore=(hi==='화'?dominantWeight:0)+(g==='상관'?2:0)+(/식신|상관/.test(privateGod)?1:0)+(['사','오'].includes(b)?1:0)+(season==='여름'?1:0);
 const reflectScore=(hi==='수'?dominantWeight:0)+(group==='thought'?2:0)+(/정인|편인/.test(privateGod)?1:0)+(['자','해'].includes(b)?1:0)+(season==='겨울'?1:0)+(stars.has('화개살')?1:0);
 const expressive=expressScore>=2&&expressScore>reflectScore;
 const introspective=reflectScore>=2&&reflectScore>=expressScore;
 const dutyScore=(hi==='토'?dominantWeight:0)+(group==='duty'||g==='정재'?2:0)+(/정관|편관|정재/.test(privateGod)?1:0)+(['축','미','술'].includes(b)?1:0);
 const responsibility=dutyScore>=2;

 const rows=[],add=(id,title,body,extra)=>rows.push(sec(id,title,body,c,[extra,`일지 본기 ${privateGod||'미확인'}`,`계절 ${season}`,`통근 ${roots}곳`].filter(Boolean).join(' · ')));
 add('self','나는 어떤 사람인가',`${a[0][1]-a[1][1]<=3?'한 가지 방식만 밀기보다 상황에 맞춰 다른 판단 기준을 함께 쓰는 사람이야.':HIGH[hi][0]} 두 힘이 겹쳐서 ${hi==='금'?'맡은 일의 빈틈을 발견하고 자기 기준으로 마무리하는':hi==='화'?'상황에 반응하면서 결과를 직접 만들어내는':hi==='수'?'겉으로 보이는 말보다 전체 맥락을 파악하는':hi==='토'?'흩어진 일과 사람을 붙잡아 실제로 굴러가게 하는':'막힌 상황에서도 다음 방향을 찾아 움직이는'} 쪽에 장점이 있어. ${STEMSIG[st]||'자기 기준을 확인하고'} ${MONTHSIG[month]||'상황을 살피는 편이야'}.`);
 add('inside','겉모습과 속마음',`${DAY[b]||'마음을 열기 전에 행동이 꾸준한지 살펴.'} ${introspective?'겉에서 답이 느려 보여도 안에서는 이유와 맥락을 계속 비교하고 있어. 생각을 끝낸 뒤 말하려다 네 필요를 늦게 알리는 게 문제야.':expressive?'밖에서는 반응이 빠르지만, 혼자 있을 때는 내가 한 말과 상대 반응을 다시 확인해. 밝게 반응했다고 모든 일이 괜찮았다는 뜻은 아니야.':'차분하게 일을 처리하는 모습과 편하게 기대고 싶은 마음이 함께 있어. 책임을 다하는 것과 속마음을 보여주는 건 별개의 일이야.'}`);
 add('people','사람을 볼 때 먼저 보는 것',`${group==='duty'||g==='정재'?'말한 약속을 실제로 지키는지 먼저 봐. 친절한 말보다 책임을 피하지 않는 태도에서 신뢰가 생겨.':independent?'자기 생각이 있으면서 네 선택도 존중하는지 먼저 봐. 가까워진다는 이유로 결정권을 빼앗는 사람에게는 답답함이 커져.':group==='thought'?'이유를 듣고 이해하려는 태도를 먼저 봐. 네 말을 급하게 정리하거나 가볍게 넘기는 사람에게는 마음을 열기 어려워.':'같이 있을 때 억지로 긴장하지 않아도 되는지 먼저 봐. 말이 재미있는 것보다 생활의 속도가 자연스러운지가 오래 남아.'} ${hi==='금'?'작은 말과 행동의 차이도 놓치지 않는 편이라 첫인상 이후의 일관성을 오래 살펴.':hi==='수'?'한 장면만으로 결론내리기보다 그 사람의 사정과 평소 패턴을 같이 비교해.':'한번 편해진 뒤에도 서로 부담하는 몫이 균형을 이루는지 살펴.'}`);
 add('close','가까운 사람에게 하는 행동',`${responsibility?'부탁받기 전에 필요한 일을 챙기고, 한번 맡은 몫은 쉽게 놓지 않아. 상대는 든든하다고 느끼지만 네가 어디까지 감당하는지 모를 때가 있어.':independent?'문제가 생기면 답을 같이 찾고 움직여주려 해. 다만 상대가 원한 건 해결이 아니라 자기 이야기를 끝까지 들어주는 것일 때도 있어.':'말투와 컨디션을 살피면서 상대에게 맞춰줘. 대신 네가 맞춘 부분은 밖에서 잘 보이지 않아 고마움을 못 받았다고 느낄 때가 있어.'} ${/정관|편관/.test(privateGod)?'가까워질수록 아무 말 없이 맡은 역할이 늘어나는지 봐. 부탁을 받는 순간 할 수 있는 범위를 말해.':/비견|겁재/.test(privateGod)?'도와주더라도 상대가 직접 결정할 몫은 남겨둬. 네가 원하는 도움도 같은 방식일 때가 많아.':'표현 방식이 달라도 네가 챙긴 행동을 상대가 알아차리는지는 별도로 확인해.'}`);
 add('love','연애하면 어떤 사람이 되는가',`${expressive?'호감이 생기면 반응과 표현이 분명해져. 같이 해볼 일과 만날 시간을 만들면서 마음을 보여줘.':introspective?'마음을 열기 전에는 생각이 길지만 가까워지면 상대의 사정까지 깊게 이해하려 해. 말하지 않은 기대가 쌓이지 않게 네 필요도 알려줘.':'연애에서도 반복되는 행동을 중요하게 봐. 잘 챙기고 시간을 내주는 일이 애정 표현이 되지만, 늘 네가 관계를 운영하는 구조는 지쳐.'} ${b==='묘'||b==='해'?'연락의 온도 변화가 크게 느껴져서 답이 짧아진 이유를 혼자 해석하는 시간이 길어져.':b==='축'||b==='미'||b==='술'?'가까워질수록 한번의 설렘보다 함께 지킬 생활과 약속을 더 중요하게 여겨.':'관계가 편해진 뒤에는 처음의 표현과 실제 생활이 이어지는지 확인해.'}`);
 add('confirm','사랑을 확인하는 방식',`${g==='비견'||g==='겁재'?'각자의 선택을 존중하면서도 중요한 순간에는 네 편에 서주는 행동이 필요해.':g==='편재'||g==='상관'?'네 이야기에 반응해주고 새로운 경험을 함께 즐기는 것이 사랑받는 느낌으로 이어져.':g==='정재'||group==='duty'?'한번 정한 약속이 바쁜 날에도 지켜질 때 마음이 놓여.':group==='thought'?'충분히 듣고 이유를 이해해주는 시간이 있어야 마음이 편해.':'매일의 작은 다정함이 끊기지 않을 때 애정을 안정적으로 느껴.'} ${hi==='금'?'특히 말과 행동이 맞아야 믿음이 오래가.':hi==='화'?'표현 없는 호의를 혼자 알아맞히는 관계는 힘이 빠져.':hi==='수'?'상대가 바쁜 이유를 알려주면 막연한 추측을 줄이는 데 도움이 돼.':'가끔 크게 해주는 일보다 감당 가능한 행동이 이어지는지를 봐.'}`);
 add('hurt','서운함을 처리하는 순서',`${introspective?'바로 따지기보다 왜 그랬을지 생각해. 이해할 이유를 찾다가 네 감정을 늦게 꺼내서 상대는 갑자기 서운해졌다고 오해해.':expressive?'반응이 먼저 바뀌고 하고 싶은 말이 빠르게 올라와. 상대가 내용보다 말투에 반응하면 원래 서운했던 일이 뒤로 밀려.':'처음에는 넘어가고 다음 행동을 기다려. 같은 일이 다시 생기면 이전에 말하지 않았던 실망까지 같이 떠올라.'} ${negative.length?'작은 실망을 이전 일까지 연결해 되짚기 쉬워. 이번에 일어난 사실과 아직 확인하지 않은 추측을 나눠 말해.':'강한 교차 긴장보다 기대를 말하지 않은 채 행동으로 채점하는 습관을 먼저 확인해.'}`);
 add('anger','화를 참는가, 바로 표현하는가',`${expressive?'불편한 점을 발견하면 말을 꺼내는 속도가 빨라. 특히 비효율과 앞뒤가 다른 설명을 오래 견디기 어려워.':hi==='금'?'처음에는 기준을 확인하지만 결론이 서면 말이 짧고 단호해져. 정확하게 말하려는 의도가 차가움으로 전달되는 지점이 있어.':responsibility?'참으면서 맡은 일을 계속하는 쪽이야. 한계가 오기 전까지 평소처럼 보이기 때문에 주변이 네 피로를 늦게 알아차려.':'겉으로 싸움을 키우기보다 혼자 거리를 두고 생각부터 정리해. 조용해진 순간을 이미 풀린 것으로 받아들이면 더 엇갈려.'} ${negative.some(x=>x.type==='충')?'화가 큰 날에는 생활을 통째로 바꾸거나 관계를 끝낼지까지 한꺼번에 정하지 마.':'그날 바꿀 행동 하나만 남기고 대화의 범위를 줄여.'}`);
 add('cold','정이 떨어지는 순간',`${group==='duty'?'책임을 말로만 약속하고 실제 부담은 네게 넘기는 일이 반복될 때 마음이 식어.':group==='thought'?'중요한 이유를 설명했는데도 별것 아니라며 가볍게 넘기는 일이 반복되면 더 말하고 싶지 않아져.':independent?'네 결정을 매번 허락받게 하거나 의견을 바꿀 기회를 주지 않을 때 관계에 정이 떨어져.':'받는 돌봄은 당연하게 여기면서 네 필요는 번번이 미루는 사람에게 피로가 쌓여.'} ${hi==='토'||hi==='금'?'한번의 실수보다 고칠 생각이 없는 반복이 결정적이야.':'사정이 있는 것과 같은 핑계를 계속 쓰는 건 구분해서 봐.'}`);
 add('cutoff','사람과 거리를 둘 때',`${introspective?'설득을 여러 번 시도하기보다 혼자 기대를 줄여가. 겉에서는 갑작스러운 거리두기로 보이지만 네 안에서는 오래 정리한 뒤야.':responsibility?'네가 할 수 있는 몫을 다 했는지 먼저 확인해. 그래서 정리하기 전까지는 오래 버티지만 끊은 뒤에는 같은 역할로 돌아가기 어려워.':'관계를 계속 이어갈 방법이 있는지 먼저 판단해. 대화와 행동이 바뀌지 않으면 만남이나 연락부터 줄이는 쪽이야.'} ${negative.some(x=>x.type==='해'||x.type==='파')?'작게 남은 실망이 다음 사건과 연결되지 않게, 거리를 두는 이유와 앞으로 가능한 범위를 분리해서 말해.':'연락을 줄이기 전에 지켜야 할 선을 한 문장으로 말하면 불필요한 추측을 줄일 수 있어.'}`);
 add('work','일할 때의 스타일',`${w[0]} ${HIGH[hi][1]} ${w[1]}`);
 add('career','직장과 사업 중 맞는 환경',`${independent?'네 판단이 결과에 직접 반영되는 자리에서 힘이 나. 조직에 있더라도 방법을 선택할 권한이 있는 일이 잘 맞아.':'기준과 역할이 분명하면서 네 전문성을 인정해주는 자리에서 실력이 쌓여. 조직인지 사업인지보다 책임에 맞는 권한이 있는지가 먼저야.'} ${hi==='수'||group==='thought'?'고객과 시장을 이해할 시간이 필요해서 검증 없이 크게 벌이는 방식은 부담이 커. 작은 유료 작업으로 수요부터 확인해.':'사업을 택한다면 매출이 아니라 반복 수요·남는 비용·일을 맡길 구조를 먼저 확인해. 독립적인 성향이 성공을 보장하는 건 아니야.'}`);
 add('money','돈을 버는 방식',`${INCOME[g]||INCOME.일간} ${hi==='금'?'정확도와 완성도를 알아주는 고객을 만들면 가격만으로 경쟁할 필요가 줄어.':hi==='토'?'운영과 유지에 강점을 쓰면 일회성 수입을 반복 수입으로 바꾸기 좋아.':hi==='화'?'표현과 실행이 바로 반응으로 이어지는 일을 통해 수요를 빠르게 확인해.':hi==='수'?'정보와 맥락을 분석한 결과를 구체적인 서비스로 만들어야 수입으로 이어져.':'확장할 아이디어 중 실제로 돈을 내는 수요가 있는 한 가지부터 남겨.'}`);
 add('leak','돈이 새는 패턴',`${group==='duty'?'급한 문제를 끝내려고 네 돈으로 대신 처리하는 지출을 먼저 봐. 책임을 지는 것과 비용까지 전부 내는 건 다른 일이야.':g==='편재'||g==='겁재'?'사람 약속과 새로운 기회가 늘 때 작은 지출이 한꺼번에 커져. 취소해도 되는 약속과 반드시 지킬 비용을 나눠.':group==='thought'?'준비와 배움에는 지출하면서 실제로 써먹는 시점을 미루는 비용을 봐. 추가 구매 전에 지난 준비가 결과로 이어졌는지 확인해.':'편하게 유지하려고 계속 내는 고정비와 중단 시기를 놓친 비용을 봐. 오래 냈다는 이유만으로 계속 낼 필요는 없어.'} ${lo==='금'?'거절 기준을 정하지 않으면 남의 부탁이 네 지출로 남아.':lo==='토'?'지출 기록을 생활 루틴으로 붙여야 작은 누수를 놓치지 않아.':'자동결제와 선결제 후 정산을 한 번에 확인해.'}`);
 add('stress','스트레스를 받으면 바뀌는 모습',`${STRESS[hi]} ${negative.some(x=>x.type==='형')?'끝난 대화를 다시 돌려보면서 제대로 말하지 못한 부분을 붙잡기 쉬워.':negative.some(x=>x.type==='충')?'하던 일을 통째로 바꾸고 싶어질 만큼 답답한 날에는 결정부터 미루고 당장 줄일 부담을 골라.':'더 잘해야 한다는 생각으로 쉬는 시간까지 점검 시간으로 만들지 마.'} 몸은 쉬는데 머릿속 업무가 끝나지 않는다면 해야 할 일과 지금 하지 않을 일을 따로 적어.`);
 add('recover','회복에 필요한 것',`${introspective?'혼자 생각할 시간을 확보한 뒤 걱정을 말이나 글로 밖에 꺼내야 머릿속 반복이 줄어.':expressive?'일정과 자극을 줄이고 잠·식사부터 되찾아. 감정이 빠른 날에는 쉬는 시간을 미루지 마.':responsibility?'책임의 범위를 줄여야 쉬는 시간에도 마음이 놓여. 누가 대신 맡을지까지 정해두는 게 필요해.':'완성해야 할 것과 충분히 괜찮은 것을 나눠. 끝내는 기준을 낮추는 일이 실력을 포기하는 건 아니야.'} ${lo==='화'?'필요한 도움을 생각만 하지 말고 짧게라도 직접 말해.':lo==='수'?'비어 있는 시간을 실패한 일정처럼 채우지 마.':'일주일 동안 실제로 유지할 수 있는 작은 회복 습관 하나를 남겨.'}`);
 let lk=null;try{lk=typeof root.currentLuck==='function'?root.currentLuck(c):null}catch(_){}
 add('timing','현재 삶에서 먼저 볼 흐름',lk?`지금 큰 흐름에서는 ${TIMING[lk.god]||'맡은 역할과 움직이는 환경을 같이 확인해.'} 평소의 ${group==='duty'?'책임감':independent?'자기 결정':group==='thought'?'깊게 생각하는 방식':'결과를 만드는 방식'}과 이 주제가 만나는 지점을 봐. ${lk.god===g?'익숙한 방식을 더 많이 쓰는 시기인 만큼 성과와 부담이 같이 늘지 않는지 점검해.':'평소에 익숙한 방식만 고집하기보다 새로 요구되는 역할을 얼마나 감당할지 정해.'} 가까운 연도와 달의 차이는 운 흐름 탭에서 따로 확인해.`:'현재 대운을 확정할 자료가 부족해서 지금의 흐름을 임의로 정하지 않을게. 출생 입력과 운 흐름 탭에서 확인 가능한 범위를 먼저 봐.',lk?`현재 대운 ${lk.ko} ${lk.god}`:'현재 대운 미확인');
 const inside=rows.find(x=>x.id==='inside');
 if(reflectScore>=3&&/정관|편관|정재/.test(privateGod))inside.body+=' 혼자 생각할 때도 결국 내가 놓친 책임이 없는지 점검해. 상대 기분까지 네가 관리해야 한다고 느끼는 순간부터 피로가 커져.';
 else if(expressScore>=3&&/비견|겁재|식신|상관/.test(privateGod))inside.body+=' 사람들이 반응해줄 때도 단순한 관심보다 네 판단이나 결과를 알아주는 말이 오래 남아. 네 뜻을 대신 정해버리는 칭찬은 달갑지 않아.';
 const work=rows.find(x=>x.id==='work');
 if(stars.has('문창귀인')&&/정인|편인|식신|상관/.test(g+privateGod))work.body+=' 생각을 글이나 설명, 눈에 보이는 결과물로 정리할 때 강점이 더 선명해져. 말로만 의견을 내기보다 검토할 수 있는 초안을 먼저 만들어.';
 if(roots>=2&&independent)rows.find(x=>x.id==='career').body+=' 익숙한 분야에서는 스스로 방향을 유지하는 힘이 있어. 다만 자신감과 시장 반응은 따로 확인하고 작은 규모에서 검증해.';
 return dedupe(rows);
}
function norm(s){return String(s||'').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');} function dedupe(rows){const seen=[];return rows.map(r=>{const ps=String(r.body||'').split(/\n\n+/).filter(Boolean);const keep=ps.filter(p=>{const k=norm(p);if(k.length<20)return true;if(seen.some(x=>x===k))return false;seen.push(k);return true;});return {...r,body:keep.join('\n\n')};});}
function pmodel(c){const base=typeof BaseExpert.personModel==='function'?BaseExpert.personModel(c):{};return {...base,version:'human-v4',human_reading:sections(c).map(s=>({id:s.id,title:s.title,body:s.body,evidence:s.evidence})),calculation_only:true};}
// Compatibility
function prof(c){const a=order(c);return {c,n:name(c),hi:a[0],lo:a[4],g:mg(c),b:branch(c),dm:c?.dayMaster?.el||c?.pillars?.day?.stemEl||'',stem:c?.dayMaster?.stem||c?.pillars?.day?.stem||''};}
function pairSeed(A,B,s){return hash([A.c?.pillars?.day?.ko,B.c?.pillars?.day?.ko,A.c?.pillars?.month?.ko,B.c?.pillars?.month?.ko,s].join('|'));} function pp(a,A,B,s){return a[pairSeed(A,B,s)%a.length];}

function pairSignature(A,B,tag){const a=A.c?.pillars?.month?.branch||'',b=B.c?.pillars?.month?.branch||'',ah=A.c?.pillars?.hour?.branch||'',bh=B.c?.pillars?.hour?.branch||'',as=A.c?.dayMaster?.stem||'',bs=B.c?.dayMaster?.stem||'',ay=A.c?.pillars?.year?.ko||'',by=B.c?.pillars?.year?.ko||'';const v=['둘이 가까워질수록 말보다 반복되는 행동이 더 중요해져.','좋을 때의 약속보다 바쁠 때 서로를 대하는 태도가 관계의 진짜 기준이 돼.','서로 다르다는 걸 고치려 하기보다 역할로 나누면 훨씬 편해져.','상대가 알아서 이해하겠지 하고 넘긴 부분이 쌓이면 나중에 더 크게 터져.','감정이 좋을 때보다 피곤할 때 어떤 방식으로 대하는지가 오래 가는 힘을 결정해.'];const stemLine=`${STEMSIG[as]||''} ${A.n}와 ${STEMSIG[bs]||''} ${B.n}는 같은 상황에서도 먼저 보는 지점이 달라.`;const yearTail=(hash(ay+'|'+by+'|'+tag)%2)?'서로의 방식을 고치려 들기보다 왜 그렇게 반응했는지부터 이해하는 게 빨라.':'누가 맞는지보다 다음에 같은 일이 생겼을 때 어떻게 할지를 정하는 게 더 중요해.';return `${MONTHSIG[a]||''} ${MONTHSIG[b]||''}. ${stemLine} ${v[pairSeed(A,B,tag)%v.length]} ${yearTail} ${ah!==bh?'둘이 회복하는 속도도 같다고 가정하지 않는 게 좋아.':'둘이 비슷하게 반응하는 만큼 동시에 고집을 세우지만 않으면 돼.'}`.replace(/\s+/g,' ').trim();}

function compatBuild(a,b,score){const A=prof(a),B=prof(b), same=A.hi[0]===B.hi[0], daySame=A.b===B.b; const old=BaseCompat.build&&BaseCompat.build!==compatBuild?BaseCompat.build(a,b,score):null; const meta=old?.meta||{}; const pos=meta.positiveSignals||[], ng=meta.negativeSignals||[]; const s=Number.isFinite(+score)?+score:null; const high=s!==null&&s>=85, low=s!==null&&s<65; const secs=[];
 secs.push({id:'core',category:'summary',title:'둘은 어떤 관계야?',body: high?`${A.n}와 ${B.n}는 서로에게 끌리는 힘뿐 아니라 관계를 다시 맞춰가는 힘도 강한 편이야. 처음부터 모든 게 똑같아서 편한 관계라기보다, 다른 부분이 있어도 결국 상대를 이해하려고 돌아오는 힘이 있어.`:low?`${A.n}와 ${B.n}는 좋아하는 마음만으로는 편하게 굴러가기 어려운 관계야. 서로가 사랑을 확인하는 방식과 문제를 처리하는 방식이 달라서, 마음은 있는데도 “왜 나만 노력하지?”라는 생각이 생기기 쉬워.`:`${A.n}와 ${B.n}는 끌림과 마찰이 같이 있는 관계야. 잘 맞을 때는 서로 부족한 부분을 채워주지만, 싸울 때는 같은 차이가 그대로 답답함으로 돌아와. 이 관계는 사랑의 크기보다 서로 다른 방식을 얼마나 이해하느냐가 오래 가는 힘을 결정해.`,evidence:`점수 ${s??'-'} · 중심 ${A.hi[0]}/${B.hi[0]}`});
 secs.push({id:'difference',category:'summary',title:'둘이 다르게 반응하는 이유',body:`${A.n}는 ${A.hi[0]==='화'?'생각이 서면 바로 말하고 움직이는 쪽':A.hi[0]==='수'?'충분히 생각한 뒤 움직이는 쪽':A.hi[0]==='금'?'무엇이 맞고 틀린지 기준부터 잡는 쪽':A.hi[0]==='토'?'현실적으로 누가 무엇을 책임질지 보는 쪽':'앞으로 어떻게 바꿀지 새 방향을 먼저 보는 쪽'}이고, ${B.n}는 ${B.hi[0]==='화'?'생각이 서면 바로 말하고 움직이는 쪽':B.hi[0]==='수'?'충분히 생각한 뒤 움직이는 쪽':B.hi[0]==='금'?'무엇이 맞고 틀린지 기준부터 잡는 쪽':B.hi[0]==='토'?'현실적으로 누가 무엇을 책임질지 보는 쪽':'앞으로 어떻게 바꿀지 새 방향을 먼저 보는 쪽'}이야. ${same?'둘이 비슷한 방식으로 반응해서 이해는 빠르지만, 싸울 때는 둘 다 자기 방식이 당연하다고 느끼기 쉬워.':'그래서 같은 사건을 겪어도 한쪽은 이미 결론을 냈는데 다른 한쪽은 아직 생각 중인 장면이 생겨.'}`,evidence:`중심 오행 ${A.hi[0]}/${B.hi[0]}`});
 secs.push({id:'love',category:'love',title:'사랑을 확인하는 방식',body:`${A.n}는 ${DAY[A.b]||'반복되는 행동에서 마음을 확인해.'} ${B.n}는 ${DAY[B.b]||'반복되는 행동에서 마음을 확인해.'} ${daySame?'둘의 기준이 닮아서 서로 원하는 걸 빨리 알아차릴 수 있지만, 기대치까지 똑같다고 생각하면 오해가 생겨.':'한 사람에게는 충분한 애정 표현이 다른 사람에게는 부족하게 느껴질 수 있어. “난 했잖아”보다 상대가 무엇을 사랑으로 받아들이는지를 보는 게 중요해.'}`,evidence:`일지 ${A.b}/${B.b}`});
 secs.push({id:'fight',category:'love',title:'싸우면 이렇게 엇갈려',body:`${A.n}는 ${A.hi[0]==='수'?'혼자 생각할 시간이 필요하고':A.hi[0]==='금'?'무엇이 잘못됐는지 분명히 정리돼야 풀리고':A.hi[0]==='토'?'말보다 실제 행동이 달라져야 마음이 풀리고':A.hi[0]==='화'?'감정이 올라온 순간 바로 말하고 싶어 하고':'앞으로 어떻게 바꿀지가 보여야 풀리고'}, ${B.n}는 ${B.hi[0]==='수'?'혼자 생각할 시간이 필요해':B.hi[0]==='금'?'잘못된 지점이 분명히 정리돼야 풀려':B.hi[0]==='토'?'실제 행동이 달라져야 마음이 풀려':B.hi[0]==='화'?'감정이 올라온 순간 바로 말하고 싶어 해':'앞으로 어떻게 바꿀지가 보여야 풀려'}. ${ng.length?'그래서 싸움이 커졌을 때 그 자리에서 관계 전체의 결론까지 내리면 상처가 오래 남아.':'큰 충돌 신호보다 말하는 타이밍이 문제를 키우기 쉬운 조합이야.'}`,evidence:`긴장 신호 ${ng.map(x=>x.type).slice(0,3).join('·')||'낮음'}`});
 secs.push({id:'money',category:'marriage',title:'돈과 생활에서 부딪히는 지점',body:`${A.n}는 ${MONEY[A.g]||MONEY.일간} ${B.n}는 ${MONEY[B.g]||MONEY.일간} 둘이 같이 살거나 공동지출이 생기면 누가 더 냈는지보다 누가 계속 계획하고, 누가 계속 결정하고, 누가 뒤처리를 하는지가 감정에 더 크게 남아. 한 사람이 계속 챙기는 구조가 되면 돈 문제처럼 보여도 실제로는 책임 문제로 싸우게 돼.`,evidence:`사회 작동 ${A.g}/${B.g}`});
 secs.push({id:'long',category:'marriage',title:'오래 만나려면',body: high?`이 둘은 좋은 감정만 유지하려고 애쓰기보다 서로 편해진 뒤에도 고마움을 표현하는 게 중요해. 잘 맞는다는 이유로 한 사람의 배려를 당연하게 여기지만 않으면 장기적으로 안정감이 커져.`:low?`이 관계는 참는 사람이 생기는 순간부터 급격히 힘들어져. 연락, 돈, 시간, 가족, 돌봄 중 반복해서 싸우는 한 가지를 그대로 두면 같은 갈등이 계속 돌아와. 사랑을 더 증명하는 것보다 그 한 가지 행동을 실제로 바꾸는 게 먼저야.`:`둘은 완벽하게 같은 사람이 아니라 맞춰갈 수 있는 사람들이야. 다만 서운한 걸 오래 모아두고 상대가 알아서 눈치채길 기다리면 관계가 급격히 차가워져. 작은 불편일 때 말하는 게 오래 가는 핵심이야.`,evidence:`점수 ${s??'-'}`});
  return {...(old||{}),meta:{...meta,version:'human-v4',score:s,aName:A.n,bName:B.n},sections:dedupe([...secs,...(old?.sections||[]).filter(r=>!secs.some(s=>s.id===r.id))])};}
function compatPick(x,tab){const s=x?.sections||[];if(!tab||tab==='summary')return s;if(tab==='love')return s.filter(v=>['core','difference','love','fight','long'].includes(v.id));if(tab==='marriage')return s.filter(v=>['core','difference','money','long'].includes(v.id));return s;}
function relationshipSections(x){
 const {A,B,m,d}=x,ar=sections(d.a||x.a||A.c),br=sections(d.b||x.b||B.c);
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const paragraph=t=>'<p>'+escape(t)+'</p>';
 const find=(rows,id)=>rows.find(r=>r.id===id)?.body||'';
 const compare=(id,rule)=>{const aa=find(ar,id),bb=find(br,id);return aa===bb?paragraph('두 사람에게 공통으로 중요한 부분이야. '+aa)+paragraph(rule):'<div class="r24Compare"><div><b>'+escape(A.name)+'</b>'+paragraph(aa)+'</div><div><b>'+escape(B.name)+'</b>'+paragraph(bb)+'</div></div>'+paragraph(rule)};
 const score=m.score,band=score<60?'좋은 마음이 있어도 자주 쓰는 반응이 상대에게 부담으로 돌아오는 구간이야. 반복해서 싸우는 한 가지가 실제로 줄어드는지부터 확인해야 해.':score<70?'호감과 생활의 편안함이 같은 속도로 자라지는 않는 구간이야. 데이트에서는 괜찮다가 일정·돈·개인시간이 겹칠 때 피로가 드러나는지 봐.':score<80?'함께 움직일 장점과 계속 맞춰야 할 부분이 같이 보여. 사이가 좋을 때 합의한 약속을 바쁜 날에도 지키는지가 관계의 체감을 갈라.':score<90?'서로 연결되는 장점이 비교적 뚜렷해. 익숙해질수록 잘 맞는 부분을 당연하게 여기기보다 각자 부담하는 몫이 공평한지 확인해.':'연결 신호와 생활 지수에서 장점이 많이 겹쳐 있어. 다만 편안하다는 이유로 말하지 않은 기대가 늘면 좋은 조합에서도 서운함이 생겨. 실제 선택까지 대신 결정하는 점수는 아니야.';
 const body={};
 body.conflict=compare('anger',`${A.name}에게 말을 더 해야 풀리는 순간과 ${B.name}에게 잠깐 멈춰야 하는 순간을 구분해. 한 사람이 답을 재촉하고 다른 사람이 설명 없이 사라지면 문제보다 버려졌다는 느낌이 커져. 대화를 멈출 때는 다시 얘기할 시간을 남겨.`)+paragraph(band);
 body.jealousy=compare('confirm','친구 약속을 허락받는 일로 만들기보다 일정이 바뀌었을 때 알릴 기준을 정해. 답장이 늦다는 사실과 관심이 줄었다는 해석은 따로 말해.');
 body.money=compare('money','수입 방식이 비슷해도 여유 자금까지 같지는 않아. 같이 쓸 예산과 각자 선택할 지출을 나누고 선결제한 금액은 정산 날짜까지 정해.');
 body.apology=compare('hurt','사과에서는 어떤 행동이 상대를 힘들게 했는지 먼저 인정해. 이유를 설명하는 말과 잘못을 인정하는 말을 한 문장에 섞으면 변명처럼 들리기 쉬워. 다음에 바꿀 행동 하나를 분명히 말해.');
 body.lifestyle=compare('close','같이 살면 누가 청소하는지뿐 아니라 누가 일정을 기억하고 부탁하는지도 부담이 돼. 집안일을 나눌 때는 시작부터 완료까지 한 사람이 맡는 일을 정해.');
 body.attraction=compare('love',d.q?.dayRel==='직접 관계 없음'?'일지 하나에서 강한 연결이 보이지 않아도 다른 위치의 합과 실제 반응으로 호감이 생겨. 초반의 설렘이 계속 지킬 수 있는 행동으로 이어지는지 봐.':`일지에서 ${d.q?.dayRel} 연결이 잡혀. 가까운 생활에서 맞물릴 여지를 보되, 첫 호감과 함께 살 때의 책임 분담은 따로 확인해.`);
 body.expect=compare('inside','겉으로 괜찮아 보인다고 필요한 것도 없다고 생각하지 마. 연락·만남·개인시간 중 서로 알아서 해주기를 기다리는 항목을 하나씩 말해.');
 body.talk=compare('people','상대 말을 듣자마자 결론내리기 전에 지금 필요한 게 공감인지 해결인지 물어봐. 실제 있었던 일, 그때 느낀 감정, 원하는 행동을 나눠 말하면 서로 다른 판단 기준을 번역하기 쉬워.');
 body.bored=compare('recover','둘이 같이 즐긴 시간과 각자 회복한 시간이 최근에 얼마나 있었는지 봐. 만남을 늘려야 하는 날과 혼자 쉬어야 다시 반가워지는 날을 구분해.');
 const family=p=>/정관|편관|정재/.test(p.god)?`${p.name}는 책임을 다하는 마음이 가까운 관계에서도 커져. 가족의 부탁을 거절하는 일과 사랑하지 않는다는 생각을 연결하지 말고, 두 사람이 감당할 시간과 비용부터 정해.`:/비견|겁재|상관|편재/.test(p.god)?`${p.name}는 가족이더라도 각자 결정할 영역이 필요해. 도와주기로 했다면 상대에게 통보하기 전에 공동 일정과 예산에 미치는 영향을 함께 확인해.`:`${p.name}는 상대 사정을 이해하려다 네 필요를 뒤로 미루지 않는 게 중요해. 가족을 돕는 사람도 휴식과 지원을 받을 몫이 있어.`;
 body.family=paragraph(family(A))+paragraph(family(B))+paragraph('돌봄이 필요한 날에 누가 대신할지까지 정해. 반려동물·가족의 급한 일이 한 사람의 기본 업무가 되면 두 사람 사이에도 피로가 남아.');
 body.break=compare('cold','지금 끝내고 싶은 게 관계인지 반복되는 행동인지 구분해. 한쪽이 경계를 여러 번 말했는데도 바뀌지 않으면 말보다 만남과 연락을 줄이는 방식으로 이별이 시작돼.');
 body.rebuild=compare('cutoff','다시 만나기로 했다는 말만으로 신뢰가 돌아오지는 않아. 깨졌던 약속 하나를 둘이 같은 말로 정의하고, 일주일 뒤에도 지킬 수 있는 행동으로 바꿔.');
 body.future=(d.years||[]).map(r=>{
  const fa=root.GuiinFortuneV2?.yearSignal(x.a,r.year),fb=root.GuiinFortuneV2?.yearSignal(x.b,r.year);
  const action={비견:'각자의 결정을 존중할 영역을 나눠',겁재:'함께 쓸 돈과 각자 부담할 몫을 다시 확인해',식신:'만남을 무리하게 늘리기보다 편하게 반복할 시간을 남겨',상관:'불편한 점을 쌓아두기 전에 바꿀 행동을 말해',편재:'새 약속을 잡기 전에 이미 정한 일정을 확인해',정재:'생활비와 고정비를 함께 살펴',편관:'급한 문제를 한 사람이 전부 떠맡지 않게 역할을 정해',정관:'주거·일·관계에서 맡을 책임을 말로 합의해',편인:'혼자 생각할 시간과 다시 대화할 시간을 같이 정해',정인:'도움이 필요한 부분을 상대가 알아맞히게 두지 마'};
  const ay=fa?.god,by=fb?.god;
  const clash=[...(fa?.relations||[]),...(fb?.relations||[])].some(v=>/충|형|해|파/.test(v));
  return paragraph(`${r.year}년 · ${A.name}: ${action[ay]||r.labelA}. ${B.name}: ${action[by]||r.labelB}. ${clash?'원국과 부딪히는 신호도 있어 큰 결정을 한날에 몰지 말고 실제 일정과 예산을 다시 확인해.':'서로 지원할 여유가 있는지 보고 함께 진행할 일 하나를 정해.'}`)+`<details class="r23Evidence"><summary>이 해의 계산 근거</summary>${escape(`${A.name}: ${fa?.pillar||'-'} ${ay||'-'} ${fa?.relations?.join('·')||'직접 마찰 미확인'} / ${B.name}: ${fb?.pillar||'-'} ${by||'-'} ${fb?.relations?.join('·')||'직접 마찰 미확인'}`)}</details>`;
 }).join('')||x.legacyFuture;
 body.timing=compare('timing','둘 다 바쁜 시기에는 만날 시간을 줄이는 대신 어떤 방식으로 연결을 유지할지 정해. 주거·돈·직업 같은 큰 결정은 감당할 자원과 책임을 확인한 뒤 하나씩 진행해.');
 return body;
}

function timingSections(c){
 const f=root.GuiinFortuneV2;if(!f)return [];
 const kst=new Date(Date.now()+9*3600000),year=kst.getUTCFullYear(),month=kst.getUTCMonth()+1,rows=[];
 const explain=(sig,scope)=>{
  if(!sig)return;
  const raw=sig.relations||[],types=[...new Set(raw.map(r=>typeof r==='string'?r:r?.type).filter(Boolean))];
  const core=TIMING[sig.god]||'결정할 일의 순서와 지금 쓸 자원을 먼저 확인해.';
  const tension=types.find(t=>['충','형','해','파'].includes(t));
  const relation=tension==='충'?'일정이나 역할을 바꿀 때 기존 약속에 미치는 영향을 함께 확인해.':tension==='형'?'같은 문제를 버티기만 하지 말고 처리 순서나 맡을 사람을 바꿔.':tension==='해'?'말하지 않은 전제를 확인하는 대화가 필요해. 괜찮다고 넘긴 부담까지 구체적으로 물어봐.':tension==='파'?'계획에 작은 수정이 생겨도 다시 맞출 시간과 예산을 남겨.':types.some(t=>['육합','천간합','삼합'].includes(t))?'함께 진행할 일이 있다면 말로만 동의하지 말고 담당과 완료 기준까지 합의해.':'큰 결론보다 이번 기간에 끝낼 일의 범위를 정해.';
  const god=sig.god||'';
  const subject=/재/.test(god)?'돈과 생활':/관/.test(god)?'일과 책임':/인/.test(god)?'배움과 준비':/식신|상관/.test(god)?'결과물과 표현':'선택권과 협업';
  rows.push({id:'timing-'+scope,title:scope+' · '+subject,eyebrow:scope,body:(scope==='현재 대운'?'오래 유지할 일과 생활의 운영 방식을 정하는 배경이야. ':scope.endsWith('월')?'지금 잡힌 약속과 마감 안에서 먼저 정리할 일이야. ':'이번 해의 우선순위를 정할 때 먼저 확인할 주제야. ')+core+' '+relation,evidence:sig.evidence||[sig.pillar,god,types.join('·')].filter(Boolean).join(' · ')});
 };
 const luck=f.currentLuck(c);if(luck)explain({god:luck.god,pillar:luck.ko,relations:root.GuiinSaju.relationsWithTransit(c.pillars,luck),evidence:`현재 대운 ${luck.ko} ${luck.god}`},'현재 대운');
 for(let y=year;y<year+4;y++)explain(f.yearSignal(c,y),y+'년');
 for(let m=month;m<=12;m++)explain(f.monthSignal(c,year,m),year+'년 '+m+'월');
 return rows;
}

function fortuneActions(c,period='today'){
 const kst=new Date(Date.now()+9*3600000),date=new Date(Date.UTC(kst.getUTCFullYear(),kst.getUTCMonth(),kst.getUTCDate(),3));
 const f=root.GuiinFortuneV2?.flow(c,date);if(!f)return null;
 let god=f.gods?.day,evidence='';
 if(period==='month'){const m=root.GuiinFortuneV2.monthSignal(c,kst.getUTCFullYear(),kst.getUTCMonth()+1);god=m?.god||'';evidence=m?.evidence||'';}
 if(period==='week'){const counts={},pillars=[];for(let i=0;i<7;i++){const d=new Date(date.getTime()+i*86400000),v=root.GuiinFortuneV2.flow(c,d),g=v?.gods?.day;if(g)counts[g]=(counts[g]||0)+1;if(v?.pillars?.day?.ko)pillars.push(v.pillars.day.ko);}god=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';evidence='7일 일운 '+pillars.join('·')+' / 반복 주제 '+god;}
 const money=/편재|겁재/.test(god)?'사람 약속이나 새 제안에 돈을 쓰기 전에 이번에 쓸 한도를 정해.':/정재|정관/.test(god)?'이번에 확정할 비용과 자동으로 나가는 비용을 나눠 확인해.':/정인|편인/.test(god)?'준비를 위한 구매 전에 이미 가진 자료와 도구부터 실제로 써봐.':'급하게 비용을 대신 내기 전에 누가 정산할지와 날짜를 확인해.';
 const love=/비견|겁재/.test(god)?'상대가 정할 영역까지 대신 결정하지 말고 함께 상의할 한 가지를 골라.':/정관|편관/.test(god)?'부탁을 받으면 해줄 수 있는 양과 어려운 부분을 한 문장으로 알려줘.':/정인|편인/.test(god)?'혼자 해석한 마음을 결론으로 말하기 전에 실제로 어떤 뜻이었는지 물어봐.':'다정함을 크게 약속하기보다 이번 일정에서 지킬 작은 행동 하나를 정해.';
 return {god,period,actions:[TIMING[god]||'먼저 끝낼 일을 하나 고르고 완료 기준을 정해.',money,love],evidence:evidence||[f.pillars?.year?.ko&&f.pillars.year.ko+' 세운',f.pillars?.month?.ko&&f.pillars.month.ko+' 월운',f.pillars?.day?.ko&&f.pillars.day.ko+' 일운',god].filter(Boolean).join(' · ')};
}

root.GuiinExpert={...BaseExpert,fortuneActions,timingSections,relationshipSections,fullSections:sections,personalitySections:c=>sections(c).filter(s=>!['work','career','money','leak','timing'].includes(s.id)),fieldSections:c=>sections(c).filter(s=>['work','career','money','leak','love','timing'].includes(s.id)),personModel:pmodel};
root.GuiinCompat={...BaseCompat,build:compatBuild,pick:compatPick};
root.GUIIN_INTERPRETATION_V4={version:'human-v4',rules:{humanFirst:true,jargonInBody:false,confidentTone:true,repeatCards:false}};
})(typeof globalThis!=='undefined'?globalThis:this);
