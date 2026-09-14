PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS launch_gate_runs (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL,
  app_version TEXT,
  state TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  passed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS launch_gate_results (
  id TEXT PRIMARY KEY,
  launch_gate_run_id TEXT NOT NULL,
  gate_key TEXT NOT NULL,
  category TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1,
  state TEXT NOT NULL,
  details_json TEXT,
  checked_at TEXT NOT NULL,
  FOREIGN KEY (launch_gate_run_id) REFERENCES launch_gate_runs(id),
  UNIQUE(launch_gate_run_id, gate_key)
);

CREATE INDEX IF NOT EXISTS idx_launch_gate_results_run
ON launch_gate_results(launch_gate_run_id, state, category);
