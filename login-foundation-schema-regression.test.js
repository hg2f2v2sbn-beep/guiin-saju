"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("server-schema.sql","utf8");
for(const x of ["CREATE TABLE IF NOT EXISTS auth_identities","UNIQUE(provider, provider_user_id)","CREATE TABLE IF NOT EXISTS auth_login_states","idx_auth_login_states_expiry","idx_auth_provider_user"])assert(s.includes(x),x+" missing");
console.log("Login foundation schema v1: ALL PASS");
