"use strict";
const fs=require("fs"),assert=require("assert"),x=JSON.parse(fs.readFileSync("external-gate-status.json","utf8"));
assert.strictEqual(x.code_ready,true);
assert.strictEqual(x.external_ready,false);
assert.strictEqual(x.payments_allowed,false);
assert(Object.values(x.gates).every(v=>v==="PENDING"));
console.log("External gate status: ALL PASS");
