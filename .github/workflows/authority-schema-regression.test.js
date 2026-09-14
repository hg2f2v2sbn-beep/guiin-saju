"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["CREATE TABLE IF NOT EXISTS account_link_events","CREATE TABLE IF NOT EXISTS client_state_migrations","idx_client_state_migrations_subject"])assert(s.includes(x),x+" missing");
console.log("Authority transition schema: ALL PASS");
