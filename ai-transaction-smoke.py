import sqlite3, pathlib, datetime
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
exp=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=180)).isoformat()

db.execute("INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)",("g1","h1",now,now,exp))
db.execute("INSERT INTO conversations(id,guest_session_id,title,created_at,updated_at) VALUES(?,?,?,?,?)",("c1","g1","상담",now,now))
db.execute("""INSERT INTO ai_requests(
id,guest_session_id,conversation_id,request_type,idempotency_key,state,created_at,updated_at
) VALUES(?,?,?,?,?,?,?,?)""",("a1","g1","c1","AI_CHAT","idem_123456789012","PROCESSING",now,now))
db.execute("""INSERT INTO ai_request_events(
id,ai_request_id,from_state,to_state,event_type,request_id,created_at
) VALUES(?,?,?,?,?,?,?)""",("e1","a1","CREATED","PROCESSING","request_started","r1",now))
db.execute("UPDATE ai_requests SET state='AI_SUCCESS',updated_at=? WHERE id='a1'",(now,))
db.execute("UPDATE ai_requests SET state='VALIDATING',updated_at=? WHERE id='a1'",(now,))
db.execute("""INSERT INTO ai_results(
id,ai_request_id,request_id,response_text,response_json,quality_json,conversation_id,created_at
) VALUES(?,?,?,?,?,?,?,?)""",("res1","a1","r1","저장된 답변","{}","{}","c1",now))
db.execute("INSERT INTO messages(id,conversation_id,role,content,request_id,created_at) VALUES(?,?,?,?,?,?)",("m1","c1","user","질문","r1:user",now))
db.execute("INSERT INTO messages(id,conversation_id,role,content,request_id,created_at) VALUES(?,?,?,?,?,?)",("m2","c1","assistant","저장된 답변","r1:assistant",now))
db.execute("UPDATE ai_requests SET state='STORED',completed_at=?,updated_at=? WHERE id='a1'",(now,now))
db.execute("""INSERT INTO ai_request_events(
id,ai_request_id,from_state,to_state,event_type,request_id,created_at
) VALUES(?,?,?,?,?,?,?)""",("e2","a1","VALIDATING","STORED","durable_store_completed","r1",now))

state=db.execute("SELECT state FROM ai_requests WHERE id='a1'").fetchone()[0]
answer=db.execute("SELECT response_text FROM ai_results WHERE ai_request_id='a1'").fetchone()[0]
msgs=db.execute("SELECT role,content FROM messages WHERE conversation_id='c1' ORDER BY id").fetchall()
assert state=="STORED"
assert answer=="저장된 답변"
assert len(msgs)==2
print("AI transaction SQLite smoke: ALL PASS")
