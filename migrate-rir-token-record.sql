-- One-time versioned migration adding the per-registrar validation-token record selection.
-- Controls which RIR record(s) the Cloudflare ownership/validation token is written to and
-- checked in during prefix onboarding: 'route' (route/route6), 'autnum', or 'both'.
-- Apply exactly once to existing databases; new databases should use schema.sql instead.

ALTER TABLE rir_credentials ADD COLUMN token_record TEXT NOT NULL DEFAULT '';
