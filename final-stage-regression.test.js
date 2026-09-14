"use strict";
const fs=require("fs"),assert=require("assert"),x=JSON.parse(fs.readFileSync("30-stage-completion.json","utf8"));
assert.strictEqual(x.stages.length,30);
assert.strictEqual(x.code_completion,"30/30");
assert.strictEqual(x.production_launch_status,"BLOCKED_UNTIL_EXTERNAL_GATES_PASS");
assert(x.stages.every(s=>s.code_state==="PASS"));
console.log("30-stage completion: ALL PASS");
