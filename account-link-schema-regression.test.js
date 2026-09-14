"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["CREATE TABLE IF NOT EXISTS account_link_events","UNIQUE(guest_session_id, user_id)","idx_account_link_user"])assert(s.includes(x),x+" missing");
console.log("Account link schema v1: ALL PASS");
