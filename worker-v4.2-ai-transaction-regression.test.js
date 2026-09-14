"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("worker-v4.2-ai-transaction-preview.js","utf8");
for(const x of [
  "4.2-ai-transaction-preview",
  "findAiReplay",
  "startAiRequest",
  "storeAiSuccess",
  "markAiFailure",
  "durable_store_completed",
  "durableResultStored",
  "serverCharged:false",
  "serverAccountingReady:false",
  "request_in_progress"
])assert(s.includes(x),x+" missing");
assert(s.includes("INSERT INTO ai_results"));
assert(s.includes("INSERT OR IGNORE INTO messages"));
assert(s.includes("UPDATE ai_requests SET state='STORED'"));
assert(!s.includes("SERVER_WALLET_ENABLED===true"));
console.log("Worker v4.2 transaction preview: ALL PASS");
