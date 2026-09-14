"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["idx_guest_conversion_once","idx_conversation_summary_version","idx_messages_request_role"])assert(s.includes(x),x+" missing");
console.log("Integrated schema fix: ALL PASS");
