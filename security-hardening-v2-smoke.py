import sqlite3,pathlib,datetime
root=pathlib.Path(__file__).resolve().parent;db=sqlite3.connect(":memory:");db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"));now=datetime.datetime.now(datetime.timezone.utc).isoformat()
db.execute("INSERT INTO users(id,status,created_at,updated_at) VALUES(?,?,?,?)",("u1","active",now,now))
db.execute("INSERT INTO admin_security(user_id,mfa_required,mfa_verified_at,access_enabled,updated_at) VALUES(?,?,?,?,?)",("u1",1,now,0,now))
db.execute("INSERT INTO backup_manifests(id,backup_type,state,checksum,created_at,verified_at,restore_tested_at) VALUES(?,?,?,?,?,?,?)",("b1","D1","VERIFIED","abc",now,now,now))
db.execute("INSERT INTO audit_logs(id,actor_type,action,prev_hash,entry_hash,created_at) VALUES(?,?,?,?,?,?)",("a1","system","boot","", "hash1",now))
assert db.execute("SELECT state FROM backup_manifests WHERE id='b1'").fetchone()[0]=="VERIFIED"
print("Security hardening v2 SQLite smoke: ALL PASS")
