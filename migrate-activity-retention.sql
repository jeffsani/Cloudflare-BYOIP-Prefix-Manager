-- Per-account activity/log retention (days). Local log tables (activity_log,
-- audit_log_events, notification_log, webhook_events) are auto-purged past this
-- window by the scheduled cron. Apply once to existing databases; new databases
-- should use schema.sql instead. Safe to ignore a "duplicate column" error.

ALTER TABLE user_accounts ADD COLUMN activity_retention_days INTEGER NOT NULL DEFAULT 180;
