"use strict";
const assert=require("assert"),L=require("./server-login-foundation.js"),O=require("./server-logout.js");
function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}
ok("known provider",()=>{assert.strictEqual(L.normalizeProvider("KAKAO"),"kakao");assert.throws(()=>L.normalizeProvider("random"),/unsupported_provider/)});
ok("provider verification required",()=>assert.throws(()=>L.verifiedIdentity({provider:"kakao",provider_user_id:"x",verified:false}),/not_verified/));
ok("state single use",()=>{const n=Date.now();assert.strictEqual(L.loginStateDecision({expires_at:new Date(n+10000).toISOString()},n).allowed,true);assert.strictEqual(L.loginStateDecision({expires_at:new Date(n+10000).toISOString(),used_at:"x"},n).reason,"state_already_used")});
ok("open redirect blocked",()=>assert.throws(()=>L.loginStatePlan({provider:"kakao",redirectPath:"https://evil.example"}),/invalid_redirect_path/));
ok("identity reuses same provider user",()=>{const v=L.verifiedIdentity({provider:"kakao",provider_user_id:"abc",verified:true});assert.strictEqual(L.identityDecision({identityRow:{provider:"kakao",provider_user_id:"abc",user_id:"u"},verified:v}).action,"reuse_user")});
ok("logout revokes current",()=>assert.strictEqual(O.logoutDecision({sessionRow:{id:"s",user_id:"u"}}).action,"revoke_current_session"));
console.log("Login foundation v1: ALL PASS");
