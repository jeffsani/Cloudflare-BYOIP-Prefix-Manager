-- Concurrent prefix advertisement gating (per account). `prefix_advertise_limit`
-- caps the number of BGP sub-prefixes that may be advertised at once; advertisements
-- over the limit fail at Cloudflare. `prefix_advertise_threshold_pct` is the percentage
-- of the limit at which an "approaching cap" alert fires. `cap_alert_level` is the
-- edge-trigger de-dup state (none|threshold|limit). Apply once to existing databases;
-- new databases should use schema.sql instead. Safe to ignore a "duplicate column" error.

ALTER TABLE user_accounts ADD COLUMN prefix_advertise_limit INTEGER NOT NULL DEFAULT 100;
ALTER TABLE user_accounts ADD COLUMN prefix_advertise_threshold_pct INTEGER NOT NULL DEFAULT 80;
ALTER TABLE user_accounts ADD COLUMN cap_alert_level TEXT NOT NULL DEFAULT 'none';
