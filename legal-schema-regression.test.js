"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["CREATE TABLE IF NOT EXISTS legal_documents","CREATE TABLE IF NOT EXISTS legal_readiness_checks","idx_legal_documents_type_state"])assert(s.includes(x),x+" missing");
console.log("Legal schema v1: ALL PASS");
