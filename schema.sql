-- Accounts: one row per user + account combo (multi-account support)
-- Note: Cloudflare API rate limit is 1200 req / 5 min per user (shared across all tokens).
CREATE TABLE IF NOT EXISTS user_accounts (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email          TEXT NOT NULL,
  account_label       TEXT NOT NULL DEFAULT '',
  account_id          TEXT NOT NULL DEFAULT '',
  api_token           TEXT NOT NULL DEFAULT '',
  is_default          INTEGER NOT NULL DEFAULT 0,
  -- Editable per-account Cloudflare API budget (requests / 5 min). Used to size the
  -- Radar-based advertisement poller so it stays within the account's rate limit.
  api_rate_limit_5min INTEGER NOT NULL DEFAULT 1200,
  updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_email, account_id)
);

-- Migration for existing databases (safe to run repeatedly; ignore "duplicate column" error):
-- ALTER TABLE user_accounts ADD COLUMN api_rate_limit_5min INTEGER NOT NULL DEFAULT 1200;

-- Activity log for tracking actions (advertisement toggles, etc.)
CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email  TEXT NOT NULL,
  action      TEXT NOT NULL,
  details     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- RIR credentials for automated IRR record management (ARIN, RIPE)
CREATE TABLE IF NOT EXISTS rir_credentials (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email      TEXT NOT NULL,
  account_id      TEXT NOT NULL,
  rir             TEXT NOT NULL,
  api_key         TEXT NOT NULL DEFAULT '',
  maintainer      TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_email, account_id, rir)
);

-- Local descriptions for prefix delegations (CF API has no description field)
CREATE TABLE IF NOT EXISTS delegation_descriptions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  delegation_id   TEXT NOT NULL,
  account_id      TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(delegation_id, account_id)
);

-- ─── Notifications ──────────────────────────────────────────────────
-- Delivery channels are per user + Cloudflare account.
CREATE TABLE IF NOT EXISTS notification_channels (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email   TEXT NOT NULL,
  account_id   TEXT NOT NULL,
  type         TEXT NOT NULL,               -- 'email' | 'pagerduty' | 'webhook'
  name         TEXT NOT NULL DEFAULT '',
  config       TEXT NOT NULL DEFAULT '{}',  -- JSON: {url,token} | {routing_key} | {email}
  enabled      INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notification_channels_acct ON notification_channels(user_email, account_id);

-- Which channels fire for a given event type, per account. One row per (account, event).
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email   TEXT NOT NULL,
  account_id   TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  channel_ids  TEXT NOT NULL DEFAULT '[]',  -- JSON array of notification_channels.id
  enabled      INTEGER NOT NULL DEFAULT 1,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_email, account_id, event_type)
);

-- One row per (notification, channel) delivery attempt; drives the queue-status panel.
CREATE TABLE IF NOT EXISTS notification_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email    TEXT NOT NULL,
  account_id    TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  title         TEXT NOT NULL DEFAULT '',
  details       TEXT NOT NULL DEFAULT '',
  channel_id    INTEGER,
  channel_type  TEXT NOT NULL DEFAULT '',
  payload       TEXT NOT NULL DEFAULT '{}', -- JSON snapshot dispatched to the channel
  status        TEXT NOT NULL DEFAULT 'queued', -- queued|sent|retrying|failed|dead_letter
  attempts      INTEGER NOT NULL DEFAULT 0,
  error         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  delivered_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_log_acct ON notification_log(user_email, account_id, created_at);

-- Snapshot of the global BGP state observed via Cloudflare Radar, per monitored CIDR.
-- Used to detect advertisement changes that happened outside this tool.
CREATE TABLE IF NOT EXISTS prefix_radar_state (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id      TEXT NOT NULL,
  cidr            TEXT NOT NULL,
  announced       INTEGER NOT NULL DEFAULT 0,
  origin_asn      INTEGER,
  visible_routes  INTEGER NOT NULL DEFAULT 0,
  last_change_at  TEXT,
  -- Consolidated state augmentation. Radar `announced` stays authoritative; these
  -- columns record the control-plane intended state and inbound-webhook provenance.
  cf_advertised      INTEGER,             -- control-plane advertised flag (addressing API)
  source             TEXT NOT NULL DEFAULT 'radar', -- radar|webhook|control_plane
  last_webhook_at    TEXT,
  last_webhook_event TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(account_id, cidr)
);

-- Cache of the CIDR set to monitor per account (refreshed infrequently to save API budget).
CREATE TABLE IF NOT EXISTS prefix_monitor_cache (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email    TEXT NOT NULL,
  account_id    TEXT NOT NULL,
  cidrs         TEXT NOT NULL DEFAULT '[]', -- JSON array of announced CIDRs
  refreshed_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_email, account_id)
);

-- ─── Machine-facing integrations ────────────────────────────────────
-- API keys for the read-only Query API. One key is scoped to a single Cloudflare
-- account; only the SHA-256 hash of the key is stored (plaintext shown once).
CREATE TABLE IF NOT EXISTS api_keys (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id   TEXT NOT NULL,             -- CF account this key is scoped to
  owner_email  TEXT NOT NULL,             -- user_accounts.user_email owning the account (notif routing)
  name         TEXT NOT NULL DEFAULT '',
  key_hash     TEXT NOT NULL,             -- SHA-256(key)
  key_prefix   TEXT NOT NULL DEFAULT '',  -- first chars for display/identification
  scopes       TEXT NOT NULL DEFAULT '["read"]', -- JSON array, future permission scoping
  enabled      INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(key_hash)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_account ON api_keys(account_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Inbound webhook endpoints. Cloudflare sends the configured secret in the
-- `cf-webhook-auth` header; we match by SHA-256 hash to resolve the account.
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id   TEXT NOT NULL,
  owner_email  TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  secret_hash  TEXT NOT NULL,             -- SHA-256(cf-webhook-auth secret)
  enabled      INTEGER NOT NULL DEFAULT 1,
  last_seen_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(secret_hash)
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_hash ON webhook_endpoints(secret_hash);

-- Audit log of raw inbound webhook payloads (debugging / replay).
CREATE TABLE IF NOT EXISTS webhook_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id  TEXT NOT NULL,
  alert_type  TEXT NOT NULL DEFAULT '',
  cidrs       TEXT NOT NULL DEFAULT '[]', -- JSON array parsed from payload
  action      TEXT NOT NULL DEFAULT '',   -- advertise|withdraw|unknown
  raw         TEXT NOT NULL DEFAULT '{}', -- full JSON payload
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_acct ON webhook_events(account_id, created_at);
