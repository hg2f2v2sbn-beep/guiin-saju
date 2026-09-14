"use strict";
function canonicalPayload(rawBody){if(typeof rawBody!=="string")throw new Error("raw_body_required");return rawBody}
async function sha256Hex(value){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(value)));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function hmacSha256Hex(secret,value){
  if(!secret)throw new Error("webhook_secret_required");
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(String(secret)),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(String(value)));
  return[...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function constantTimeEqualHex(a,b){const x=String(a||"").toLowerCase(),y=String(b||"").toLowerCase();if(x.length!==y.length||!x.length)return false;let d=0;for(let i=0;i<x.length;i++)d|=x.charCodeAt(i)^y.charCodeAt(i);return d===0}
async function verifyMockWebhook({rawBody,signature,secret}){const expected=await hmacSha256Hex(secret,canonicalPayload(rawBody));return{ok:constantTimeEqualHex(expected,signature),signature_hash:await sha256Hex(signature||""),version:"hmac-sha256-test"}}
async function verifyProviderWebhook({provider,rawBody,signature,secret}){
  const p=String(provider||"").toLowerCase();
  if(p==="mock")return verifyMockWebhook({rawBody,signature,secret});
  if(p==="inicis")return{ok:false,reason:"inicis_signature_adapter_not_configured",version:"pending-provider-spec"};
  return{ok:false,reason:"unsupported_pg_provider",version:null};
}
module.exports={canonicalPayload,sha256Hex,hmacSha256Hex,constantTimeEqualHex,verifyMockWebhook,verifyProviderWebhook};
