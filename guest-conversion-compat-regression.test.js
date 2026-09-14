"use strict";
const assert=require("assert"),G=require("./server-guest-conversion.js");
assert.strictEqual(G.mergeWalletBalance(3,2),5);
assert.strictEqual(G.mergeLifetimeQuota({userUsed:1,guestUsed:2,limit:3}).used,3);
assert.strictEqual(G.canBeginConversion({requestedUserId:"u",activeWalletReservations:1}).reason,"active_reservation_exists");
console.log("Guest conversion compatibility: ALL PASS");
