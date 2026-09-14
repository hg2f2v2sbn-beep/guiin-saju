"use strict";
const fs=require("fs"),assert=require("assert"),m=JSON.parse(fs.readFileSync("launch-gate-matrix.json","utf8"));
const all=Object.values(m.categories).flat();
assert(all.length>=30,"expected >=30 gates");
for(const k of ["engine_golden","ai_no_loss","wallet_reserve_spend_release","payment_idempotency","webhook_recovery","origin_allowlist","audit_integrity","legal_ready","pg_verified"])assert(all.includes(k),k+" missing");
console.log("Launch gate matrix v1: ALL PASS");
