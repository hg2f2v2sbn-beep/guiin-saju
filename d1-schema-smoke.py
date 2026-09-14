import sqlite3, pathlib, json, sys, datetime

root = pathlib.Path(__file__).resolve().parent
sql = (root / "server-d1-init.sql").read_text(encoding="utf-8")
db = sqlite3.connect(":memory:")
db.executescript(sql)
db.execute("PRAGMA foreign_keys = ON")

required = [
    "users","user_sessions","guest_sessions","profiles","chart_snapshots",
    "products","orders","payments","refunds","entitlements","wallet_accounts",
    "wallet_reservations","wallet_ledger","usage_quotas","quota_reservations",
    "reports","conversations","messages","conversation_summaries","ai_requests",
    "guest_conversions","feature_flags","audit_logs"
]
tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
missing = [x for x in required if x not in tables]
assert not missing, f"missing tables: {missing}"

flags = dict(db.execute("SELECT flag_key, enabled FROM feature_flags"))
assert flags["AI_CHAT_ENABLED"] == 1
assert flags["NEW_PAYMENTS_ENABLED"] == 0
assert flags["SERVER_WALLET_ENABLED"] == 0
assert flags["SERVER_FREE_QUOTA_ENABLED"] == 0

prices = dict(db.execute("SELECT product_code, price_amount FROM products"))
assert prices["LIFETIME_SAJU"] == 5900
assert prices["PREMIUM_COMPAT"] == 7900
assert prices["CLOVER_1"] == 1100
assert prices["CLOVER_2"] == 1650
assert prices["CLOVER_4"] == 2750

now = datetime.datetime.now(datetime.timezone.utc).isoformat()
exp = (datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=180)).isoformat()
db.execute("INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)",
           ("guest_test","hash_test",now,now,exp))
db.execute("""INSERT INTO usage_quotas
(id,subject_type,subject_id,quota_key,period_key,used_count,reserved_count,limit_count,updated_at)
VALUES(?,?,?,?,?,?,?,?,?)""",
("quota_test","guest","guest_test","ai_chat_free","lifetime",0,0,3,now))
db.execute("INSERT INTO wallet_accounts(subject_type,subject_id,balance,version,updated_at) VALUES(?,?,?,?,?)",
           ("guest","guest_test",0,0,now))
db.execute("""INSERT INTO profiles(
id,user_id,guest_session_id,calendar,birth_year,birth_month,birth_day,hour_unknown,
timezone,day_boundary,true_solar_time,created_at,updated_at
) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
("profile_test",None,"guest_test","양력",1991,11,23,1,"Asia/Seoul","23",0,now,now))
db.execute("""INSERT INTO conversations(
id,user_id,guest_session_id,title,created_at,updated_at
) VALUES(?,?,?,?,?,?)""",
("conv_test",None,"guest_test","테스트 상담",now,now))
db.execute("INSERT INTO messages(id,conversation_id,role,content,request_id,created_at) VALUES(?,?,?,?,?,?)",
           ("msg_test","conv_test","user","테스트","req_test_123456","%s" % now))

# Idempotency/duplicate message guard must fire.
try:
    db.execute("INSERT INTO messages(id,conversation_id,role,content,request_id,created_at) VALUES(?,?,?,?,?,?)",
               ("msg_dup","conv_test","user","중복","req_test_123456",now))
    raise AssertionError("duplicate message request_id was not blocked")
except sqlite3.IntegrityError:
    pass

# Guest-owned profile must be valid.
owner = db.execute("SELECT guest_session_id,user_id FROM profiles WHERE id='profile_test'").fetchone()
assert owner == ("guest_test", None)

# Re-running init must remain safe.
db.executescript(sql)

print("D1 local schema/bootstrap smoke: ALL PASS")
