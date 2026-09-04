import { z } from 'zod';

export const AccountSchema = z.object({
  id: z.number(),
  account_label: z.string(),
  account_id: z.string(),
  api_token: z.string().describe('Masked API token'),
  is_default: z.number(),
  api_rate_limit_5min: z.number().int().positive().describe('Editable Cloudflare API budget (requests / 5 min)'),
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
  account_id: z.string().min(1, 'account_id is required'),
  api_token: z.string().optional(),
  api_rate_limit_5min: z.number().int().positive().optional().default(1200),
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
