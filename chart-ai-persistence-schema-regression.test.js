"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("server-schema.sql","utf8");
for(const x of [
  "verification_state TEXT NOT NULL DEFAULT 'CLIENT_FACTS_UNVERIFIED'",
  "CREATE TABLE IF NOT EXISTS ai_results",
  "ai_request_id TEXT NOT NULL UNIQUE",
  "request_id TEXT NOT NULL UNIQUE",
  "idx_ai_results_conversation"
])assert(s.includes(x),x+" missing");
console.log("Chart/AI persistence schema: ALL PASS");
