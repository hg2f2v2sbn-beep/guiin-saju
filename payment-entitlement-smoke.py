import sqlite3,pathlib,datetime,json
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
exp=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=180)).isoformat()

db.execute("INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)",("g","h",now,now,exp))
db.execute("INSERT INTO wallet_accounts(subject_type,subject_id,balance,reserved_balance,version,updated_at) VALUES(?,?,?,?,?,?)",("guest","g",0,0,0,now))
product=db.execute("SELECT id,price_amount,currency,benefits_json FROM products WHERE product_code='CLOVER_2'").fetchone()
pid,price,currency,benefits=product
assert price==1650 and currency=="KRW"

snap=json.dumps({"product_id":pid,"product_code":"CLOVER_2","product_type":"wallet","name":"클로버 2개","price_amount":price,"currency":"KRW","benefits":json.loads(benefits)},ensure_ascii=False)
db.execute("""INSERT INTO orders(id,guest_session_id,product_id,idempotency_key,state,product_snapshot_json,amount,currency,created_at,updated_at)
VALUES(?,?,?,?,?,?,?,?,?,?)""",("o1","g",pid,"order_1234567890","CREATED",snap,price,currency,now,now))
db.execute("""INSERT INTO payments(id,order_id,provider,provider_payment_id,state,approved_amount,currency,approved_at,verified_at,verification_source,created_at,updated_at)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",("pay1","o1","TEST","pp1","VERIFIED",price,currency,now,now,"test_verified",now,now))
db.execute("UPDATE orders SET state='PAID' WHERE id='o1'")

credits=json.loads(benefits)["credits"]
before=db.execute("SELECT balance FROM wallet_accounts WHERE subject_type='guest' AND subject_id='g'").fetchone()[0]
after=before+credits
db.execute("UPDATE wallet_accounts SET balance=balance+?,version=version+1,updated_at=? WHERE subject_type='guest' AND subject_id='g'",(credits,now))
db.execute("""INSERT INTO wallet_ledger(id,subject_type,subject_id,request_id,order_id,kind,delta,balance_after,state,idempotency_key,note,created_at)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",("l1","guest","g","r1","o1","PURCHASE",credits,after,"POSTED","purchase:o1","test",now))
db.execute("UPDATE orders SET state='FULFILLED' WHERE id='o1'")
assert db.execute("SELECT balance FROM wallet_accounts WHERE subject_id='g'").fetchone()[0]==2
assert db.execute("SELECT state FROM orders WHERE id='o1'").fetchone()[0]=="FULFILLED"

# Duplicate provider payment ID must fail.
try:
    db.execute("""INSERT INTO payments(id,order_id,provider,provider_payment_id,state,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?)""",("pay2","o1","TEST","pp1","VERIFIED",now,now))
    raise AssertionError("duplicate provider_payment_id not blocked")
except sqlite3.IntegrityError:
    pass

print("Payment entitlement SQLite smoke: ALL PASS")
