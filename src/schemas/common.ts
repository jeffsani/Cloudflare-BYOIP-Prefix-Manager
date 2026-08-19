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
