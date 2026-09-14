"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of [
  "CREATE TABLE IF NOT EXISTS api_rate_limits",
  "CREATE TABLE IF NOT EXISTS security_events",
  "idx_security_events_type_time",
  "idx_security_events_subject"
])assert(s.includes(x),x+" missing");
console.log("Security hardening schema: ALL PASS");
