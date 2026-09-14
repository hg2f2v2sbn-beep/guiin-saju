"use strict";
const assert=require("assert"),W=require("./server-webhook-signature.js");
(async()=>{const raw='{"event":"paid"}',secret="test-secret",sig=await W.hmacSha256Hex(secret,raw);
assert.strictEqual((await W.verifyMockWebhook({rawBody:raw,signature:sig,secret})).ok,true);
assert.strictEqual((await W.verifyMockWebhook({rawBody:raw,signature:"00",secret})).ok,false);
assert.strictEqual((await W.verifyProviderWebhook({provider:"inicis",rawBody:raw,signature:"x",secret})).reason,"inicis_signature_adapter_not_configured");
console.log("Webhook signature v1: ALL PASS")})().catch(e=>{console.error(e);process.exit(1)});
