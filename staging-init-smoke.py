import sqlite3,pathlib
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
flags=dict(db.execute("SELECT flag_key, enabled FROM feature_flags"))
assert flags["NEW_PAYMENTS_ENABLED"]==0
assert flags["SERVER_WALLET_ENABLED"]==0
assert flags["SERVER_FREE_QUOTA_ENABLED"]==0
for table in ["users","guest_sessions","profiles","conversations","messages","orders","payments","entitlements","auth_login_states"]:
    assert db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?",(table,)).fetchone(),table
print("Staging D1 init smoke: ALL PASS")
