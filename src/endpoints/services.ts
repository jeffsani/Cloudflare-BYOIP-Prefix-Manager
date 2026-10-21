import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env } from '../types';
import { getToken, resolveAccount } from '../helpers';
import { listServices, getAccountEntitlements } from '../api';
import { cachedJson, cacheKeys, cacheTtl } from '../cache';
import { CfServiceSchema, EntitlementsSchema } from '../schemas/prefixes';
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
        ...contentJson(z.object({ services: z.array(CfServiceSchema), entitlements: EntitlementsSchema })),
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
      const result = await cachedJson(
        c.env,
        cacheKeys.services(acct.account_id),
        cacheTtl.services,
        () => listServices(acct.account_id, token),
        (v) => v.success,
      );
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      // Best-effort entitlement lookup; never fail the services call over it.
      const entitlements = await cachedJson(
        c.env,
        cacheKeys.entitlements(acct.account_id),
        cacheTtl.entitlements,
        () => getAccountEntitlements(acct.account_id, token),
        (v) => v.available,
      );
      return c.json({ services: result.result || [], entitlements });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}
