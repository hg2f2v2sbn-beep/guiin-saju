"use strict";
const fs=require("fs"),assert=require("assert"),m=JSON.parse(fs.readFileSync("failure-safety-matrix-v2-100.json","utf8"));
assert.strictEqual(m.scenarios.length,100);
assert.strictEqual(new Set(m.scenarios.map(x=>x.id)).size,100);
const cats={};for(const x of m.scenarios)cats[x.category]=(cats[x.category]||0)+1;
for(const c of ["CALC","AI","AUTH","DATA","MONEY","PAY","REFUND","SEC","OPS","LEGAL"])assert.strictEqual(cats[c],10,c+" count");
assert(m.scenarios.filter(x=>x.blocks_launch).length>=50);
console.log("100 failure scenarios: ALL PASS");
