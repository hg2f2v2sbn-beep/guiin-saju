/* GUIIN v6.29 · quality + trust + conversion + revisit
   Additive only: does not alter saju/compatibility calculation engines, payment accounting, IDs or core navigation.
*/
(function(){
'use strict';
if(window.__GUIIN_GROWTH_V629__) return;
window.__GUIIN_GROWTH_V629__=true;

const $=id=>document.getElementById(id);
const q=(sel,root=document)=>root.querySelector(sel);
const qa=(sel,root=document)=>[...root.querySelectorAll(sel)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const plain=s=>String(s??'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const isDemo=()=>/\/demo\.html(?:$|\?)/.test(location.pathname+location.search)||!!document.querySelector('.guiinDemoBadge');
const chartReady=()=>!!(window.chart&&window.chart.pillars);
function after(el,node){if(el?.parentNode)el.parentNode.insertBefore(node,el.nextSibling)}
function toast(msg){try{if(typeof window.guiinMiniToast==='function')return window.guiinMiniToast(msg)}catch(_){};let el=$('v629Toast');if(!el){el=document.createElement('div');el.id='v629Toast';el.className='v629Toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('on'),1800)}
function safeGo(id){try{if(typeof window.go==='function')window.go(id)}catch(_){}}
function sentence(s,n=120){const t=plain(s);if(!t)return '';const m=t.match(/^(.{10,}?)(?:[.!?](?:\s|$)|$)/);return (m?.[1]||t).slice(0,n).replace(/[.!?]+$/,'')+'다.'}
function casualSentence(s,n=120){return sentence(s,n).replace(/합니다\.$/,'해.').replace(/됩니다\.$/,'돼.').replace(/입니다\.$/,'이야.').replace(/다\.$/,'어.');}

/* 1. 결과 문장 최종 QA */
function normalizeKnownText(root){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const p=node.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});
 const fixes=[
   ['임가 천간에','임이 천간에'],
   ['보완 후보는 화 순서야','보완할 때는 화 기운을 먼저 살펴봐.'],
   ['확인해 보세요.','확인해봐.'],['알아보세요.','알아봐.'],['살펴보세요.','살펴봐.'],
   ['나타날 수 있습니다.','나타날 수 있어.'],['볼 수 있습니다.','볼 수 있어.'],['확인할 수 있습니다.','확인할 수 있어.'],
   ['중요합니다.','중요해.'],['필요합니다.','필요해.'],['도움이 됩니다.','도움이 돼.']
 ];
 let node;while(node=walker.nextNode()){
   let t=node.nodeValue||'',o=t;
   for(const [a,b] of fixes)t=t.split(a).join(b);
   if(t!==o)node.nodeValue=t;
 }
}
function removeDuplicateCompare(root){
 if(!root)return;
 const old=qa('[data-guiin-freepaid]',root), core=qa('.premiumCompare',root);
 if(core.length)old.forEach(x=>x.remove());
 if(old.length>1)old.slice(1).forEach(x=>x.remove());
 const seen=new Set();qa('.guiinContextAsk',root).forEach(x=>{const k=plain(x.textContent);if(seen.has(k))x.remove();else seen.add(k)});
}
function metricClarifier(root){
 if(!root||q('.v629MetricNote',root))return;
 const txt=plain(root.textContent);
 if(!/통합 강약|지지력|득지|뿌리 지지력/.test(txt))return;
 const note=document.createElement('div');note.className='v629MetricNote card';note.innerHTML='<b>수치가 서로 달라 보여도 오류는 아니야.</b><p><strong>통합 강약</strong>은 원국 전체 구조를, <strong>일간·뿌리 지지력</strong>은 내가 버티는 힘의 일부를 따로 보는 지표라 계산 기준이 달라. 숫자 하나보다 여러 근거가 같은 방향을 가리키는지 같이 봐.</p>';
 const anchor=q('.guiinReadingTools',root)||root.firstElementChild;if(anchor)after(anchor,note);else root.prepend(note);
}
function qualityScan(root){
 if(!root)return {ok:false,issues:['missing_root']};
 const issues=[];
 const txt=plain(root.textContent);
 if(/임가 천간/.test(txt))issues.push('typo_imga');
 if(/보완 후보는 화 순서/.test(txt))issues.push('awkward_phrase');
 if(qa('[data-guiin-freepaid]',root).length+qa('.premiumCompare',root).length>1)issues.push('duplicate_free_paid');
 const blank=qa('.easyLongCard,.compatDetailCard,.r23Section,.r24Section',root).filter(x=>plain(x.textContent).length<20).length;if(blank)issues.push('blank_cards:'+blank);
 const out={version:'v6.29',ok:issues.length===0,issues,at:new Date().toISOString()};
 try{sessionStorage.setItem('guiin_v629_content_qa',JSON.stringify(out))}catch(_){}
 if(issues.length)console.warn('GUIIN_V629_CONTENT_QA',out);
 return out;
}

/* 2. 결과 맨 위 3줄 핵심 요약 */
function profileData(){
 let p={};try{if(chartReady()&&typeof window.sajuInsightProfile==='function')p=window.sajuInsightProfile(window.chart)||{}}catch(_){}
 return p||{};
}
function currentLuckData(){try{return chartReady()&&typeof window.currentLuck==='function'?(window.currentLuck(window.chart)||{}):{}}catch(_){return {}}}
function summaryLines(){
 const p=profileData(),lk=currentLuckData(),name=window.chart?.input?.name||'나';
 let who=plain(p.core||p.gift||'내 기준과 생활 리듬을 함께 쓰는 사람으로 읽혀.').slice(0,125);
 let now='지금은 한 가지 운만 단정하기보다 현재 대운과 올해 흐름을 함께 보는 게 중요해.';
 if(lk?.god)now=`현재 대운에서는 ${lk.god} 주제가 두드러져. 이 기운이 일·관계·결정에서 어떻게 쓰이는지 같이 봐.`;
 let advice=plain(p.firstPath||p.gift||'강점이 실제 생활에서 반복해서 쓰이는 환경을 만드는 게 중요해.').slice(0,125);
 return {name,who,now,advice};
}
function installThreeLine(){
 const root=$('resultView');if(!root||!chartReady())return;
 q('.v629ThreeLine',root)?.remove();
 const d=summaryLines();const box=document.createElement('section');box.className='v629ThreeLine card';box.innerHTML=`<div class="v629Eyebrow">먼저 10초 요약</div><h3>${esc(d.name)}님의 사주 핵심 3줄</h3><div class="v629ThreeRows"><div><b>나는</b><span>${esc(d.who)}</span></div><div><b>지금</b><span>${esc(d.now)}</span></div><div><b>한마디</b><span>${esc(d.advice)}</span></div></div>`;
 const tools=q('.guiinReadingTools',root);if(tools)after(tools,box);else root.prepend(box);
}

/* 3. 왜 이렇게 읽었어? 근거 보기 */
function fallbackEvidence(kind){
 if(kind==='compat')return '두 사람의 일간·월령·오행·원국 관계 신호와 현재 흐름을 함께 비교한 결과야. 궁합 점수 하나만으로 결론내리지 않아.';
 const p=profileData(),c=window.chart||{},parts=[];
 const dm=c?.dayMaster?.stem||c?.pillars?.day?.stem;if(dm)parts.push(`일간 ${dm}`);
 const mg=c?.pillars?.month?.god||p?.mg;if(mg)parts.push(`월간 십성 ${mg}`);
 if(p?.top)parts.push(`중심 오행 ${p.top}`);
 const lk=currentLuckData();if(lk?.god)parts.push(`현재 대운 ${lk.god}`);
 return (parts.length?parts.join(' · '):'일간·월령·오행·십성·원국 관계')+'를 한꺼번에 놓고 읽은 근거야.';
}
function installEvidence(root,kind){
 if(!root)return;
 const cards=qa('.easyLongCard,.deepCard,.compatDetailCard,.r23Section,.r24Section',root);
 const rank=card=>{const t=plain(card.textContent);let s=0;['성격','관계','연애','직업','재물','대운','세운','궁합','갈등','결혼'].forEach(k=>{if(t.includes(k))s+=2});if(q('.easyEvidence,.compatEvidence',card))s+=3;return s};
 cards.sort((a,b)=>rank(b)-rank(a));let used=0;
 cards.forEach(card=>{
   q('.v629Why',card)?.remove();if(used>=6||rank(card)<2)return;
   const ev=q('.easyEvidence,.compatEvidence',card);const txt=plain(ev?.textContent)||fallbackEvidence(kind);
   const wrap=document.createElement('details');wrap.className='v629Why';wrap.innerHTML=`<summary>왜 이렇게 읽었어?</summary><div>${esc(txt.slice(0,420))}</div>`;card.appendChild(wrap);used++;
 });
}

/* 4. 무료 → 프리미엄 연결을 한 번만, 구체적으로 */
function installPremiumBridge(kind){
 if(isDemo())return;
 const root=$(kind==='compat'?'matchView':'resultView');if(!root)return;
 q('.v629PremiumBridge',root)?.remove();
 let paid=false;try{paid=kind==='compat'?!!window.hasPremiumCompat?.():!!window.hasPremiumLifetime?.()}catch(_){}
 if(paid)return;
 const box=document.createElement('section');box.className='v629PremiumBridge card';
 const compat=kind==='compat';box.innerHTML=`<div class="v629Eyebrow">무료에서 본 다음 내용</div><h3>${compat?'점수 다음에는 실제 생활 장면으로 이어져.':'핵심 다음에는 “왜 그런지·언제 강해지는지”로 이어져.'}</h3><div class="v629BridgeGrid"><div><b>지금 무료로 확인</b><span>${compat?'기본 궁합 · 강점 · 조율 포인트':'만세력 · 오행 · 기본 성향 · 일부 흐름'}</span></div><div class="paid"><b>프리미엄에서 이어서</b><span>${compat?'연락 · 싸울 때 · 질투 · 돈 · 동거 · 결혼 · 가족':'관계 패턴 · 직업/재물 · 귀인 · 대운/세운 · 연월 타이밍'}</span></div></div><button type="button">${compat?'프리미엄 궁합 자세히 보기':'프리미엄 평생사주 자세히 보기'}</button>`;
 box.querySelector('button').onclick=()=>{try{compat?window.openCompatPay?.():window.openPremiumPay?.()}catch(_){safeGo('paymentInfo')}};
 const lock=q('.premiumLock',root),preview=q('.premiumPreview',root);if(lock)lock.parentNode.insertBefore(box,lock);else if(preview)after(preview,box);else root.appendChild(box);
}

/* 5. AI 연결 버튼은 정말 필요한 카드에만 */
function questionForCard(text,kind){
 if(kind==='compat')return '이 궁합 결과에서 말한 부분을 두 사람 명식 근거와 실제 생활 장면으로 더 자세히 풀어줘.';
 if(/직업|사업|재물|돈/.test(text))return '이 결과를 내 실제 직업·사업·돈 선택에 어떻게 적용하면 좋은지 명식 근거와 함께 봐줘.';
 if(/연애|관계|권태|가족|친밀/.test(text))return '이 결과가 가까운 관계에서 어떤 반복 패턴으로 나타나는지, 내가 바꿀 수 있는 행동까지 봐줘.';
 if(/대운|세운|월운|시기|흐름/.test(text))return '이 결과가 앞으로 언제 더 강해지는지 계산된 시기와 현실 행동을 연결해서 봐줘.';
 return '이 결과가 왜 나왔는지 내 명식 근거 2개 이상과 실제 생활 예시로 더 자세히 설명해줘.';
}
function refineContextAI(root,kind){
 if(!root)return;qa('.guiinContextAsk',root).forEach(x=>x.remove());
 const cards=qa('.easyLongCard,.deepCard,.compatDetailCard,.r23Section,.r24Section',root).filter(c=>/성격|관계|연애|직업|사업|재물|돈|대운|세운|흐름|갈등|결혼/.test(plain(c.textContent))).slice(0,5);
 cards.forEach(card=>{const text=plain(card.textContent);const d=document.createElement('div');d.className='v629Ask';d.innerHTML='<button type="button">AI에게 이 부분 더 물어보기 ›</button>';d.querySelector('button').onclick=()=>{const qq=questionForCard(text,kind);try{if(typeof window.guiinOpenAIWithQuestion==='function')window.guiinOpenAIWithQuestion(qq);else{safeGo('ask');setTimeout(()=>{const inp=$('askQ');if(inp)inp.value=qq},80)}}catch(_){}};card.appendChild(d)});
}

/* 6. 궁합: 실제 생활 장면 8개 */
function compatSections(){
 const a=window.matchAnalysis?.a||window.matchAnalysis?.left||window.matchMeta?.a,b=window.matchAnalysis?.b||window.matchAnalysis?.right||window.matchMeta?.b;if(!a||!b)return [];
 let s=[];try{if(typeof window.compatDeepSections==='function')s=s.concat(window.compatDeepSections(a,b)||[])}catch(_){};try{if(typeof window.compatRelationshipExtraSections==='function')s=s.concat(window.compatRelationshipExtraSections(a,b)||[])}catch(_){};return s;
}
function sectionSnippet(keys,fallback){const ss=compatSections();for(const k of keys){const sec=ss.find(x=>x?.key===k);const t=plain(sec?.b||sec?.tip||'');if(t)return t.slice(0,230)}return fallback}
function installLifeCompat(){
 const root=$('matchView');if(!root||!window.matchAnalysis)return;
 q('.v629LifeCompat',root)?.remove();let paid=false;try{paid=!!window.hasPremiumCompat?.()}catch(_){}
 const scenes=[
  ['연락',['communication','attachment'],'연락 횟수보다 서로가 안심되는 방식과 갈등 뒤 다시 연결되는 속도를 같이 봐.'],
  ['싸울 때',['clash','communication'],'피곤할 때 차이가 어떻게 갈등으로 바뀌는지와 회복 속도를 봐.'],
  ['애정표현',['attraction','love'],'좋아하는 마음을 어떤 행동으로 표현하고 확인하는지 비교해.'],
  ['질투',['attachment','mutualView'],'불안할 때 확인 행동이 어떻게 달라지는지 보는 장면이야.'],
  ['돈',['money','workMoney'],'수입보다 소비·저축·역할분담 기준이 어디서 달라지는지 봐.'],
  ['동거',['marriage','fit'],'생활 리듬과 집안일·개인시간을 어떻게 나누면 편한지 봐.'],
  ['가족',['family','marriage'],'가족 경계와 책임이 둘 사이에 어떤 부담으로 들어오는지 봐.'],
  ['혼자시간',['boredom','commitment','intimacy'],'가까움과 각자 쉬는 시간이 어느 정도 필요할지 비교해.']
 ];
 const box=document.createElement('section');box.className='v629LifeCompat card';box.innerHTML='<div class="v629Eyebrow">생활형 궁합</div><h3>점수보다 실제로 같이 있을 때를 봐.</h3><div class="v629SceneChips"></div><div class="v629SceneBody">장면을 누르면 두 사람 명식에서 그 부분만 골라 보여줄게.</div>';
 const chips=q('.v629SceneChips',box),body=q('.v629SceneBody',box);
 scenes.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=s[0]+((!paid&&i>1)?' 🔒':'');b.onclick=()=>{if(!paid&&i>1){body.innerHTML='이 장면은 프리미엄 궁합에서 두 사람의 실제 계산값으로 이어서 볼 수 있어. <button type="button" class="v629InlinePay">프리미엄 궁합 보기</button>';q('.v629InlinePay',body).onclick=()=>window.openCompatPay?.();return}body.textContent=sectionSnippet(s[1],s[2]);qa('button',chips).forEach(x=>x.classList.toggle('on',x===b))};chips.appendChild(b)});
 const anchor=q('.matchHero',root)||q('.easyIntro',root)||root.firstElementChild;if(anchor)after(anchor,box);else root.prepend(box);
}

/* 7. 저장/공유 가능한 결과 카드 */
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=4){const chars=[...String(text)];let line='',lines=[];for(const ch of chars){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch;if(lines.length>=maxLines-1)break}else line=test}if(line&&lines.length<maxLines)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));return y+lines.length*lineHeight}
function cardPayload(type){
 const name=window.chart?.input?.name||window.matchMeta?.a?.input?.name||'나';
 if(type==='compat')return {eyebrow:'우리 궁합',title:`${name}님의 궁합`,big:`${window.matchMeta?.score??'–'}점`,lines:[window.matchMeta?.good||'서로 다른 강점이 어떻게 보완되는지 봐.',window.matchMeta?.watch||'점수보다 반복되는 생활 패턴을 함께 확인해.']};
 const p=profileData();let pct={};try{if(window.GuiinExpert?.pct&&chartReady())pct=window.GuiinExpert.pct(window.chart)||{}}catch(_){}
 if(type==='elements')return {eyebrow:'내 오행',title:`${name}님의 오행 포인트`,big:p.top?`${p.top} 중심`:'오행 균형',lines:[`목 ${Math.round(pct['목']||0)}% · 화 ${Math.round(pct['화']||0)}% · 토 ${Math.round(pct['토']||0)}%`,`금 ${Math.round(pct['금']||0)}% · 수 ${Math.round(pct['수']||0)}%`,p.gift||'많고 적음보다 어떤 기능을 자주 쓰는지가 중요해.']};
 return {eyebrow:'내 사주 한줄',title:`${name}님의 사주 사용설명서`,big:p.top?`${p.top}의 강점`:'나의 강점',lines:[p.core||'일간 하나가 아니라 전체 구조로 나를 읽어.',p.gift||'내 장점이 반복해서 쓰이는 환경을 찾아.',p.firstPath||'지금의 흐름과 현실 선택을 함께 봐.']};
}
async function createShareCard(type){
 const c=document.createElement('canvas');c.width=1080;c.height=1350;const ctx=c.getContext('2d'),d=cardPayload(type);
 const grad=ctx.createLinearGradient(0,0,1080,1350);grad.addColorStop(0,'#fffdf7');grad.addColorStop(1,type==='compat'?'#fff1f5':'#eef7ea');ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1350);
 ctx.fillStyle='#0d5b46';ctx.font='800 54px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';ctx.fillText('☘ 귀인사주',70,100);
 ctx.fillStyle='#9a7a2e';ctx.font='700 32px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';ctx.fillText(d.eyebrow,70,190);
 ctx.fillStyle='#173f2d';ctx.font='900 74px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';wrapCanvasText(ctx,d.title,70,285,940,88,2);
 ctx.fillStyle=type==='compat'?'#df426e':'#c29127';ctx.font='900 96px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';ctx.fillText(d.big,70,520);
 ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.08)';ctx.shadowBlur=22;ctx.fillRect(58,590,964,520);ctx.shadowBlur=0;
 let y=690;ctx.fillStyle='#2d493c';ctx.font='700 38px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';for(const line of d.lines.filter(Boolean).slice(0,4)){ctx.fillStyle='#2d493c';ctx.fillText('•',90,y);ctx.font='600 36px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';y=wrapCanvasText(ctx,line,135,y,820,55,3)+34;ctx.font='700 38px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif'}
 ctx.fillStyle='#0d5b46';ctx.font='800 38px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';ctx.fillText('gwiinsaju.com',70,1245);ctx.fillStyle='#6f756f';ctx.font='500 27px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';ctx.fillText('좋은 인연이, 좋은 운을 만듭니다.',70,1292);
 const blob=await new Promise(r=>c.toBlob(r,'image/png',.95));if(!blob){toast('이미지 생성에 실패했어.');return}
 const file=new File([blob],`귀인사주-${type}-${Date.now()}.png`,{type:'image/png'});
 try{if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'귀인사주 결과 카드'});return}}catch(e){if(e?.name==='AbortError')return}
 const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2500);toast('결과 카드를 이미지로 저장했어.');
}
window.guiinCreateShareCard=createShareCard;
function installShareHub(kind){
 const root=$(kind==='compat'?'matchView':'resultView');if(!root)return;q('.v629ShareHub',root)?.remove();
 const box=document.createElement('section');box.className='v629ShareHub card';box.innerHTML=`<div class="v629Eyebrow">친구에게 보여주기</div><h3>내 결과를 한 장으로 저장해.</h3><p>생년월일은 넣지 않고 핵심 결과와 귀인사주 주소만 담아.</p><div class="v629ShareActions">${kind==='compat'?'<button data-card="compat">우리 궁합 카드</button>':'<button data-card="summary">내 사주 한줄</button><button data-card="elements">오행 카드</button>'}</div>`;qa('[data-card]',box).forEach(b=>b.onclick=()=>createShareCard(b.dataset.card));root.appendChild(box);
}

/* 8. 재방문 이유: 오늘/주간/월간 바로가기 */
function openFortune(period){if(!chartReady()){safeGo('saju');toast('먼저 내 사주를 입력하면 운세를 볼 수 있어.');return}try{window.renderToday?.();safeGo('today');setTimeout(()=>window.renderFortunePeriod?.(period),40)}catch(_){safeGo('today')}}
window.guiinOpenFortuneV629=openFortune;
function installRevisitHub(){
 const home=$('home');if(!home||q('.v629Revisit',home))return;const box=document.createElement('section');box.className='v629Revisit card';box.innerHTML='<div><div class="v629Eyebrow">다시 들어올 이유</div><h3>오늘 말고, 이번 주·이번 달도 바로 봐.</h3><p>매번 평생사주를 다시 읽지 않아도 가까운 흐름만 빠르게 확인할 수 있어.</p></div><div class="v629RevisitActions"><button data-p="today">오늘</button><button data-p="week">이번 주</button><button data-p="month">이번 달</button></div>';qa('[data-p]',box).forEach(b=>b.onclick=()=>openFortune(b.dataset.p));const hero=q('.homeHero',home);if(hero)after(hero,box);else home.appendChild(box);
}

/* 9. 첫 방문 온보딩 3개만 */
function closeOnboard(mark=true){q('.v629Onboard')?.remove();if(mark)try{localStorage.setItem('guiin_onboard_v629_seen','1')}catch(_){}}
function showOnboard(){
 if(q('.v629Onboard'))return;try{if(localStorage.getItem('guiin_onboard_v629_seen')==='1')return}catch(_){}
 const el=document.createElement('div');el.className='v629Onboard';el.innerHTML='<div class="v629OnboardPanel"><button class="v629Close" aria-label="닫기">×</button><div class="v629Eyebrow">귀인사주 처음이라면</div><h2>딱 3개만 기억하면 돼.</h2><p>기능이 많아 보여도 처음에는 여기서 시작하면 돼.</p><button class="v629Start primary" data-go="saju"><b>내 사주 무료로 보기</b><span>만세력·오행·기본 성향부터</span></button><button class="v629Start" data-go="match"><b>우리 궁합 보기</b><span>두 사람의 끌림과 조율 포인트</span></button><button class="v629Start" data-go="ask"><b>AI에게 물어보기</b><span>내 사주를 기준으로 이어서 상담</span></button><button class="v629Skip">일단 둘러볼게</button></div>';
 document.body.appendChild(el);q('.v629Close',el).onclick=()=>closeOnboard();q('.v629Skip',el).onclick=()=>closeOnboard();qa('.v629Start',el).forEach(b=>b.onclick=()=>{const id=b.dataset.go;if(id==='ask'&&!chartReady()){safeGo('saju');toast('AI 상담 전에 내 사주부터 입력해줘.')}else safeGo(id);closeOnboard()});
}
window.guiinResetOnboarding=()=>{try{localStorage.removeItem('guiin_onboard_v629_seen')}catch(_){};showOnboard()};

/* 10. 라이브 전 운영 QA - 자동 점검 가능한 범위 */
async function launchQA(){
 const checks=[];const push=(name,ok,detail='')=>checks.push({name,ok:!!ok,detail});
 push('모바일 viewport',!!q('meta[name="viewport"]'));
 push('핵심 화면 DOM',!!$('saju')&&!!$('resultView')&&!!$('matchView')&&!!$('askQ'));
 push('결제 복구 UI',!!$('guiinPayRecovery'));
 push('AI 카운터 UI',!!$('freeRemainView')&&!!$('coinView'));
 push('공유 카드 기능',typeof window.guiinCreateShareCard==='function');
 push('브라우저 저장소',(()=>{try{localStorage.setItem('__gq','1');localStorage.removeItem('__gq');return true}catch(_){return false}})());
 let health=null;try{const base=typeof window.GUIIN_API_BASE!=='undefined'?window.GUIIN_API_BASE:'https://guiin-saju-api.blue-wls.workers.dev';const r=await fetch(base+'/health',{cache:'no-store'});health=await r.json();push('Worker health',!!health?.ok,health?.version||'');push('서버 회계',!!health?.serverAccountingReady);push('결제는 아직 안전하게 비활성',health?.paymentsEnabled===false&&health?.liveCheckoutReady===false,`mode=${health?.tossKeyMode||'-'}`)}catch(e){push('Worker health',false,String(e?.message||e))}
 const ua=navigator.userAgent;push('현재 브라우저 정보 기록',true,ua.slice(0,130));
 const out={version:'v6.29',ok:checks.every(x=>x.ok),checks,health,manual:['iPhone Safari 실제 화면','카카오 인앱브라우저 실제 화면','로그인 만료 후 복구','결제창에서 뒤로가기','결제버튼 연속 탭 중복 방지','승인 후 권한 즉시 반영','AI 무료/유료 횟수 정확 차감','새로고침 후 상태 유지','네트워크 오류 후 재시도'],at:new Date().toISOString()};try{localStorage.setItem('guiin_launch_qa_v629',JSON.stringify(out))}catch(_){};console.table(checks);return out;
}
window.guiinLaunchQA=launchQA;

function polishResult(kind){
 const root=$(kind==='compat'?'matchView':'resultView');if(!root)return;
 normalizeKnownText(root);removeDuplicateCompare(root);if(kind==='saju'){metricClarifier(root);installThreeLine()}installEvidence(root,kind);refineContextAI(root,kind);installPremiumBridge(kind);if(kind==='compat')installLifeCompat();installShareHub(kind);qualityScan(root);
}
function wrap(name,afterFn){const old=window[name];if(typeof old!=='function'||old.__v629)return;const w=function(){const r=old.apply(this,arguments);const args=arguments;setTimeout(()=>{try{afterFn.apply(this,args)}catch(e){console.warn('GUIIN_V629_'+name,e)}},0);return r};w.__v629=true;window[name]=w;try{eval(name+'=window[name]')}catch(_){} }
function init(){installRevisitHub();setTimeout(()=>{polishResult('saju');polishResult('compat')},120);setTimeout(showOnboard,900);setTimeout(()=>launchQA().catch(()=>{}),1500)}
function bind(){wrap('renderResult',()=>polishResult('saju'));wrap('renderCompatCards',()=>polishResult('compat'));wrap('syncAuthUI',()=>installRevisitHub());if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()}
// defer script runs after parser; one extra tick lets the bottom inline bundle finish exporting globals.
setTimeout(bind,0);
})();
