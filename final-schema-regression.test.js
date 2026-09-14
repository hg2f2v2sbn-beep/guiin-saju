"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["CREATE TABLE IF NOT EXISTS final_launch_runs","CREATE TABLE IF NOT EXISTS final_launch_checks","idx_final_launch_checks_run"])assert(s.includes(x),x+" missing");
console.log("Final launch schema v1: ALL PASS");
