-- Accounts: one row per user + account combo (multi-account support)
CREATE TABLE IF NOT EXISTS user_accounts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email      TEXT NOT NULL,
  account_label   TEXT NOT NULL DEFAULT '',
  account_id      TEXT NOT NULL DEFAULT '',
  api_token       TEXT NOT NULL DEFAULT '',
  is_default      INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_email, account_id)
);

-- API tokens: multiple tokens per account for load-balancing
-- (1200 req / 5 min / token rate limit)
CREATE TABLE IF NOT EXISTS account_tokens (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email      TEXT NOT NULL,
  account_id      TEXT NOT NULL,
  token_label     TEXT NOT NULL DEFAULT '',
  api_token       TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_email, account_id, api_token)
);

-- Activity log for tracking actions (advertisement toggles, etc.)
CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email  TEXT NOT NULL,
  action      TEXT NOT NULL,
  details     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
