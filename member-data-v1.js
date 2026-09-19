/**
 * 귀인사주 Member Data Bridge v1
 * - 게스트 서버 세션 생성
 * - 로컬 사주 프로필을 서버 프로필로 동기화
 * - 카카오 로그인 후 게스트 데이터를 회원 계정으로 승계
 * - AI 명식 스냅샷/대화방 연결
 * - 저장 프로필/상담 기록을 계정 기준으로 다시 불러오기
 *
 * 결제 활성화나 사주 계산 엔진은 변경하지 않습니다.
 */
(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.GuiinMemberData=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const VERSION="member-data-v1";
  const DEFAULT_API="https://guiin-saju-api-staging.blue-wls.workers.dev";
  const SERVER_GUEST_KEY="guiin_server_guest_token_v1";
  const AUTH_KEY="guiin_user_session_v1";
  const CONTEXT_KEY="guiin_server_ai_context_v1";
  const PROFILE_CACHE_KEY="guiin_server_profiles_cache_v1";
  const SYNC_STATUS_KEY="guiin_member_sync_status_v1";
  const AI_HISTORY_KEY="guiin_ai_history_v1";
  const PROFILE_OWNER_KEY="guiin_local_profile_owner_v1";
  const AI_OWNER_KEY="guiin_ai_history_owner_v1";

  let guestPromise=null;
  const profileSyncPromises=new Map();
  let loginSyncPromise=null;

  function ls(){
    try{return root.localStorage||null}catch(_){return null}
  }
  function ss(){
    try{return root.sessionStorage||null}catch(_){return null}
  }
  function get(store,key){
    try{return store?.getItem(key)||""}catch(_){return ""}
  }
  function set(store,key,val){
    try{if(val==null||val==="")store?.removeItem(key);else store?.setItem(key,String(val));}catch(_){}
  }
  function parseJson(raw,fallback=null){
    try{return JSON.parse(raw)}catch(_){return fallback}
  }
  function apiBase(){
    try{
      if(typeof root.guiinStableApiBase==="function"){
        const v=String(root.guiinStableApiBase()||"").trim();
        if(/^https:\/\//i.test(v))return v.replace(/\/+$/,"");
      }
    }catch(_){}
    return DEFAULT_API;
  }
  function authSession(){
    const raw=get(ls(),AUTH_KEY)||get(ss(),AUTH_KEY)||"";
    const x=parseJson(raw,null);
    return x&&typeof x.token==="string"&&x.token.startsWith("usr_")?x:null;
  }
  function serverGuestToken(){
    const t=get(ls(),SERVER_GUEST_KEY);
    return /^gst_[A-Za-z0-9._:-]{32,}$/.test(t)?t:"";
  }
  function setServerGuestToken(v){set(ls(),SERVER_GUEST_KEY,v||"");}
  function simpleHash(s){
    let h=2166136261;
    const x=String(s||"");
    for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(36);
  }
  function subjectKey(){
    const u=authSession();
    if(u?.token)return "u_"+simpleHash(u.userId||u.token);
    const g=serverGuestToken();
    return g?"g_"+simpleHash(g):"guest_pending";
  }
  function localProfileOwner(){return get(ls(),PROFILE_OWNER_KEY)||"";}
  function markLocalProfileOwner(owner){set(ls(),PROFILE_OWNER_KEY,owner||subjectKey());}
  function aiHistoryOwner(){return get(ls(),AI_OWNER_KEY)||"";}
  function markAIHistoryOwner(owner){set(ls(),AI_OWNER_KEY,owner||subjectKey());}
  function clearLocalAccountCaches({keepLastProfile=false}={}){
    set(ls(),PROFILE_CACHE_KEY,"");
    set(ls(),CONTEXT_KEY,"");
    set(ls(),AI_HISTORY_KEY,"");
    set(ls(),AI_OWNER_KEY,"");
    if(!keepLastProfile){
      set(ls(),"guiin_last","");
      set(ls(),PROFILE_OWNER_KEY,"");
    }
  }
  function status(kind,detail){
    try{
      set(ls(),SYNC_STATUS_KEY,JSON.stringify({
        kind:String(kind||"unknown"),
        detail:String(detail||"").slice(0,240),
        at:new Date().toISOString()
      }));
    }catch(_){}
  }

  async function readJsonResponse(r){
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      const e=new Error(d?.error||("HTTP "+r.status));
      e.status=r.status;
      e.data=d;
      throw e;
    }
    return d;
  }

  async function ensureServerGuest(){
    if(authSession()?.token)return null;
    const existing=serverGuestToken();
    if(existing)return existing;
    if(guestPromise)return guestPromise;

    guestPromise=(async()=>{
      const r=await root.fetch(apiBase()+"/api/session/guest",{
        method:"POST",mode:"cors",cache:"no-store",
        headers:{"Accept":"application/json"}
      });
      const d=await readJsonResponse(r);
      const t=String(d?.guestToken||"");
      if(!/^gst_[A-Za-z0-9._:-]{32,}$/.test(t))throw new Error("invalid_guest_token_response");
      setServerGuestToken(t);
      status("guest_ready","server guest session ready");
      return t;
    })();

    try{return await guestPromise;}
    finally{guestPromise=null;}
  }

  async function sessionHeaders(extra={}){
    const h={...extra};
    const u=authSession();
    if(u?.token){
      h.Authorization="Bearer "+u.token;
    }else{
      const g=await ensureServerGuest();
      if(g){
        h["X-Guiin-Guest"]=g;
        h["X-Session-ID"]=g;
      }
    }
    return h;
  }

  async function request(path,opt={}){
    const headers=await sessionHeaders(opt.headers||{});
    if(opt.body&&!headers["Content-Type"])headers["Content-Type"]="application/json";
    const r=await root.fetch(apiBase()+path,{
      ...opt,headers,mode:"cors",cache:"no-store"
    });
    return readJsonResponse(r);
  }

  function inputPayload(input={}){
    const unknown=!!input.hourUnknown;
    return {
      label:String(input.name||"").trim().slice(0,40)||null,
      display_name:String(input.name||"").trim().slice(0,40)||null,
      calendar:input.calendar==="음력"?"음력":"양력",
      lunar_leap_month:!!input.leapMonth,
      birth_year:Number(input.year),
      birth_month:Number(input.month),
      birth_day:Number(input.day),
      birth_hour:unknown?null:Number(input.hour),
      birth_minute:unknown?null:Number(input.minute||0),
      hour_unknown:unknown,
      gender:String(input.gender||"").trim().slice(0,12)||null,
      timezone:"Asia/Seoul",
      day_boundary:String(input.dayBoundary||"23"),
      true_solar_time:!!input.trueSolarApply,
      longitude:Number.isFinite(Number(input.longitude))?Number(input.longitude):null
    };
  }
  function rowToInput(row={}){
    return {
      name:row.display_name||row.label||"사용자",
      gender:row.gender||"여",
      calendar:row.calendar||"양력",
      year:Number(row.birth_year),
      month:Number(row.birth_month),
      day:Number(row.birth_day),
      hour:row.hour_unknown?12:Number(row.birth_hour??12),
      minute:row.hour_unknown?0:Number(row.birth_minute??0),
      hourUnknown:!!Number(row.hour_unknown),
      leapMonth:!!Number(row.lunar_leap_month),
      dayBoundary:String(row.day_boundary||"23"),
      trueSolarApply:!!Number(row.true_solar_time),
      longitude:row.longitude==null?126.98:Number(row.longitude)
    };
  }
  function profileKey(p={}){
    const h=p.hour_unknown?null:Number(p.birth_hour);
    const mi=p.hour_unknown?null:Number(p.birth_minute||0);
    return [
      String(p.display_name||p.label||"").trim(),
      p.calendar||"양력",Number(p.lunar_leap_month||0),
      Number(p.birth_year),Number(p.birth_month),Number(p.birth_day),
      h,mi,Number(p.hour_unknown||0),String(p.gender||""),
      String(p.day_boundary||"23"),Number(p.true_solar_time||0),
      p.longitude==null?"":Number(p.longitude).toFixed(4)
    ].join("|");
  }
  function rowKey(row={}){return profileKey(row);}

  async function listProfiles(){
    const d=await request("/api/profiles",{method:"GET",headers:{"Accept":"application/json"}});
    const rows=Array.isArray(d?.profiles)?d.profiles:[];
    try{set(ls(),PROFILE_CACHE_KEY,JSON.stringify(rows));}catch(_){}
    return rows;
  }
  function cachedProfiles(){
    const x=parseJson(get(ls(),PROFILE_CACHE_KEY)||"[]",[]);
    return Array.isArray(x)?x:[];
  }
  async function saveProfilePayload(payload){
    const d=await request("/api/profiles",{
      method:"POST",
      body:JSON.stringify(payload),
      headers:{"Accept":"application/json"}
    });
    return d?.profile||null;
  }
  async function syncProfile(chartOrInput){
    const input=chartOrInput?.input||chartOrInput||{};
    const payload=inputPayload(input);
    if(!Number.isInteger(payload.birth_year)||!Number.isInteger(payload.birth_month)||!Number.isInteger(payload.birth_day)){
      throw new Error("profile_input_incomplete");
    }
    const key=profileKey(payload);
    if(profileSyncPromises.has(key))return profileSyncPromises.get(key);

    const job=(async()=>{
      let rows=[];
      try{rows=await listProfiles();}catch(_){rows=cachedProfiles();}
      const found=rows.find(x=>rowKey(x)===key);
      if(found){markLocalProfileOwner();return found;}
      const created=await saveProfilePayload(payload);
      status("profile_synced",created?.id||"created");
      markLocalProfileOwner();
      try{await listProfiles();}catch(_){}
      return created;
    })();
    profileSyncPromises.set(key,job);
    try{return await job;}
    finally{profileSyncPromises.delete(key);}
  }
  async function deleteProfile(id){
    const d=await request("/api/profiles/"+encodeURIComponent(String(id||"")),{
      method:"DELETE",headers:{"Accept":"application/json"}
    });
    try{await listProfiles();}catch(_){}
    return d;
  }

  function normalizedInputFromChart(c){
    const i=c?.input||{};
    return {
      name:String(i.name||""),
      gender:String(i.gender||""),
      calendar:i.calendar==="음력"?"음력":"양력",
      year:Number(i.year),month:Number(i.month),day:Number(i.day),
      hour:!!i.hourUnknown?null:Number(i.hour),
      minute:!!i.hourUnknown?null:Number(i.minute||0),
      hourUnknown:!!i.hourUnknown,
      leapMonth:!!i.leapMonth,
      dayBoundary:String(i.dayBoundary||"23"),
      trueSolarApply:!!i.trueSolarApply,
      longitude:Number.isFinite(Number(i.longitude))?Number(i.longitude):null,
      timezone:"Asia/Seoul"
    };
  }
  function chartFacts(c){
    try{
      if(typeof root.guiinChartPayload==="function"){
        const x=root.guiinChartPayload();
        if(x&&typeof x==="object")return x;
      }
    }catch(_){}
    const p=c?.pillars||{};
    const val=x=>x&&(x.ko||(String(x.stem||"")+String(x.branch||"")));
    return {
      name:c?.input?.name||"",
      year:val(p.year),month:val(p.month),day:val(p.day),
      hour:val(p.hour)||"출생시간 모름",
      hourUnknown:!!c?.input?.hourUnknown,
      dayMaster:c?.dayMaster?.stem||p?.day?.stem||"",
      relations:Array.isArray(c?.relations)?c.relations:[],
      elements:c?.elCount||null
    };
  }

  function contextMap(){
    const x=parseJson(get(ls(),CONTEXT_KEY)||"{}",{});
    return x&&typeof x==="object"&&!Array.isArray(x)?x:{};
  }
  function saveContextMap(x){set(ls(),CONTEXT_KEY,JSON.stringify(x||{}));}
  function chartFingerprint(c){
    const i=c?.input||{};
    return simpleHash([
      i.name,i.gender,i.calendar,i.year,i.month,i.day,
      i.hourUnknown?"?":i.hour,i.minute,i.leapMonth?1:0,
      i.dayBoundary||"23",i.trueSolarApply?1:0,i.longitude??""
    ].join("|"));
  }
  function contextKey(c){return subjectKey()+"|"+chartFingerprint(c);}
  function currentContext(c){
    const map=contextMap();
    return map[contextKey(c)]||null;
  }
  function clearConversationContext(c){
    const map=contextMap();
    if(c)delete map[contextKey(c)];
    else{
      const prefix=subjectKey()+"|";
      Object.keys(map).forEach(k=>{if(k.startsWith(prefix))delete map[k];});
    }
    saveContextMap(map);
  }

  async function createChartSnapshot(c,profileId){
    const d=await request("/api/chart-snapshots",{
      method:"POST",
      headers:{"Accept":"application/json"},
      body:JSON.stringify({
        profile_id:profileId||null,
        normalized_input:normalizedInputFromChart(c),
        chart_facts:chartFacts(c),
        uncertainty:c?.uncertainty||{
          birth_time_unknown:!!c?.input?.hourUnknown,
          hour_pillar:c?.input?.hourUnknown?"unavailable":"available"
        },
        calculation_engine_version:
          c?.calculation?.engineVersion||
          c?.calculation?.engine_version||
          root.GuiinSaju?.ENGINE_VERSION||
          null,
        calculation_rule_version:
          c?.calculation?.ruleVersion||
          c?.calculation?.rule_version||
          "frontend-deep-v3"
      })
    });
    return {
      chartSnapshotId:d?.chartSnapshotId||null,
      chartKey:d?.chartKey||null,
      verificationState:d?.verificationState||null
    };
  }
  async function createConversation(title,chartSnapshotId){
    const d=await request("/api/conversations",{
      method:"POST",
      headers:{"Accept":"application/json"},
      body:JSON.stringify({
        title:String(title||"").slice(0,120)||null,
        chart_snapshot_id:chartSnapshotId||null
      })
    });
    return d?.conversation||null;
  }
  async function ensureConversation(c,question=""){
    if(!c?.pillars)return null;
    const key=contextKey(c), map=contextMap();
    const old=map[key];
    if(old?.conversationId&&old?.chartSnapshotId)return old;

    let profile=null;
    try{profile=await syncProfile(c);}catch(_){}
    const snap=await createChartSnapshot(c,profile?.id||null);
    if(!snap.chartSnapshotId)throw new Error("chart_snapshot_create_failed");
    const name=String(c?.input?.name||"사용자").trim()||"사용자";
    const q=String(question||"").trim().replace(/\s+/g," ");
    const title=q?`${name} · ${q.slice(0,42)}`:`${name}님의 AI 사주상담`;
    const conv=await createConversation(title,snap.chartSnapshotId);
    if(!conv?.id)throw new Error("conversation_create_failed");

    const ctx={
      conversationId:conv.id,
      chartSnapshotId:snap.chartSnapshotId,
      profileId:profile?.id||null,
      createdAt:new Date().toISOString()
    };
    map[key]=ctx;
    saveContextMap(map);
    status("conversation_ready",conv.id);
    return ctx;
  }
  async function listConversations(){
    const d=await request("/api/conversations",{method:"GET",headers:{"Accept":"application/json"}});
    return Array.isArray(d?.conversations)?d.conversations:[];
  }
  async function listMessages(id){
    const d=await request("/api/conversations/"+encodeURIComponent(String(id||""))+"/messages",{
      method:"GET",headers:{"Accept":"application/json"}
    });
    return Array.isArray(d?.messages)?d.messages:[];
  }

  function esc(s){
    return String(s??"").replace(/[&<>"']/g,ch=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[ch]));
  }
  function fmtDate(s){
    const d=new Date(s);
    if(!Number.isFinite(d.getTime()))return "";
    try{return new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"short",day:"numeric"}).format(d);}
    catch(_){return d.toISOString().slice(0,10);}
  }

  async function renderProfiles(container){
    if(!container)return;
    let rows=[];
    try{rows=await listProfiles();}
    catch(err){
      rows=cachedProfiles();
      if(!rows.length)return;
    }
    if(!rows.length){
      container.innerHTML='<p class="utilityHint">저장된 프로필이 없습니다.</p>';
      return;
    }
    const signed=!!authSession()?.token;
    container.innerHTML=
      `<p class="utilityHint">${signed?"카카오 계정에 저장되어 다른 기기에서도 불러올 수 있어요.":"로그인하면 이 프로필을 카카오 계정으로 안전하게 옮길 수 있어요."}</p>`+
      rows.map(r=>{
        const t=r.hour_unknown?"출생시간 모름":`${String(r.birth_hour??0).padStart(2,"0")}:${String(r.birth_minute??0).padStart(2,"0")}`;
        return `<div class="trustBox" style="margin-top:8px">
          <b>${esc(r.display_name||r.label||"사용자")}</b><br>
          ${Number(r.birth_year)}년 ${Number(r.birth_month)}월 ${Number(r.birth_day)}일 (${esc(r.calendar||"양력")}) · ${esc(t)}
          <div style="display:flex;gap:7px;margin-top:9px">
            <button class="softBtn" type="button" onclick="GuiinMemberData.loadProfile('${esc(r.id)}')">불러오기</button>
            <button class="softBtn" type="button" onclick="GuiinMemberData.removeProfile('${esc(r.id)}')">삭제</button>
          </div>
        </div>`;
      }).join("");
  }

  async function loadProfile(id){
    let rows=[];
    try{rows=await listProfiles();}catch(_){rows=cachedProfiles();}
    const row=rows.find(x=>String(x.id)===String(id));
    if(!row)throw new Error("profile_not_found");
    const input=rowToInput(row);
    set(ls(),"guiin_last",JSON.stringify(input));
    try{if(typeof root.restoreProfile==="function")root.restoreProfile();}catch(_){}
    if(root.document){
      const byId=x=>root.document.getElementById(x);
      if(byId("name"))byId("name").value=input.name||"";
      if(byId("year"))byId("year").value=input.year||"";
      if(byId("month"))byId("month").value=input.month||"";
      if(byId("day"))byId("day").value=input.day||"";
      if(byId("hour"))byId("hour").value=input.hourUnknown?"":input.hour;
      if(byId("minute"))byId("minute").value=input.hourUnknown?"":input.minute;
      if(byId("hourUnknown"))byId("hourUnknown").checked=!!input.hourUnknown;
      if(byId("leapMonth"))byId("leapMonth").checked=!!input.leapMonth;
    }
    try{
      if(typeof root.go==="function")root.go("saju");
      setTimeout(()=>{try{if(typeof root.submitSaju==="function")root.submitSaju();}catch(_){}},60);
    }catch(_){}
    return input;
  }
  async function removeProfile(id){
    try{
      await deleteProfile(id);
      const v=root.document?.getElementById("savedProfileView");
      if(v)await renderProfiles(v);
    }catch(err){
      try{root.showGuiinPopup?.("프로필을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.","저장 프로필");}catch(_){}
      throw err;
    }
  }

  async function renderHistory(container){
    if(!container)return;
    let conv=[],profiles=[],usage=null;
    try{[conv,profiles,usage]=await Promise.all([
      listConversations(),
      listProfiles(),
      request("/api/me/usage",{method:"GET",headers:{"Accept":"application/json"}}).catch(()=>null)
    ]);}catch(_){}
    const rows=[];
    if(profiles?.length){
      const p=profiles[0];
      rows.push(`<div class="trustBox"><b>저장 프로필 ${profiles.length}개</b><br>최근 · ${esc(p.display_name||p.label||"사용자")} ${Number(p.birth_year)}.${Number(p.birth_month)}.${Number(p.birth_day)}</div>`);
    }
    if(conv?.length){
      rows.push(`<div class="trustBox"><b>AI 상담 기록 ${conv.length}개</b><br>${conv.slice(0,8).map(c=>`<button type="button" class="serviceLink" style="width:100%;margin-top:6px;text-align:left" onclick="GuiinMemberData.openConversation('${esc(c.id)}')"><b>${esc(c.title||"AI 사주상담")}</b><span>${esc(fmtDate(c.updated_at||c.created_at))} · 기록 보기</span></button>`).join("")}</div>`);
    }
    if(usage?.usage?.free){
      const f=usage.usage.free;
      rows.push(`<div class="trustBox"><b>서버 이용기록</b><br>무료 질문 사용 ${Number(f.used||0)}회 · 남은 횟수 ${Number(f.remaining||0)}회</div>`);
    }
    if(rows.length)container.innerHTML=rows.join("");
  }

  async function openConversation(id){
    const messages=await listMessages(id);
    const history=messages
      .filter(x=>x&&(x.role==="user"||x.role==="assistant")&&typeof x.content==="string")
      .slice(-12)
      .map(x=>({role:x.role,content:x.content}));
    set(ls(),AI_HISTORY_KEY,JSON.stringify(history));
    markAIHistoryOwner();
    try{
      if(typeof root.loadAIHistory==="function")root.loadAIHistory();
      if(typeof root.restoreAIChatBubbles==="function")root.restoreAIChatBubbles();
      if(typeof root.go==="function")root.go("ask");
    }catch(_){}
    return history;
  }

  async function convertGuestToUser(){
    const u=authSession();
    const g=serverGuestToken();
    if(!u?.token||!g)return {ok:true,skipped:true};
    const idem="convert_"+simpleHash((u.userId||u.token)+"|"+g)+"_v1";
    try{
      const d=await request("/api/auth/convert-guest",{
        method:"POST",
        headers:{
          "Accept":"application/json",
          "X-Idempotency-Key":idem
        },
        body:JSON.stringify({guestToken:g})
      });
      if(d?.ok){
        setServerGuestToken("");
        saveContextMap({});
        status("guest_converted",d.conversionId||"ok");
      }
      return d;
    }catch(err){
      if(["guest_not_found","invalid_guest_token"].includes(String(err?.message||""))){
        setServerGuestToken("");
      }
      throw err;
    }
  }

  async function syncLegacyLocalProfile(){
    const raw=get(ls(),"guiin_last");
    const input=parseJson(raw,null);
    if(!input||typeof input!=="object")return null;
    try{
      if(root.GuiinSaju&&typeof root.GuiinSaju.calculate==="function"){
        const c=root.GuiinSaju.calculate(input);
        return await syncProfile(c);
      }
      return await syncProfile(input);
    }catch(_){return null;}
  }

  async function restoreLatestProfile({forceAccount=false}={}){
    let rows=[];
    try{rows=await listProfiles();}catch(_){return null;}
    if(!rows.length)return null;

    const owner=localProfileOwner();
    const current=subjectKey();
    const raw=get(ls(),"guiin_last");
    if(raw&&!forceAccount&&owner===current)return null;

    const input=rowToInput(rows[0]);
    set(ls(),"guiin_last",JSON.stringify(input));
    markLocalProfileOwner(current);
    try{if(typeof root.restoreProfile==="function")root.restoreProfile();}catch(_){}
    return input;
  }

  async function afterLogin(){
    if(loginSyncPromise)return loginSyncPromise;
    loginSyncPromise=(async()=>{
      const beforeGuest=serverGuestToken();
      const beforeOwner=localProfileOwner();
      let conversion={ok:true,skipped:true};

      if(beforeGuest){
        try{
          conversion=await convertGuestToUser();
        }catch(err){
          status("guest_convert_retry",err?.message||"failed");
          // 진행 중/일시 오류라면 같은 로컬 프로필을 회원 계정에 중복 업로드하지 않습니다.
          if(!["guest_not_found","invalid_guest_token"].includes(String(err?.message||"")))return false;
        }
      }

      // 게스트 승계가 성공했다면 서버 쪽에서 profile/conversation을 이미 회원 소유로 옮겼습니다.
      // 서버에 없던 레거시 로컬 프로필만 안전하게 보완합니다.
      let rows=[];
      try{rows=await listProfiles();}catch(_){}
      if(!rows.length){
        const raw=get(ls(),"guiin_last");
        const ownerOk=!beforeOwner||beforeOwner==="guest_pending"||beforeOwner.startsWith("g_")||beforeOwner===subjectKey();
        if(raw&&ownerOk){try{await syncLegacyLocalProfile();}catch(_){}}
        try{rows=await listProfiles();}catch(_){}
      }

      // 다른 계정/기기에서 로그인한 경우 로컬에 남은 타 계정 프로필을 덮어 올리지 않고
      // 현재 로그인 계정의 서버 프로필을 우선합니다.
      try{await restoreLatestProfile({forceAccount:!!rows.length&&localProfileOwner()!==subjectKey()});}catch(_){}

      const previousAiOwner=aiHistoryOwner();
      if(previousAiOwner&&previousAiOwner!==subjectKey()){
        const convertedGuestHistory=!!beforeGuest&&conversion?.ok===true&&previousAiOwner.startsWith("g_");
        if(convertedGuestHistory){
          markAIHistoryOwner(subjectKey());
        }else{
          set(ls(),AI_HISTORY_KEY,"");
          set(ls(),AI_OWNER_KEY,"");
          try{if(typeof root.clearAIChat==="function")root.clearAIChat();}catch(_){}
        }
      }
      return conversion?.ok!==false;
    })();
    try{return await loginSyncPromise;}
    finally{loginSyncPromise=null;}
  }
  async function afterLogout(){
    // 공유 기기에서 이전 회원/게스트의 생년월일·AI 기록·세션이
    // 다음 사용자에게 이어지지 않도록 새 게스트 신원으로 분리합니다.
    clearLocalAccountCaches({keepLastProfile:false});
    setServerGuestToken("");
    set(ls(),"guiin_guest_session_v1","");
    try{if(typeof root.clearAIChat==="function")root.clearAIChat();}catch(_){}
    try{await ensureServerGuest();}catch(_){}
    return true;
  }
  async function bootstrap(){
    try{
      if(authSession()?.token)await afterLogin();
      else{
        await ensureServerGuest();
        await syncLegacyLocalProfile();
      }
    }catch(err){
      status("bootstrap_degraded",err?.message||"offline");
    }
  }

  if(root.document){
    if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",()=>setTimeout(bootstrap,0),{once:true});
    else setTimeout(bootstrap,0);
  }

  return {
    VERSION,SERVER_GUEST_KEY,AUTH_KEY,PROFILE_OWNER_KEY,AI_OWNER_KEY,
    apiBase,authSession,serverGuestToken,ensureServerGuest,sessionHeaders,request,
    subjectKey,localProfileOwner,markLocalProfileOwner,aiHistoryOwner,markAIHistoryOwner,clearLocalAccountCaches,
    inputPayload,rowToInput,profileKey,listProfiles,cachedProfiles,syncProfile,deleteProfile,
    ensureConversation,currentContext,clearConversationContext,listConversations,listMessages,
    renderProfiles,loadProfile,removeProfile,renderHistory,openConversation,
    convertGuestToUser,syncLegacyLocalProfile,restoreLatestProfile,afterLogin,afterLogout,bootstrap
  };
});
