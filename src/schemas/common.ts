import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

export const OkResponseSchema = z.object({
  ok: z.literal(true),
});

export const AccountIdQuerySchema = z.object({
  account_id: z.string().optional().describe('Cloudflare account ID (uses default if omitted)'),
});

export const ActivityQuerySchema = z.object({
  account_id: z.string().optional().describe('Cloudflare account ID, "all", or default if omitted'),
  days: z.coerce
    .number()
    .int()
    .positive()
    .max(180)
    .optional()
    .default(30)
    .describe('Number of days of history to load (default 30, max 180)'),
});
