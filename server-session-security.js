"use strict";
function p(v){const n=Date.parse(String(v||""));return Number.isFinite(n)?n:null}
function sessionDecision(r,now=Date.now()){if(!r)return{active:false,reason:"missing"};if(r.revoked_at)return{active:false,reason:"revoked"};const e=p(r.expires_at);if(e==null||e<=now)return{active:false,reason:"expired"};const a=p(r.absolute_expires_at);if(a!=null&&a<=now)return{active:false,reason:"absolute_expired"};const l=p(r.last_seen_at)||p(r.created_at),i=Number(r.idle_timeout_seconds||0);if(l!=null&&i>0&&l+i*1000<=now)return{active:false,reason:"idle_expired"};return{active:true,reason:null}}
function shouldRotate(r,now=Date.now(),sec=86400){if(!sessionDecision(r,now).active)return false;const t=p(r.rotated_at)||p(r.created_at);return t!=null&&now-t>=sec*1000}
function rotationPlan({row,newTokenHash,nowIso}){if(!sessionDecision(row,Date.parse(nowIso)).active)throw new Error("inactive_session");return{token_hash:String(newTokenHash),previous_token_hash:String(row.token_hash),token_version:Number(row.token_version||1)+1,rotated_at:String(nowIso),last_seen_at:String(nowIso)}}
module.exports={sessionDecision,shouldRotate,rotationPlan};
