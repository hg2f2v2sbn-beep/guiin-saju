import sqlite3,pathlib,datetime
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
exp=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=180)).isoformat()
db.execute("INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)",("g","h",now,now,exp))
db.execute("INSERT INTO users(id,status,created_at,updated_at) VALUES(?,?,?,?)",("u","active",now,now))
db.execute("INSERT INTO account_link_events(id,guest_session_id,user_id,state,idempotency_key,created_at) VALUES(?,?,?,?,?,?)",("l","g","u","COMPLETED","link_123456789012",now))
db.execute("INSERT INTO client_state_migrations(id,subject_type,subject_id,migration_key,state,legacy_snapshot_json,server_snapshot_json,created_at) VALUES(?,?,?,?,?,?,?,?)",("m","guest","g","usage-v1","SHADOW",'{"free":3}','{"free":3}',now))
assert db.execute("SELECT state FROM client_state_migrations WHERE id='m'").fetchone()[0]=="SHADOW"
print("Authority transition SQLite smoke: ALL PASS")
