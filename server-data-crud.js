"use strict";
function normalizeProfile(body={}){
  const cal=String(body.calendar||"양력"), y=Number(body.birth_year??body.year),m=Number(body.birth_month??body.month),d=Number(body.birth_day??body.day);
  if(!["양력","음력"].includes(cal))throw new Error("invalid_calendar");
  if(!Number.isInteger(y)||y<1900||y>2100)throw new Error("invalid_birth_year");
  if(!Number.isInteger(m)||m<1||m>12)throw new Error("invalid_birth_month");
  if(!Number.isInteger(d)||d<1||d>31)throw new Error("invalid_birth_day");
  const unknown=body.hour_unknown===true||body.hour_unknown===1;
  const h=unknown?null:Number(body.birth_hour??body.hour), mi=unknown?null:Number(body.birth_minute??body.minute??0);
  if(!unknown&&(!Number.isInteger(h)||h<0||h>23))throw new Error("invalid_birth_hour");
  if(!unknown&&(!Number.isInteger(mi)||mi<0||mi>59))throw new Error("invalid_birth_minute");
  return {label:String(body.label||"").trim().slice(0,40)||null,display_name:String(body.display_name||body.name||"").trim().replace(/\\s+/g," ").slice(0,40)||null,calendar:cal,lunar_leap_month:body.lunar_leap_month?1:0,birth_year:y,birth_month:m,birth_day:d,birth_hour:h,birth_minute:mi,hour_unknown:unknown?1:0,gender:String(body.gender||"").trim().slice(0,12)||null,timezone:String(body.timezone||"Asia/Seoul").slice(0,80),day_boundary:String(body.day_boundary||"23").slice(0,8),true_solar_time:body.true_solar_time?1:0,longitude:body.longitude==null?null:Number(body.longitude)};
}
function normalizeConversation(body={}){return{title:String(body.title||"").trim().slice(0,120)||null,chart_snapshot_id:String(body.chart_snapshot_id||body.chartSnapshotId||"").trim().slice(0,160)||null}}
function normalizeMessage(body={}){const content=String(body.content||"").trim();if(!content)throw new Error("message_required");if(content.length>12000)throw new Error("message_too_long");const requestId=String(body.request_id||body.requestId||"").trim();if(requestId&&(requestId.length<8||requestId.length>200))throw new Error("invalid_request_id");return{role:"user",content,request_id:requestId||null}}
function mayDeleteOwned(subject,row){if(!subject||!row)return false;if(subject.type==="user")return String(row.user_id||"")===String(subject.id);if(subject.type==="guest")return String(row.guest_session_id||"")===String(subject.id);return false}
module.exports={normalizeProfile,normalizeConversation,normalizeMessage,mayDeleteOwned};
