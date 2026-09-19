"use strict";
const fs=require("fs"),assert=require("assert");

const w=fs.readFileSync("worker-production-candidate.js","utf8");
const cfg=fs.readFileSync("wrangler.production.example.toml","utf8");
const manifest=JSON.parse(fs.readFileSync("production-readiness-manifest.json","utf8"));

function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("production worker has distinct version",()=>{
  assert(w.includes('WORKER_VERSION="6.1-production-candidate"'));
});
ok("production readiness is fail-closed",()=>{
  assert(w.includes("function productionReadiness(env)"));
  assert(w.includes('error:"production_infrastructure_not_ready"'));
  assert(w.includes('url.pathname==="/api/production/readiness"'));
});
ok("production worker keeps Kakao direct + handoff routes",()=>{
  for(const x of [
    '/api/auth/kakao/start',
    '/api/auth/kakao/callback',
    '/api/auth/kakao/handoff'
  ]) assert(w.includes(x),x+" missing");
});
ok("production worker keeps member data routes",()=>{
  for(const x of [
    '/api/session/guest','/api/profiles','/api/chart-snapshots',
    '/api/conversations','/api/me/purchases','/api/me/restore-summary'
  ]) assert(w.includes(x),x+" missing");
});
ok("production worker keeps AI route",()=>{
  assert(w.includes('url.pathname==="/api/chat"'));
  assert(w.includes("OPENAI_API_KEY"));
});
ok("production config uses separate D1 and exact production Kakao callback",()=>{
  assert(cfg.includes('name = "guiin-saju-api"'));
  assert(cfg.includes('database_name = "guiin-saju-production-db"'));
  assert(cfg.includes('binding = "DB"'));
  assert(cfg.includes('ENVIRONMENT = "production"'));
  assert(cfg.includes('KAKAO_REDIRECT_URI = "https://guiin-saju-api.blue-wls.workers.dev/api/auth/kakao/callback"'));
});
ok("payments and server accounting remain off",()=>{
  for(const x of [
    'NEW_PAYMENTS_ENABLED = "false"',
    'SERVER_WALLET_ENABLED = "false"',
    'SERVER_FREE_QUOTA_ENABLED = "false"'
  ]) assert(cfg.includes(x),x+" missing");
  assert.strictEqual(manifest.payments_allowed,false);
  assert.strictEqual(manifest.production_frontend_switch_allowed,false);
});
ok("production config contains no secret value",()=>{
  assert(!/sk-[A-Za-z0-9_-]{20,}/.test(cfg));
  assert(!/KAKAO_REST_API_KEY\s*=\s*"[^"]+"/.test(cfg));
  assert(!/KAKAO_CLIENT_SECRET\s*=\s*"[^"]+"/.test(cfg));
  assert(!/SECURITY_HASH_SECRET\s*=\s*"[^"]+"/.test(cfg));
});
ok("frontend remains staging during production build",()=>{
  assert.strictEqual(manifest.frontend_active_environment,"staging");
  assert.strictEqual(manifest.gates.FRONTEND_SWITCHED_TO_PRODUCTION,"BLOCKED");
});

console.log("\nProduction Infrastructure Gate: ALL PASS");
