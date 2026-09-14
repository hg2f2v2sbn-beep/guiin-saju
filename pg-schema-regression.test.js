"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["CREATE TABLE IF NOT EXISTS pg_test_transactions","CREATE TABLE IF NOT EXISTS webhook_signatures","idx_pg_test_transactions_order"])assert(s.includes(x),x+" missing");
console.log("PG test schema v1: ALL PASS");
