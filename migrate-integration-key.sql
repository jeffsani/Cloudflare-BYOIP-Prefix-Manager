-- Rename routing_key → integration_key in PagerDuty channel configs.
-- Safe to re-run: only updates rows that still have routing_key.
UPDATE notification_channels
SET config = json_object('integration_key', json_extract(config, '$.routing_key'))
WHERE type = 'pagerduty'
  AND json_extract(config, '$.routing_key') IS NOT NULL;
