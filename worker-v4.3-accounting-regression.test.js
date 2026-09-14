"use strict";
const fs=require("fs"),assert=require("assert"),s=fs.readFileSync("worker-v4.3-accounting-preview.js","utf8");
for(const x of ["4.3-accounting-preview","reserveAccounting","finalizeAccounting","releaseAccounting","reserved_balance=reserved_balance+1","used_count=used_count+?","balance=balance-?","accounting_finalize_failed","SERVER_FREE_QUOTA_ENABLED","SERVER_WALLET_ENABLED"])assert(s.includes(x),x+" missing");
assert(s.includes('env.SERVER_FREE_QUOTA_ENABLED==="true"'));assert(s.includes('env.SERVER_WALLET_ENABLED==="true"'));
console.log("Worker v4.3 accounting preview: ALL PASS");
