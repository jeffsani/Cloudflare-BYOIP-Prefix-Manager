-- Add type column to webhook_endpoints to distinguish notification vs logpush webhooks.
-- Safe to re-run: ALTER TABLE errors with "duplicate column" if already applied.
ALTER TABLE webhook_endpoints ADD COLUMN type TEXT NOT NULL DEFAULT 'notification';

-- Backfill existing Logpush-created webhooks based on their naming convention.
UPDATE webhook_endpoints SET type = 'logpush' WHERE name = 'Audit Logs (Logpush)';
