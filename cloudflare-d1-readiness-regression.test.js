"use strict";
const fs=require("fs"),assert=require("assert");
const worker=fs.readFileSync("worker-v4-integrated-preview.js","utf8");
const cfg=fs.readFileSync("wrangler.example.toml","utf8");
const guide=fs.readFileSync("CLOUDFLARE-D1-DEPLOY.md","utf8");
const init=fs.readFileSync("server-d1-init.sql","utf8");

function ok(label,fn){try{fn();console.log("PASS",label)}catch(e){console.error("FAIL",label);throw e}}

ok("v4 keeps chat before DB gate",()=>{
  assert(worker.indexOf('url.pathname==="/api/chat"') < worker.indexOf('if(!dbReady(env))return json'));
});
ok("payments and server accounting stay off",()=>{
  assert(worker.includes("paymentsEnabled:false"));
  assert(worker.includes("serverAccountingReady:false"));
  assert(worker.includes("serverCharged:false"));
});
ok("wrangler uses DB binding but no secret value",()=>{
  assert(cfg.includes('binding = "DB"'));
  assert(cfg.includes('database_id = "PUT_YOUR_D1_DATABASE_ID_HERE"'));
  assert(!/sk-proj-|OPENAI_API_KEY\s*=/.test(cfg));
});
ok("safe bootstrap flags stay off",()=>{
  assert(init.includes("'NEW_PAYMENTS_ENABLED', 0"));
  assert(init.includes("'SERVER_WALLET_ENABLED', 0"));
  assert(init.includes("'SERVER_FREE_QUOTA_ENABLED', 0"));
});
ok("deployment guide contains rollback and health gates",()=>{
  assert(guide.includes("롤백"));
  assert(guide.includes("databaseReady = true"));
  assert(guide.includes("paymentsEnabled = false"));
});
console.log("\nCloudflare D1 readiness v1: ALL PASS");
