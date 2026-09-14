"use strict";
const fs=require("fs"),assert=require("assert"),m=JSON.parse(fs.readFileSync("failure-safety-matrix.json","utf8"));
assert(m.scenarios.length>=25,"expected >=25 safety scenarios");
for(const id of ["AI-01","WALLET-01","PAY-01","WEBHOOK-01","REFUND-01","AUTH-01","SEC-01","DB-01","OPS-01","LEGAL-01"])assert(m.scenarios.some(x=>x.id===id),id+" missing");
console.log("Failure matrix v1: ALL PASS");
