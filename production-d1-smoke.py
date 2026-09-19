import sqlite3, pathlib

root=pathlib.Path(__file__).resolve().parent
schema_path=root/"server-d1-init.sql"
if not schema_path.exists():
    raise SystemExit("server-d1-init.sql must be next to this test when running in the repository")

db=sqlite3.connect(":memory:")
db.executescript(schema_path.read_text(encoding="utf-8"))

required={
    "users","auth_identities","user_sessions","guest_sessions",
    "profiles","chart_snapshots","conversations","messages",
    "ai_requests","ai_results","orders","payments","entitlements",
    "feature_flags","service_state"
}
tables={r[0] for r in db.execute("select name from sqlite_master where type='table'")}
missing=sorted(required-tables)
assert not missing, f"missing tables: {missing}"

flags=dict(db.execute("""
select flag_key,enabled from feature_flags
where flag_key in ('NEW_PAYMENTS_ENABLED','SERVER_WALLET_ENABLED','SERVER_FREE_QUOTA_ENABLED')
"""))
assert flags.get("NEW_PAYMENTS_ENABLED")==0
assert flags.get("SERVER_WALLET_ENABLED")==0
assert flags.get("SERVER_FREE_QUOTA_ENABLED")==0

states=dict(db.execute("""
select state_key,state_value from service_state
where state_key in ('MAINTENANCE_MODE','READ_ONLY_MODE','AI_DISABLED','PAYMENTS_DISABLED')
"""))
assert states.get("PAYMENTS_DISABLED")=="true"
assert states.get("MAINTENANCE_MODE")=="false"
assert states.get("READ_ONLY_MODE")=="false"

print("Production D1 local schema smoke: ALL PASS")
