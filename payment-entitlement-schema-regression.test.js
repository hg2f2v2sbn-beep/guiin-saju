"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of [
  "verified_at TEXT","verification_source TEXT","raw_payload_hash TEXT",
  "CREATE TABLE IF NOT EXISTS payment_events","idx_payment_events_order","idx_entitlement_grant_once"
])assert(s.includes(x),x+" missing");
console.log("Payment entitlement schema: ALL PASS");
