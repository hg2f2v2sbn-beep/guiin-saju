"use strict";

const ALLOWED_ORIGINS = Object.freeze([
  "https://gwiinsaju.com",
  "https://www.gwiinsaju.com",
  "https://hg2f2v2sbn-beep.github.io"
]);

const SENSITIVE_KEYS = new Set([
  "authorization","cookie","set-cookie","x-guiin-guest","openai_api_key",
  "api_key","secret","token","access_token","refresh_token","password",
  "provider_payment_id","phone","telephone","email","name","display_name",
  "birth_year","birth_month","birth_day","birth_hour","birth_minute"
]);

function originAllowed(origin){
  if(!origin)return true;
  return ALLOWED_ORIGINS.includes(String(origin));
}

function routeClass(path){
  const p=String(path||"");
  if(p==="/health"||p==="/")return "public_read";
  if(p==="/api/session/guest")return "session_create";
  if(p==="/api/chat")return "ai";
  if(p.startsWith("/api/orders"))return "payment";
  if(p.startsWith("/api/me/"))return "private_read";
  if(p.startsWith("/api/profiles")||p.startsWith("/api/conversations")||p.startsWith("/api/chart-snapshots"))return "private_write";
  if(p.startsWith("/api/admin/"))return "admin";
  return "other";
}

function ratePolicy(route){
  const cls=routeClass(route);
  const policies={
    public_read:{limit:120,window_seconds:60},
    session_create:{limit:12,window_seconds:60},
    ai:{limit:20,window_seconds:60},
    payment:{limit:20,window_seconds:60},
    private_read:{limit:60,window_seconds:60},
    private_write:{limit:40,window_seconds:60},
    admin:{limit:10,window_seconds:60},
    other:{limit:30,window_seconds:60}
  };
  return policies[cls];
}

function requiresSession(path,method="GET"){
  const p=String(path||"");
  if(p==="/"||p==="/health")return false;
  if(p==="/api/session/guest"&&method==="POST")return false;
  return p.startsWith("/api/");
}

function requiresJson(method,path){
  const m=String(method||"GET").toUpperCase();
  if(!["POST","PUT","PATCH"].includes(m))return false;
  return path!=="/api/session/guest";
}

function bodyLimit(path){
  const cls=routeClass(path);
  if(cls==="ai")return 64*1024;
  if(cls==="payment")return 32*1024;
  return 24*1024;
}

function redact(value,depth=0){
  if(depth>6)return "[TRUNCATED]";
  if(value==null||typeof value==="number"||typeof value==="boolean")return value;
  if(typeof value==="string")return value.length>300?value.slice(0,300)+"…":value;
  if(Array.isArray(value))return value.slice(0,30).map(v=>redact(v,depth+1));
  if(typeof value==="object"){
    const out={};
    for(const [k,v] of Object.entries(value)){
      if(SENSITIVE_KEYS.has(String(k).toLowerCase()))out[k]="[REDACTED]";
      else out[k]=redact(v,depth+1);
    }
    return out;
  }
  return String(value);
}

function safeLogMetadata(meta){
  return redact(meta||{});
}

function securityHeaders(){
  return {
    "X-Content-Type-Options":"nosniff",
    "X-Frame-Options":"DENY",
    "Referrer-Policy":"no-referrer",
    "Permissions-Policy":"camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    "Strict-Transport-Security":"max-age=31536000; includeSubDomains"
  };
}

function adminAllowed({subject,adminIds=[]}){
  return !!subject && subject.type==="user" && adminIds.map(String).includes(String(subject.id));
}

module.exports={
  ALLOWED_ORIGINS,SENSITIVE_KEYS,originAllowed,routeClass,ratePolicy,
  requiresSession,requiresJson,bodyLimit,redact,safeLogMetadata,
  securityHeaders,adminAllowed
};
