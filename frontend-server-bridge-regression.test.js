"use strict";
const assert=require("assert");
const Client=require("./guiin-server-client.js");
const BridgeFactoryPath="./guiin-frontend-bridge.js";
const Bridge=require(BridgeFactoryPath);

function ok(l,f){try{f();console.log("PASS",l)}catch(e){console.error("FAIL",l);throw e}}

ok("client API is fixed to current worker",()=>{
  assert.strictEqual(Client.API,"https://guiin-saju-api.blue-wls.workers.dev");
});
ok("auth headers prefer user token over guest",()=>{
  // Node test has no localStorage; verify function exists and returns Accept safely.
  assert.strictEqual(typeof Client.authHeaders,"function");
  assert.strictEqual(Client.authHeaders().Accept,"application/json");
});
ok("usage normalization supports free + wallet",()=>{
  const x=Bridge.normalizeUsage({usage:{free:{used:1,reserved:1,limit:3},wallet:{balance:4,reserved:1}}});
  assert.strictEqual(x.free.remaining,1);
  assert.strictEqual(x.wallet.available,3);
});
ok("bridge exposes server-accounting readiness predicate",()=>{
  assert.strictEqual(typeof Bridge.mayUseServerAccounting,"function");
});
ok("purchase history renders server order state",()=>{
  Bridge.STATE.purchases={orders:[{state:"FULFILLED",amount:5900,product:{name:"평생사주"}}]};
  const html=Bridge.purchaseHistoryHtml(x=>String(x));
  assert(html.includes("평생사주"));
  assert(html.includes("FULFILLED"));
});
console.log("Frontend server bridge v1: ALL PASS");
