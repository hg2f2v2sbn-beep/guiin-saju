import sqlite3,pathlib,datetime
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
db.execute("INSERT INTO legal_documents(id,document_type,version,state,created_at) VALUES(?,?,?,?,?)",("t","terms","draft-2026-09-14-v1","DRAFT",now))
db.execute("INSERT INTO legal_readiness_checks(check_key,state,details_json,checked_at) VALUES(?,?,?,?)",("MERCHANT_CONTACT_READY","FAIL","{}",now))
assert db.execute("SELECT state FROM legal_documents WHERE id='t'").fetchone()[0]=="DRAFT"
assert db.execute("SELECT state FROM legal_readiness_checks WHERE check_key='MERCHANT_CONTACT_READY'").fetchone()[0]=="FAIL"
print("Legal SQLite smoke: ALL PASS")
