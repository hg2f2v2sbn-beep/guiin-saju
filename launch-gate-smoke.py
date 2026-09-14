import sqlite3,pathlib,datetime
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
db.execute("INSERT INTO launch_gate_runs(id,environment,app_version,state,started_at,completed_at,passed_count,failed_count,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)",("run1","staging","v4.9","FAIL",now,now,2,1,"{}"))
db.execute("INSERT INTO launch_gate_results(id,launch_gate_run_id,gate_key,category,required,state,details_json,checked_at) VALUES(?,?,?,?,?,?,?,?)",("g1","run1","legal_ready","launch",1,"FAIL","{}",now))
db.execute("INSERT INTO launch_gate_results(id,launch_gate_run_id,gate_key,category,required,state,details_json,checked_at) VALUES(?,?,?,?,?,?,?,?)",("g2","run1","engine_golden","calculation",1,"PASS","{}",now))
assert db.execute("SELECT failed_count FROM launch_gate_runs WHERE id='run1'").fetchone()[0]==1
assert db.execute("SELECT gate_key FROM launch_gate_results WHERE launch_gate_run_id='run1' AND state!='PASS'").fetchone()[0]=="legal_ready"
print("Launch gate SQLite smoke: ALL PASS")
