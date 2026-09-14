"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["CREATE TABLE IF NOT EXISTS launch_gate_runs","CREATE TABLE IF NOT EXISTS launch_gate_results","idx_launch_gate_results_run","UNIQUE(launch_gate_run_id, gate_key)"])assert(s.includes(x),x+" missing");
console.log("Launch gate schema v1: ALL PASS");
