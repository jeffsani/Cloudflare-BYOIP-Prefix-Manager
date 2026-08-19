import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env } from '../types';
import { getToken, resolveAccount } from '../helpers';
import {
  lookupBgpRoutes,
  lookupRdap,
  lookupRpki,
  lookupRipestatVisibility,
} from '../api';
import {
  LookingGlassRequestSchema,
  LgResultSchema,
  RdapResultSchema,
  RpkiLookupResultSchema,
  RipestatVisibilityResultSchema,
} from '../schemas/lookups';
import { ActivityLogEntrySchema } from '../schemas/activity';
import { ErrorResponseSchema, AccountIdQuerySchema } from '../schemas/common';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// POST /api/looking-glass
export class LookingGlass extends OpenAPIRoute {
  schema = {
    tags: ['Lookups'],
    summary: 'BGP route lookup',
    description: 'Look up BGP routes for a prefix via Cloudflare Radar, including AS-path, collectors, and RPKI validation.',
    request: {
      body: contentJson(LookingGlassRequestSchema),
    },
    responses: {
      '200': {
        description: 'BGP route data',
        ...contentJson(z.object({ result: LgResultSchema })),
      },
      '400': {
        description: 'Missing prefix or account',
        ...contentJson(ErrorResponseSchema),
      },
      '502': {
        description: 'Radar API error',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;

    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await lookupBgpRoutes(body.prefix, token);
      return c.json({ result });
    } catch (e) {
      console.error('Looking glass error:', e);
      return c.json({ error: 'Failed to fetch BGP routes' }, 502);
    }
  }
}

// GET /api/rdap
export class RdapLookup extends OpenAPIRoute {
  schema = {
    tags: ['Lookups'],
    summary: 'RDAP / Whois lookup',
    description: 'Look up RDAP registration data for a prefix (org, country, RIR, allocation date).',
    request: {
      query: z.object({
        prefix: z.string().describe('IP prefix (e.g. 192.0.2.0/24)'),
      }),
    },
    responses: {
      '200': {
        description: 'RDAP result',
        ...contentJson(z.object({ result: RdapResultSchema })),
      },
      '400': {
        description: 'Missing prefix',
        ...contentJson(ErrorResponseSchema),
      },
      '502': {
        description: 'RDAP lookup failed',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const prefix = data.query.prefix;

    try {
      const result = await lookupRdap(prefix);
      return c.json({ result });
    } catch (e) {
      console.error('RDAP lookup error:', e);
      return c.json({ error: 'RDAP lookup failed' }, 502);
    }
  }
}

// GET /api/rpki
export class RpkiLookup extends OpenAPIRoute {
  schema = {
    tags: ['Lookups'],
    summary: 'RPKI ROA lookup',
    description: 'Look up RPKI/ROA validation data for a prefix via RIPEstat.',
    request: {
      query: z.object({
        prefix: z.string().describe('IP prefix'),
        account_id: z.string().optional().describe('Cloudflare account ID'),
      }),
    },
    responses: {
      '200': {
        description: 'RPKI result',
        ...contentJson(z.object({ result: RpkiLookupResultSchema })),
      },
      '400': {
        description: 'Missing prefix or account',
        ...contentJson(ErrorResponseSchema),
      },
      '502': {
        description: 'RPKI lookup failed',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const prefix = data.query.prefix;

    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await lookupRpki(prefix, token);
      return c.json({ result });
    } catch (e) {
      console.error('RPKI lookup error:', e);
      return c.json({ error: 'RPKI lookup failed' }, 502);
    }
  }
}

// GET /api/ripestat-visibility
export class RipestatVisibility extends OpenAPIRoute {
  schema = {
    tags: ['Lookups'],
    summary: 'RIPEstat visibility',
    description: 'Check BGP visibility of a prefix across RIPEstat route collectors worldwide.',
    request: {
      query: z.object({
        prefix: z.string().describe('IP prefix'),
      }),
    },
    responses: {
      '200': {
        description: 'Visibility result',
        ...contentJson(z.object({ result: RipestatVisibilityResultSchema })),
      },
      '400': {
        description: 'Missing prefix',
        ...contentJson(ErrorResponseSchema),
      },
      '502': {
        description: 'RIPEstat lookup failed',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const prefix = data.query.prefix;

    try {
      const result = await lookupRipestatVisibility(prefix);
      return c.json({ result });
    } catch (e) {
      console.error('RIPEstat visibility error:', e);
      return c.json({ error: 'RIPEstat visibility lookup failed' }, 502);
    }
  }
}

// GET /api/activity
export class GetActivity extends OpenAPIRoute {
  schema = {
    tags: ['Activity'],
    summary: 'Activity log',
    description: 'Get the last 50 activity log entries for the authenticated user.',
    responses: {
      '200': {
        description: 'Activity log entries',
        ...contentJson(z.object({ activity: z.array(ActivityLogEntrySchema) })),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const rows = await c.env.DB.prepare(
      'SELECT * FROM activity_log WHERE user_email = ? ORDER BY created_at DESC LIMIT 50',
    )
      .bind(email)
      .all();
    return c.json({ activity: rows.results || [] });
  }
}
