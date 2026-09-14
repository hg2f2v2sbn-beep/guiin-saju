"use strict";
const assert=require("assert"),A=require("./server-authority-transition.js");
assert.strictEqual(A.normalizeMode("shadow"),"SHADOW");
assert.strictEqual(A.decideUsage({mode:"SHADOW",serverUsage:{free:{remaining:2}},legacyUsage:{free:{remaining:2}}}).source,"legacy");
assert.strictEqual(A.decideUsage({mode:"SERVER",serverUsage:{free:{remaining:2}},legacyUsage:{free:{remaining:1}}}).source,"server");
assert.strictEqual(A.compareUsage({free:{remaining:2},wallet:{available:1}},{free:{remaining:2},wallet:{available:1}}).match,true);
assert.strictEqual(A.canSwitchToServer({stagingReady:true,usageReadable:true,accountRestoreReady:true,legacyComparisonHealthy:false}).ready,false);
console.log("Authority transition v1: ALL PASS");
