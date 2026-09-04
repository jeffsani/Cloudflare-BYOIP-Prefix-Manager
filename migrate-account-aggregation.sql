-- One-time versioned migration for aggregate multi-account preferences and account-scoped activity.
-- Apply exactly once to existing databases; new databases should use schema.sql instead.

CREATE TABLE IF NOT EXISTS user_preferences (
  user_email         TEXT PRIMARY KEY,
  aggregate_accounts INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE activity_log ADD COLUMN account_id TEXT;

CREATE INDEX IF NOT EXISTS idx_activity_log_user_account_created
  ON activity_log(user_email, account_id, created_at);
