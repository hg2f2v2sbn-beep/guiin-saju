"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("server-schema.sql","utf8");
for(const x of [
  "CREATE TABLE IF NOT EXISTS guest_conversions",
  "idx_guest_conversion_once",
  "idx_messages_request_role",
  "idx_conversation_summary_version"
]) assert(s.includes(x),x+" missing");
console.log("Server data schema regression: ALL PASS");
