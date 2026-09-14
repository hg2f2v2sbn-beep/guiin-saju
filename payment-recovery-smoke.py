import sqlite3,pathlib,datetime,json
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
exp=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=180)).isoformat()
db.execute("INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)",("g","h",now,now,exp))
p=db.execute("SELECT id,price_amount,currency,benefits_json FROM products WHERE product_code='LIFETIME_SAJU'").fetchone()
pid,price,currency,benefits=p
snap=json.dumps({"product_id":pid,"product_code":"LIFETIME_SAJU","benefits":json.loads(benefits)},ensure_ascii=False)
db.execute("""INSERT INTO orders(id,guest_session_id,product_id,idempotency_key,state,product_snapshot_json,amount,currency,created_at,updated_at)
VALUES(?,?,?,?,?,?,?,?,?,?)""",("o1","g",pid,"order_restore_123","FULFILLED",snap,price,currency,now,now))
db.execute("""INSERT INTO payments(id,order_id,provider,provider_payment_id,state,approved_amount,currency,approved_at,verified_at,verification_source,created_at,updated_at)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",("pay1","o1","TEST","pp1","VERIFIED",price,currency,now,now,"test",now,now))
db.execute("""INSERT INTO entitlements(id,guest_session_id,order_id,entitlement_type,state,granted_at)
VALUES(?,?,?,?,?,?)""",("e1","g","o1","lifetime_saju","ACTIVE",now))

# refund verified but entitlement still active => reconciliation issue
db.execute("""INSERT INTO refunds(id,payment_id,order_id,provider_refund_id,amount,currency,state,reason,idempotency_key,requested_at,completed_at,verified_at)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",("r1","pay1","o1","pr1",price,currency,"VERIFIED","test","refund_123456789",now,now,now))
db.execute("UPDATE orders SET state='REFUNDED',updated_at=? WHERE id='o1'",(now,))
db.execute("UPDATE payments SET state='REFUNDED',updated_at=? WHERE id='pay1'",(now,))
active=db.execute("SELECT COUNT(*) FROM entitlements WHERE order_id='o1' AND state='ACTIVE'").fetchone()[0]
assert active==1

db.execute("""INSERT INTO reconciliation_runs(id,run_type,state,started_at,completed_at,scanned_count,issue_count)
VALUES(?,?,?,?,?,?,?)""",("run1","PAYMENT_RECOVERY","COMPLETED",now,now,1,1))
db.execute("""INSERT INTO reconciliation_issues(id,reconciliation_run_id,issue_type,severity,order_id,payment_id,refund_id,state,details_json,detected_at)
VALUES(?,?,?,?,?,?,?,?,?,?)""",("i1","run1","REFUNDED_ENTITLEMENT_STILL_ACTIVE","critical","o1","pay1","r1","OPEN","{}",now))
assert db.execute("SELECT issue_type FROM reconciliation_issues WHERE id='i1'").fetchone()[0]=="REFUNDED_ENTITLEMENT_STILL_ACTIVE"

# webhook retry fields usable
db.execute("""INSERT INTO webhook_events(id,provider,provider_event_id,event_type,payload_hash,state,retry_count,last_error,received_at,next_retry_at)
VALUES(?,?,?,?,?,?,?,?,?,?)""",("w1","TEST","evt1","payment.updated","hash","FAILED",1,"timeout",now,now))
assert db.execute("SELECT retry_count FROM webhook_events WHERE id='w1'").fetchone()[0]==1

print("Payment recovery SQLite smoke: ALL PASS")
