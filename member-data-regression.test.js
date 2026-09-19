"use strict";

const assert=require("assert");
const fs=require("fs");

class Store{
  constructor(){this.m=new Map();}
  getItem(k){return this.m.has(k)?this.m.get(k):null;}
  setItem(k,v){this.m.set(k,String(v));}
  removeItem(k){this.m.delete(k);}
  clear(){this.m.clear();}
}
global.localStorage=new Store();
global.sessionStorage=new Store();
global.document=undefined;
global.setTimeout=setTimeout;
global.clearTimeout=clearTimeout;

const state={
  guestCreated:0,
  profilePosts:0,
  chartPosts:0,
  convPosts:0,
  conversions:0,
  profiles:[],
  conversations:[],
  messages:{}
};
const GST="gst_"+"a".repeat(40);

function response(status,obj){
  return {
    ok:status>=200&&status<300,
    status,
    async json(){return obj;}
  };
}
global.fetch=async function(url,opt={}){
  const u=new URL(url);
  const p=u.pathname;
  const method=String(opt.method||"GET").toUpperCase();
  const headers=opt.headers||{};

  if(p==="/api/session/guest"&&method==="POST"){
    state.guestCreated++;
    return response(201,{ok:true,guestToken:GST,guestId:"guest_1"});
  }

  const auth=String(headers.Authorization||"");
  const guest=String(headers["X-Guiin-Guest"]||headers["x-guiin-guest"]||"");
  if(!auth&&!guest)return response(401,{ok:false,error:"session_required"});

  if(p==="/api/profiles"&&method==="GET"){
    return response(200,{ok:true,profiles:state.profiles});
  }
  if(p==="/api/profiles"&&method==="POST"){
    state.profilePosts++;
    const b=JSON.parse(opt.body||"{}");
    const row={
      id:"profile_"+state.profilePosts,
      ...b,
      display_name:b.display_name,
      birth_year:b.birth_year,birth_month:b.birth_month,birth_day:b.birth_day,
      birth_hour:b.birth_hour,birth_minute:b.birth_minute,
      hour_unknown:b.hour_unknown?1:0,lunar_leap_month:b.lunar_leap_month?1:0,
      true_solar_time:b.true_solar_time?1:0
    };
    state.profiles.unshift(row);
    return response(201,{ok:true,profile:row});
  }
  if(/^\/api\/profiles\//.test(p)&&method==="DELETE"){
    const id=decodeURIComponent(p.split("/").pop());
    state.profiles=state.profiles.filter(x=>x.id!==id);
    return response(200,{ok:true,deleted:true});
  }
  if(p==="/api/chart-snapshots"&&method==="POST"){
    state.chartPosts++;
    return response(201,{ok:true,chartSnapshotId:"chart_"+state.chartPosts,chartKey:"key_"+state.chartPosts,verificationState:"CLIENT_FACTS_UNVERIFIED"});
  }
  if(p==="/api/conversations"&&method==="POST"){
    state.convPosts++;
    const b=JSON.parse(opt.body||"{}");
    const row={id:"conv_"+state.convPosts,title:b.title||null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    state.conversations.unshift(row);
    state.messages[row.id]=[];
    return response(201,{ok:true,conversation:row});
  }
  if(p==="/api/conversations"&&method==="GET"){
    return response(200,{ok:true,conversations:state.conversations});
  }
  const mm=p.match(/^\/api\/conversations\/([^/]+)\/messages$/);
  if(mm&&method==="GET"){
    return response(200,{ok:true,messages:state.messages[mm[1]]||[]});
  }
  if(p==="/api/auth/convert-guest"&&method==="POST"){
    state.conversions++;
    assert(auth.startsWith("Bearer usr_"),"conversion must use user bearer token");
    const b=JSON.parse(opt.body||"{}");
    assert.strictEqual(b.guestToken,GST);
    return response(200,{ok:true,conversionId:"gconv_1"});
  }
  if(p==="/api/me/usage"&&method==="GET"){
    return response(200,{ok:true,usage:{free:{used:1,remaining:2},wallet:{balance:0}}});
  }
  return response(404,{ok:false,error:"not_found"});
};

global.GuiinSaju={
  ENGINE_VERSION:"test-engine",
  calculate(input){
    return {
      input:{...input},
      pillars:{
        year:{ko:"신미",stem:"신",branch:"미"},
        month:{ko:"기해",stem:"기",branch:"해"},
        day:{ko:"정유",stem:"정",branch:"유"},
        hour:input.hourUnknown?null:{ko:"갑진",stem:"갑",branch:"진"}
      },
      dayMaster:{stem:"정"},
      elCount:{목:1,화:1,토:2,금:2,수:1},
      relations:[]
    };
  }
};
global.guiinStableApiBase=()=> "https://example.test";

const M=require("./member-data-v1.js");

function chart(name="테스트"){
  return GuiinSaju.calculate({
    name,gender:"여",calendar:"양력",year:1991,month:11,day:23,
    hour:7,minute:40,hourUnknown:false,leapMonth:false,
    dayBoundary:"23",trueSolarApply:false,longitude:126.98
  });
}

(async()=>{
  assert.strictEqual(M.VERSION,"member-data-v1");

  const g1=await M.ensureServerGuest();
  const g2=await M.ensureServerGuest();
  assert.strictEqual(g1,GST);
  assert.strictEqual(g2,GST);
  assert.strictEqual(state.guestCreated,1,"guest session should be reused");

  const p1=await M.syncProfile(chart("강진아"));
  const p2=await M.syncProfile(chart("강진아"));
  assert(p1&&p2);
  assert.strictEqual(state.profilePosts,1,"same profile must be deduplicated");

  const cA=chart("궁합A"),cB=chart("궁합B");
  await Promise.all([M.syncProfile(cA),M.syncProfile(cB)]);
  assert.strictEqual(state.profilePosts,3,"two different compatibility profiles must both be saved");

  const c1=await M.ensureConversation(chart("강진아"),"직업운이 궁금해");
  const c2=await M.ensureConversation(chart("강진아"),"재물운도 궁금해");
  assert(c1?.conversationId&&c1?.chartSnapshotId);
  assert.deepStrictEqual(c1,c2,"same chart should reuse active conversation");
  assert.strictEqual(state.chartPosts,1);
  assert.strictEqual(state.convPosts,1);

  localStorage.setItem("guiin_user_session_v1",JSON.stringify({
    token:"usr_"+"b".repeat(40),userId:"user_1",provider:"kakao"
  }));
  const cv=await M.convertGuestToUser();
  assert.strictEqual(cv.ok,true);
  assert.strictEqual(state.conversions,1);
  assert.strictEqual(M.serverGuestToken(),"","converted guest token should be removed");
  assert.strictEqual(localStorage.getItem("guiin_server_ai_context_v1"),"{}","guest conversation context must be cleared after conversion");

  const input=M.rowToInput(state.profiles.find(x=>x.display_name==="강진아"));
  assert.strictEqual(input.name,"강진아");
  assert.strictEqual(input.year,1991);
  assert.strictEqual(input.month,11);
  assert.strictEqual(input.day,23);


  // 계정/기기 경계: AI/프로필 로컬 소유자 마커와 로그아웃 정리
  M.markAIHistoryOwner();
  assert(M.aiHistoryOwner().startsWith("u_"),"AI history owner should be user-scoped after login");
  localStorage.setItem("guiin_ai_history_v1",JSON.stringify([{role:"user",content:"민감한 상담"}]));
  localStorage.setItem("guiin_last",JSON.stringify({name:"강진아",year:1991,month:11,day:23}));
  localStorage.removeItem("guiin_user_session_v1");
  await M.afterLogout();
  assert.strictEqual(localStorage.getItem("guiin_ai_history_v1"),null,"logout should clear local AI history");
  assert.strictEqual(localStorage.getItem("guiin_last"),null,"logout should clear local birth profile");
  assert(M.serverGuestToken(),"logout should create a fresh server guest session");

  const idx=fs.readFileSync("index.html","utf8");
  const demo=fs.readFileSync("demo.html","utf8");
  for(const [name,html] of [["index",idx],["demo",demo]]){
    assert(html.includes('member-data-v1.js?v=20260919a'),`${name}: member data script missing`);
    assert(html.includes("GuiinMemberData?.syncProfile"),`${name}: profile sync hook missing`);
    assert(html.includes("GuiinMemberData?.renderProfiles"),`${name}: profile list hook missing`);
    assert(html.includes("GuiinMemberData?.renderHistory"),`${name}: history hook missing`);
    assert(html.includes("GUIIN_COMPAT_PROFILE_SYNC_DEFERRED"),`${name}: compatibility profile sync hook missing`);
    assert(html.includes("markAIHistoryOwner"),`${name}: AI history owner hook missing`);
    const logoutStart=html.indexOf("function logoutGuiin(){");
    const logoutEnd=html.indexOf("function guiinAuthErrorMessage",logoutStart);
    const logoutBlock=logoutStart>=0&&logoutEnd>logoutStart?html.slice(logoutStart,logoutEnd):"";
    assert(logoutBlock.includes("clearAIChat()"),`${name}: logout AI chat clear missing`);
    assert(logoutBlock.includes("chart=null"),`${name}: logout in-memory chart clear missing`);
    assert(logoutBlock.includes("matchAnalysis=null"),`${name}: logout compatibility state clear missing`);
    assert(html.includes("if(window.GuiinSaju){try{chart=GuiinSaju.calculate(v);}catch(_e){}}"),`${name}: restoreProfile must replace stale in-memory chart`);
    assert(html.includes("conversationId:serverContext?.conversationId||null"),`${name}: conversation bridge missing`);
    assert(html.includes("chartSnapshotId:serverContext?.chartSnapshotId||null"),`${name}: chart snapshot bridge missing`);
    assert(html.includes("X-Guiin-Guest"),`${name}: server guest header missing`);
    assert(html.includes("GuiinMemberData?.serverGuestToken?.()"),`${name}: AI/API must use the D1 server guest token`);
    assert(html.includes("GuiinMemberData?.afterLogin"),`${name}: login conversion hook missing`);
    assert(!html.includes("if(btn)btn.innerHTML='카카오 로그인됨"),`${name}: old rescue text restored`);
    assert(html.includes("deep-interpretation-v3.js?v=20260918e"),`${name}: R3 V3 cache marker changed`);
    assert(html.includes("KAKAO OAUTH RETURN BRIDGE"),`${name}: Kakao bridge missing`);
    assert(html.includes("requestId:requestMeta.id"),`${name}: AI idempotency missing`);
  }

  console.log("Member Data v1 regression: ALL PASS");
})().catch(err=>{console.error(err);process.exit(1);});
