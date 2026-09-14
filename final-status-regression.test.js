"use strict";
const fs=require("fs"),assert=require("assert"),x=JSON.parse(fs.readFileSync("FINAL-LAUNCH-STATUS.json","utf8"));
assert.strictEqual(x.code_ready,true);
assert.strictEqual(x.external_ready,false);
assert.strictEqual(x.launch_ready,false);
assert.strictEqual(x.payments_allowed,false);
assert(x.external_blockers.length>=10);
console.log("Final launch status fail-closed: ALL PASS");
