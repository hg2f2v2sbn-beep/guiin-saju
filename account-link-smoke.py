import sqlite3,pathlib,datetime
root=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(":memory:")
db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
exp=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=180)).isoformat()

db.execute("INSERT INTO users(id,status,created_at,updated_at) VALUES(?,?,?,?)",("u","active",now,now))
db.execute("INSERT INTO guest_sessions(id,token_hash,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)",("g","h",now,now,exp))
db.execute("INSERT INTO wallet_accounts(subject_type,subject_id,balance,reserved_balance,version,updated_at) VALUES(?,?,?,?,?,?)",("guest","g",2,0,0,now))
db.execute("INSERT INTO usage_quotas(id,subject_type,subject_id,quota_key,period_key,used_count,reserved_count,limit_count,updated_at) VALUES(?,?,?,?,?,?,?,?,?)",("q","guest","g","ai_chat_free","lifetime",2,0,3,now))
db.execute("INSERT INTO account_link_events(id,guest_session_id,user_id,state,idempotency_key,created_at) VALUES(?,?,?,?,?,?)",("l","g","u","PROCESSING","link_123456789012",now))

# simulate safe merge invariants
gb=db.execute("SELECT balance FROM wallet_accounts WHERE subject_type='guest' AND subject_id='g'").fetchone()[0]
db.execute("INSERT INTO wallet_accounts(subject_type,subject_id,balance,reserved_balance,version,updated_at) VALUES(?,?,?,?,?,?)",("user","u",gb,0,0,now))
db.execute("DELETE FROM wallet_accounts WHERE subject_type='guest' AND subject_id='g'")
db.execute("UPDATE guest_sessions SET converted_user_id=?,revoked_at=?,revoke_reason='converted_to_user' WHERE id='g'",("u",now))
db.execute("UPDATE account_link_events SET state='COMPLETED',completed_at=? WHERE id='l'",(now,))
assert db.execute("SELECT balance FROM wallet_accounts WHERE subject_type='user' AND subject_id='u'").fetchone()[0]==2
assert db.execute("SELECT converted_user_id FROM guest_sessions WHERE id='g'").fetchone()[0]=="u"
assert db.execute("SELECT state FROM account_link_events WHERE id='l'").fetchone()[0]=="COMPLETED"
print("Account link SQLite smoke: ALL PASS")
