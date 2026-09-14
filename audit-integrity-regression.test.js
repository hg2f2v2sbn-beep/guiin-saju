"use strict";
const assert=require("assert"),A=require("./server-audit-integrity.js");
(async()=>{const e={actor_type:"system",action:"test",created_at:"2026-09-14T00:00:00Z"};const h=await A.buildAuditHash({prevHash:"abc",entry:e});assert.strictEqual(await A.verifyLink({prevHash:"abc",entry:e,entryHash:h}),true);assert.strictEqual(await A.verifyLink({prevHash:"x",entry:e,entryHash:h}),false);console.log("Audit integrity v1: ALL PASS")})().catch(e=>{console.error(e);process.exit(1)});
