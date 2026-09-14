import sqlite3,pathlib,datetime,json
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
report={"codeReady":True,"externalReady":False,"paymentsAllowed":False}
db.execute("""INSERT INTO final_launch_runs(
 id,environment,app_version,state,code_ready,external_ready,payments_allowed,report_json,created_at,completed_at
) VALUES(?,?,?,?,?,?,?,?,?,?)""",("run","staging","6.0","BLOCKED",1,0,0,json.dumps(report),now,now))
db.execute("""INSERT INTO final_launch_checks(
 id,final_launch_run_id,check_key,category,source,required,state,details_json,checked_at
) VALUES(?,?,?,?,?,?,?,?,?)""",("c","run","PG_TEST_VERIFIED","launch","external",1,"MISSING","{}",now))
row=db.execute("SELECT code_ready,external_ready,payments_allowed FROM final_launch_runs WHERE id='run'").fetchone()
assert row==(1,0,0)
print("Final launch SQLite smoke: ALL PASS")
