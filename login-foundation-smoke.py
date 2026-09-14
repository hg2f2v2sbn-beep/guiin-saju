import sqlite3,pathlib,datetime
root=pathlib.Path(__file__).resolve().parent;db=sqlite3.connect(":memory:");db.executescript((root/"server-d1-init.sql").read_text(encoding="utf-8"))
now=datetime.datetime.now(datetime.timezone.utc).isoformat();exp=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(minutes=10)).isoformat()
db.execute("INSERT INTO users(id,status,created_at,updated_at) VALUES(?,?,?,?)",("u","active",now,now))
db.execute("INSERT INTO auth_identities(id,user_id,provider,provider_user_id,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",("i","u","kakao","subject-1",1,now,now))
db.execute("INSERT INTO auth_login_states(id,provider,state_hash,redirect_path,expires_at,created_at) VALUES(?,?,?,?,?,?)",("s","kakao","hash","/",exp,now))
assert db.execute("SELECT user_id FROM auth_identities WHERE provider='kakao' AND provider_user_id='subject-1'").fetchone()[0]=="u"
print("Login foundation SQLite smoke: ALL PASS")
