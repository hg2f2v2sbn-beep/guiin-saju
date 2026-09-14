"use strict";
function stable(v){if(v===null||typeof v!=="object")return JSON.stringify(v);if(Array.isArray(v))return"["+v.map(stable).join(",")+"]";return"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+stable(v[k])).join(",")+"}"}
async function sha(v){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(v)));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function buildAuditHash({prevHash="",entry}){return sha(String(prevHash)+"|"+stable(entry))}
async function verifyLink({prevHash="",entry,entryHash}){return(await buildAuditHash({prevHash,entry}))===String(entryHash||"")}
module.exports={stable,buildAuditHash,verifyLink};
