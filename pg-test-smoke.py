import sqlite3,pathlib,datetime,json
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()

product=db.execute("SELECT id,price_amount,currency,benefits_json FROM products WHERE product_code='LIFETIME_SAJU'").fetchone()
assert product, "bootstrap product missing"
pid,amount,currency,benefits=product
db.execute("INSERT INTO users(id,status,created_at,updated_at) VALUES(?,?,?,?)",("u","active",now,now))
db.execute("INSERT INTO orders(id,user_id,product_id,idempotency_key,state,product_snapshot_json,amount,currency,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
           ("o","u",pid,"idem_pg_test_0001","CREATED",json.dumps({"price_amount":amount,"currency":currency,"benefits":json.loads(benefits)}),amount,currency,now,now))
db.execute("INSERT INTO pg_test_transactions(id,provider,order_id,test_mode,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",("t","mock","o",1,"CREATED",now,now))
assert db.execute("SELECT test_mode FROM pg_test_transactions WHERE id='t'").fetchone()[0]==1
print("PG test SQLite smoke: ALL PASS")
