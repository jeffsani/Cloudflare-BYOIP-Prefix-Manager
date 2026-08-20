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
  listAuditLogs,
  buildPrefixCidrMap,
} from '../api';
import type { AuditLogEntry } from '../api';
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
    description:
      'Get local activity log entries for the authenticated user, merged with ' +
      'Cloudflare addressing audit-log entries for the specified account.',
    request: {
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'Activity log entries',
        ...contentJson(z.object({ activity: z.array(ActivityLogEntrySchema) })),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();

    // Local tool activity (user-scoped).
    const rows = await c.env.DB.prepare(
      'SELECT * FROM activity_log WHERE user_email = ? ORDER BY created_at DESC LIMIT 50',
    )
      .bind(email)
      .all();

    const localEntries = (rows.results || []).map((r: Record<string, unknown>) => ({
      source: 'local' as const,
      id: r.id as number,
      user_email: r.user_email as string,
      action: r.action as string,
      details: r.details as string,
      created_at: r.created_at as string,
    }));

    // Cloudflare audit log (account-scoped). Best-effort: never break local log.
    let auditEntries: Array<Record<string, unknown>> = [];
    try {
      const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
      if (acct?.account_id) {
        const token = await getToken(c.env.DB, email, acct.account_id);
        const now = new Date();
        const since = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        const [entries, prefixMap] = await Promise.all([
          listAuditLogs(acct.account_id, token, since.toISOString(), now.toISOString()),
          buildPrefixCidrMap(acct.account_id, token).catch(() => ({} as Record<string, string>)),
        ]);
        auditEntries = entries.map((e) => mapAuditEntry(e, prefixMap));
      }
    } catch {
      // Missing Audit:Read permission, no token, or API error — omit audit rows.
    }

    // Local created_at is UTC without a 'Z' suffix; normalize before comparing.
    const ts = (v: unknown) => {
      const s = String(v || '');
      return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z').getTime();
    };
    const merged = [...localEntries, ...auditEntries]
      .sort((a, b) => ts(b.created_at) - ts(a.created_at))
      .slice(0, 100);

    return c.json({ activity: merged });
  }
}

function mapAuditEntry(e: AuditLogEntry, prefixMap: Record<string, string>): Record<string, unknown> {
  const prefixId = e.resource?.id;
  const cidr = prefixId ? prefixMap[prefixId] : undefined;
  const description = e.action?.description || e.resource?.type || e.action?.type || 'Audit event';
  const target = cidr || prefixId;
  const details = target ? `${description} — ${target}` : description;

  return {
    source: 'audit' as const,
    id: e.id,
    action: e.action?.type || 'audit',
    action_description: e.action?.description,
    result: e.action?.result,
    details,
    created_at: e.action?.time || '',
    actor_email: e.actor?.email,
    actor_type: e.actor?.type,
    actor_context: e.actor?.context,
    actor_ip: e.actor?.ip_address,
    prefix_id: prefixId,
    cidr,
  };
}
