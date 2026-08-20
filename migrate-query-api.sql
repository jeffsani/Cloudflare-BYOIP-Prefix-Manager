-- Migration: Query API + inbound Cloudflare webhook ingestion.
-- Safe to run repeatedly. The ALTER TABLE statements will error with
-- "duplicate column name" on databases that already have the columns —
-- that error is expected and can be ignored.

-- ─── New tables ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id   TEXT NOT NULL,
  owner_email  TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  key_hash     TEXT NOT NULL,
  key_prefix   TEXT NOT NULL DEFAULT '',
  scopes       TEXT NOT NULL DEFAULT '["read"]',
  enabled      INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(key_hash)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_account ON api_keys(account_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id   TEXT NOT NULL,
  owner_email  TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  secret_hash  TEXT NOT NULL,
  enabled      INTEGER NOT NULL DEFAULT 1,
  last_seen_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(secret_hash)
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_hash ON webhook_endpoints(secret_hash);

CREATE TABLE IF NOT EXISTS webhook_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id  TEXT NOT NULL,
  alert_type  TEXT NOT NULL DEFAULT '',
  cidrs       TEXT NOT NULL DEFAULT '[]',
  action      TEXT NOT NULL DEFAULT '',
  raw         TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_acct ON webhook_events(account_id, created_at);

-- ─── prefix_radar_state augmentation (ignore duplicate-column errors) ─

ALTER TABLE prefix_radar_state ADD COLUMN cf_advertised INTEGER;
ALTER TABLE prefix_radar_state ADD COLUMN source TEXT NOT NULL DEFAULT 'radar';
ALTER TABLE prefix_radar_state ADD COLUMN last_webhook_at TEXT;
ALTER TABLE prefix_radar_state ADD COLUMN last_webhook_event TEXT;
