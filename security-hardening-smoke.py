import sqlite3,pathlib,datetime
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()

db.execute("INSERT INTO api_rate_limits(bucket_key,window_start,request_count,updated_at) VALUES(?,?,?,?)",("bucket",now,1,now))
db.execute("UPDATE api_rate_limits SET request_count=request_count+1,updated_at=? WHERE bucket_key='bucket'",(now,))
assert db.execute("SELECT request_count FROM api_rate_limits WHERE bucket_key='bucket'").fetchone()[0]==2

db.execute("""INSERT INTO security_events(
id,event_type,severity,subject_type,subject_id,request_id,route,ip_hash,user_agent_hash,metadata_json,created_at
) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
("s1","rate_limited","warning","guest","g1","r1","/api/chat","iph","uah",'{"safe":true}',now))
row=db.execute("SELECT event_type,metadata_json FROM security_events WHERE id='s1'").fetchone()
assert row==("rate_limited",'{"safe":true}')
print("Security hardening SQLite smoke: ALL PASS")
