import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env } from '../types';
import { getToken, resolveAccount } from '../helpers';
import { listServices } from '../api';
import { CfServiceSchema } from '../schemas/prefixes';
import { ErrorResponseSchema, AccountIdQuerySchema } from '../schemas/common';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// GET /api/services
export class ListServicesEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Services'],
    summary: 'List available services',
    description: 'List Cloudflare services available for service bindings (e.g. Magic Transit, Spectrum).',
    request: {
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'List of services',
        ...contentJson(z.object({ services: z.array(CfServiceSchema) })),
      },
      '400': {
        description: 'No account configured',
        ...contentJson(ErrorResponseSchema),
      },
      '502': {
        description: 'Cloudflare API error',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await listServices(acct.account_id, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      return c.json({ services: result.result || [] });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}
