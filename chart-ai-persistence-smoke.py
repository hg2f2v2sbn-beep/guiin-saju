import sqlite3, pathlib, datetime, json
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
cols={r[1] for r in db.execute("PRAGMA table_info(chart_snapshots)")}
assert "verification_state" in cols
tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
assert "ai_results" in tables

now=datetime.datetime.now(datetime.timezone.utc).isoformat()
exp=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=180)).isoformat()
db.execute("INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)",("g","h",now,now,exp))
db.execute("""INSERT INTO chart_snapshots(
id,user_id,guest_session_id,chart_key,calculation_rule_version,normalized_input_json,
chart_facts_json,uncertainty_json,verification_state,created_at
) VALUES(?,?,?,?,?,?,?,?,?,?)""",
("chart1",None,"g","key1","v1","{}","{}","{}","CLIENT_FACTS_UNVERIFIED",now))
db.execute("""INSERT INTO ai_requests(
id,guest_session_id,request_type,idempotency_key,state,created_at,updated_at
) VALUES(?,?,?,?,?,?,?)""",("air1","g","AI_CHAT","idem_123456789012","STORED",now,now))
db.execute("""INSERT INTO ai_results(
id,ai_request_id,request_id,response_text,response_json,quality_json,chart_snapshot_id,created_at
) VALUES(?,?,?,?,?,?,?,?)""",
("res1","air1","req1","답변","{}","{}","chart1",now))
try:
    db.execute("""INSERT INTO ai_results(
id,ai_request_id,request_id,response_text,created_at
) VALUES(?,?,?,?,?)""",("res2","air1","req2","중복",now))
    raise AssertionError("duplicate ai_request_id was not blocked")
except sqlite3.IntegrityError:
    pass
print("Chart/AI persistence SQLite smoke: ALL PASS")
