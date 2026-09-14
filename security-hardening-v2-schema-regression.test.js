"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["token_version INTEGER NOT NULL DEFAULT 1","absolute_expires_at TEXT","CREATE TABLE IF NOT EXISTS admin_security","CREATE TABLE IF NOT EXISTS csrf_nonces","CREATE TABLE IF NOT EXISTS backup_manifests","entry_hash TEXT"])assert(s.includes(x),x+" missing");
console.log("Security hardening v2 schema: ALL PASS");
