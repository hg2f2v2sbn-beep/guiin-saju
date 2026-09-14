"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("worker-v4.1-persistence-preview.js","utf8");
for(const x of [
  '4.1-persistence-preview',
  '/api/chart-snapshots',
  'CLIENT_FACTS_UNVERIFIED',
  'durableResultStored:false',
  'serverCharged:false',
  'paymentsEnabled:false'
])assert(s.includes(x),x+" missing");
assert(s.indexOf('url.pathname==="/api/chat"') < s.indexOf('if(!dbReady(env))return json'));
console.log("Worker v4.1 persistence preview: ALL PASS");
