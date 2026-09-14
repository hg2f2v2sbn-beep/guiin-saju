"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["CREATE TABLE IF NOT EXISTS service_state","CREATE TABLE IF NOT EXISTS incident_events","CREATE TABLE IF NOT EXISTS migration_history","CREATE TABLE IF NOT EXISTS integrity_checks","idx_incident_open"])assert(s.includes(x),x+" missing");
console.log("Reliability schema v1: ALL PASS");
