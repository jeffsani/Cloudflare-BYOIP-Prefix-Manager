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

export const CreateAccountRequestSchema = z.object({
  account_label: z.string().optional().default(''),
  account_id: z.string().min(1, 'account_id is required'),
  api_token: z.string().optional(),
  api_rate_limit_5min: z.number().int().positive().optional().default(1200),
});

export const TokenTestRequestSchema = z.object({
  account_id: z.string().min(1, 'account_id is required'),
  api_token: z.string().min(1, 'api_token is required'),
});

export const TokenTestResultItemSchema = z.object({
  permission: z.string(),
  status: z.enum(['ok', 'fail']),
  detail: z.string().optional(),
});

export const TokenTestResponseSchema = z.object({
  results: z.array(TokenTestResultItemSchema),
});
