"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("server-schema.sql","utf8");
for(const x of [
  "CREATE TABLE IF NOT EXISTS ai_request_events",
  "idx_ai_request_events_request",
  "event_type TEXT NOT NULL",
  "to_state TEXT NOT NULL"
])assert(s.includes(x),x+" missing");
console.log("AI transaction schema: ALL PASS");
