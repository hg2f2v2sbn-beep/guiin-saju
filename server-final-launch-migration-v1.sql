PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS final_launch_runs (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL,
  app_version TEXT NOT NULL,
  state TEXT NOT NULL,
  code_ready INTEGER NOT NULL DEFAULT 0,
  external_ready INTEGER NOT NULL DEFAULT 0,
  payments_allowed INTEGER NOT NULL DEFAULT 0,
  report_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS final_launch_checks (
  id TEXT PRIMARY KEY,
  final_launch_run_id TEXT NOT NULL,
  check_key TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1,
  state TEXT NOT NULL,
  details_json TEXT,
  checked_at TEXT NOT NULL,
  FOREIGN KEY (final_launch_run_id) REFERENCES final_launch_runs(id),
  UNIQUE(final_launch_run_id, check_key)
);

CREATE INDEX IF NOT EXISTS idx_final_launch_checks_run
ON final_launch_checks(final_launch_run_id, state, category);
