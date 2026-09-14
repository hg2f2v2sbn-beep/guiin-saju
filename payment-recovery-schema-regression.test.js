"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of [
  "failure_code TEXT","retry_count INTEGER NOT NULL DEFAULT 0","next_retry_at TEXT",
  "CREATE TABLE IF NOT EXISTS reconciliation_runs","CREATE TABLE IF NOT EXISTS reconciliation_issues",
  "idx_reconciliation_issues_open","idx_webhook_retry"
])assert(s.includes(x),x+" missing");
console.log("Payment recovery schema: ALL PASS");
