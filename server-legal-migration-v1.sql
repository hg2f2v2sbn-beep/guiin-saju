PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS legal_documents (
  id TEXT PRIMARY KEY,
  document_type TEXT NOT NULL,
  version TEXT NOT NULL,
  state TEXT NOT NULL,
  content_hash TEXT,
  effective_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(document_type, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type_state
ON legal_documents(document_type, state, created_at);

CREATE TABLE IF NOT EXISTS legal_readiness_checks (
  check_key TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  details_json TEXT,
  checked_at TEXT NOT NULL
);
