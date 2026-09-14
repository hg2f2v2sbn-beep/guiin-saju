"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["reserved_balance INTEGER NOT NULL DEFAULT 0","charge_source TEXT","quota_reservation_id TEXT","wallet_reservation_id TEXT"])assert(s.includes(x),x+" missing");
console.log("Server accounting v2 schema: ALL PASS");
