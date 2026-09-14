"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("guiin-login-bridge.js","utf8");
for(const x of ["start(provider","/api/auth/login/start","/api/auth/logout","setUserToken(\"\")","isLoggedIn"])assert(s.includes(x),x+" missing");
console.log("Frontend login bridge: ALL PASS");
