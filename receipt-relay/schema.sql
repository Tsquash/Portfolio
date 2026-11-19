CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  note TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ip_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'leased', 'printed')),
  lease_token TEXT,
  lease_until INTEGER,
  printed_at INTEGER
);

CREATE INDEX IF NOT EXISTS notes_pending ON notes(status, created_at);
CREATE INDEX IF NOT EXISTS notes_rate_limit ON notes(ip_hash, created_at);
