import { z } from 'zod';

export const ActivityLogEntrySchema = z.object({
  id: z.number(),
  user_email: z.string(),
  action: z.string(),
  details: z.string(),
  created_at: z.string(),
});
