import { z } from 'zod';

// A unified log entry that can represent either a local tool action or a
// Cloudflare audit-log entry. Local rows populate the base fields; audit rows
// additionally populate the actor/resource fields below.
export const ActivityLogEntrySchema = z.object({
  source: z.enum(['local', 'audit']).default('local'),
  id: z.union([z.number(), z.string()]).optional(),
  user_email: z.string().optional(),
  action: z.string(),
  details: z.string(),
  created_at: z.string(),
  // Audit-only fields
  action_description: z.string().optional(),
  result: z.string().optional(),
  actor_email: z.string().optional(),
  actor_type: z.string().optional(),
  actor_context: z.string().optional(),
  actor_ip: z.string().optional(),
  prefix_id: z.string().optional(),
  cidr: z.string().optional(),
});
