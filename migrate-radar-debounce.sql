-- Add debounce/hysteresis columns to prefix_radar_state so the Radar poller only
-- commits an advertisement-state change (and emits an external advertise/withdraw
-- event) after the new state has held for CONFIRM_POLLS consecutive polls. This
-- absorbs transient Radar realtime visibility jitter that otherwise flapped the
-- state every minute.
-- Apply exactly once to existing databases; new databases use schema.sql instead.
-- Safe to re-run: ALTER TABLE errors with "duplicate column" if already applied.
ALTER TABLE prefix_radar_state ADD COLUMN pending_announced INTEGER;
ALTER TABLE prefix_radar_state ADD COLUMN pending_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE prefix_radar_state ADD COLUMN pending_since TEXT;
