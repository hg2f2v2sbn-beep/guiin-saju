import sqlite3,pathlib,datetime
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
states=dict(db.execute("SELECT state_key,state_value FROM service_state"))
assert states["PAYMENTS_DISABLED"]=="true"
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
db.execute("INSERT INTO incident_events(id,incident_type,severity,state,details_json,created_at) VALUES(?,?,?,?,?,?)",("i1","test","warning","OPEN","{}",now))
db.execute("INSERT INTO integrity_checks(id,check_type,state,checked_at,issue_count,details_json) VALUES(?,?,?,?,?,?)",("c1","wallet","PASS",now,0,"{}"))
assert db.execute("SELECT state FROM incident_events WHERE id='i1'").fetchone()[0]=="OPEN"
print("Reliability SQLite smoke: ALL PASS")
