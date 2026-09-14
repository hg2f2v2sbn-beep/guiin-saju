"use strict";
const fs=require("fs"),assert=require("assert");
const s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["CREATE TABLE IF NOT EXISTS user_sessions","CREATE TABLE IF NOT EXISTS guest_conversions","guest_session_id TEXT","CHECK ((user_id IS NOT NULL) OR (guest_session_id IS NOT NULL))"])assert(s.includes(x),x+" missing");
const m=s.match(/CREATE TABLE IF NOT EXISTS profiles \(([\s\S]*?)\n\);/);
assert(m,"profiles table missing");
assert(!/\buser_id TEXT NOT NULL\b/.test(m[1]),"profiles.user_id must allow guest ownership");
assert(/\bguest_session_id TEXT\b/.test(m[1]));
console.log("Unified server schema regression: ALL PASS");
