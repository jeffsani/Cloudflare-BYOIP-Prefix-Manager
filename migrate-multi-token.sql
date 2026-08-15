-- Migration: Add account_tokens table for multi-token load balancing
-- Each Cloudflare account can have multiple API tokens to distribute
-- requests across them and avoid the 1200 req / 5 min / token rate limit.

CREATE TABLE IF NOT EXISTS account_tokens (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email      TEXT NOT NULL,
  account_id      TEXT NOT NULL,
  token_label     TEXT NOT NULL DEFAULT '',
  api_token       TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_email, account_id, api_token)
);

-- Migrate existing tokens from user_accounts into account_tokens
INSERT OR IGNORE INTO account_tokens (user_email, account_id, token_label, api_token)
  SELECT user_email, account_id, 'Default', api_token
  FROM user_accounts
  WHERE api_token IS NOT NULL AND api_token != '';
