import { z } from 'zod';

export const AccountSchema = z.object({
  id: z.number(),
  account_label: z.string(),
  account_id: z.string(),
  api_token: z.string().describe('Masked API token'),
  is_default: z.number(),
  api_rate_limit_5min: z.number().int().positive().describe('Editable Cloudflare API budget (requests / 5 min)'),
  activity_retention_days: z.number().int().min(1).describe('Days of local log history to retain before auto-purge'),
  updated_at: z.string(),
});

export const AccountPreferencesSchema = z.object({
  aggregate_accounts: z.boolean(),
});

export const SettingsResponseSchema = z.object({
  accounts: z.array(AccountSchema),
  aggregate_accounts: z.boolean(),
});

export const CreateAccountRequestSchema = z.object({
  account_label: z.string().optional().default(''),
  account_id: z.string().regex(/^[0-9a-fA-F]{32}$/, 'account_id must be a 32-character Cloudflare account ID'),
  api_token: z.string().optional(),
  // Left undefined when the caller doesn't intend to change it, so partial
  // updates (e.g. editing only the token) don't reset the stored value.
  api_rate_limit_5min: z.number().int().positive().optional(),
  activity_retention_days: z.number().int().min(1).optional(),
});

export const TokenTestRequestSchema = z.object({
  account_id: z.string().min(1, 'account_id is required'),
  api_token: z.string().optional(),
});

export const TokenTestResultItemSchema = z.object({
  permission: z.string(),
  status: z.enum(['ok', 'fail']),
  detail: z.string().optional(),
});

export const TokenTestResponseSchema = z.object({
  results: z.array(TokenTestResultItemSchema),
});
