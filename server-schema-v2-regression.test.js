"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("server-schema.sql","utf8");
const required=[
  "CREATE TABLE IF NOT EXISTS user_sessions",
  "CREATE TABLE IF NOT EXISTS consents",
  "CREATE TABLE IF NOT EXISTS refunds",
  "CREATE TABLE IF NOT EXISTS wallet_reservations",
  "CREATE TABLE IF NOT EXISTS quota_reservations",
  "CREATE TABLE IF NOT EXISTS support_cases",
  "reserved_count INTEGER",
  "idempotency_key TEXT NOT NULL UNIQUE"
];
for(const x of required)assert(s.includes(x),x+" missing");
console.log("Server schema v2 regression: ALL PASS");
