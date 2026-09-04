import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env, UserAccount } from '../types';
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
import { ErrorResponseSchema, AccountIdQuerySchema, ActivityQuerySchema } from '../schemas/common';

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
      query: ActivityQuerySchema,
    },
    responses: {
      '200': {
        description: 'Activity log entries',
        ...contentJson(z.object({
          activity: z.array(ActivityLogEntrySchema),
          audit_error: z.string().optional(),
        })),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const days = data.query.days;
    const aggregate = data.query.account_id === 'all';
    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let accounts: UserAccount[];
    if (aggregate) {
      const rows = await c.env.DB.prepare(
        'SELECT * FROM user_accounts WHERE user_email = ? ORDER BY is_default DESC, id ASC',
      ).bind(email).all<UserAccount>();
      accounts = rows.results || [];
    } else {
      const account = await resolveAccount(c.env.DB, email, data.query.account_id);
      accounts = account ? [account] : [];
    }
    const accountLabels = new Map(accounts.map((account) => [account.account_id, account.account_label]));

    // Local tool activity (user-scoped and structurally account-scoped).
    const accountPredicate = aggregate
      ? accounts.length
        ? `AND (account_id IS NULL OR account_id IN (${accounts.map(() => '?').join(', ')}))`
        : 'AND account_id IS NULL'
      : 'AND account_id = ?';
    const accountBindings = aggregate
      ? accounts.map((account) => account.account_id)
      : [accounts[0]?.account_id ?? null];
    const localRows = await c.env.DB.prepare(
      `SELECT * FROM activity_log
       WHERE user_email = ? AND created_at >= datetime('now', ?) ${accountPredicate}
       ORDER BY created_at DESC LIMIT 200`,
    )
      .bind(email, `-${days} days`, ...accountBindings)
      .all<Record<string, unknown>>();

    const localEntries = (localRows.results || [])
      .map((r) => {
        const action = r.action as string;
        const accountId = r.account_id == null ? null : String(r.account_id);
        const source = action.startsWith('webhook_') ? 'webhook' as const
          : action.startsWith('external_') ? 'radar' as const
          : 'local' as const;
        return {
          source,
          id: r.id as number,
          user_email: r.user_email as string,
          account_id: accountId,
          account_label: accountId ? accountLabels.get(accountId) : undefined,
          action,
          details: r.details as string,
          created_at: r.created_at as string,
        };
      });

    // Cloudflare audit log (account-scoped). Each account independently prefers
    // stored Logpush rows and falls back to the live API. Account failures do not
    // prevent successful account results or local activity from being returned.
    const auditResults = await Promise.all(accounts.map(async (account) => {
      try {
        const entries = await loadAccountAudit(c.env.DB, email, account, days, sinceIso);
        return { entries, error: undefined };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const label = account.account_label || account.account_id;
        console.error(`Audit log fetch failed for ${account.account_id}:`, message);
        return { entries: [] as Array<Record<string, unknown>>, error: `${label}: ${message}` };
      }
    }));
    const auditEntries = auditResults.flatMap((result) => result.entries);
    const errors = auditResults.flatMap((result) => result.error ? [result.error] : []);
    const auditError = errors.length ? errors.join('; ') : undefined;

    // Local created_at is UTC without a 'Z' suffix; normalize before comparing.
    const ts = (v: unknown) => {
      const s = String(v || '');
      return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z').getTime();
    };
    const merged = [...localEntries, ...auditEntries]
      .sort((a, b) => ts(b.created_at) - ts(a.created_at))
      .slice(0, 100);

    return c.json({ activity: merged, audit_error: auditError });
  }
}

async function loadAccountAudit(
  db: D1Database,
  email: string,
  account: UserAccount,
  days: number,
  sinceIso: string,
): Promise<Array<Record<string, unknown>>> {
  // Best-effort read of Logpush-ingested rows. If the table hasn't been
  // migrated yet ("no such table"), treat it as empty and fall through to
  // the live API rather than surfacing a misleading error.
  let storedRows: Array<Record<string, unknown>> = [];
  try {
    const stored = await db.prepare(
      'SELECT * FROM audit_log_events WHERE account_id = ? AND action_time >= ? ORDER BY action_time DESC LIMIT 100',
    ).bind(account.account_id, sinceIso).all<Record<string, unknown>>();
    storedRows = stored.results || [];
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!/no such table/i.test(message)) throw e; // real error — propagate
  }

  if (storedRows.length) {
    // Fast path — resolve CIDRs best-effort so display matches the live path.
    let prefixMap: Record<string, string> = {};
    try {
      const token = await getToken(db, email, account.account_id);
      prefixMap = await buildPrefixCidrMap(account.account_id, token);
    } catch {
      // No token / API error — fall back to raw resource IDs.
    }
    return storedRows.map((row) => mapAuditRow(row, prefixMap, account));
  }

  // Fallback path — no Logpush data yet; poll the live Audit Logs API.
  const token = await getToken(db, email, account.account_id);
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const [entries, prefixMap] = await Promise.all([
    listAuditLogs(account.account_id, token, since.toISOString(), now.toISOString()),
    buildPrefixCidrMap(account.account_id, token).catch(() => ({} as Record<string, string>)),
  ]);
  return entries.map((entry) => mapAuditEntry(entry, prefixMap, account));
}

/** Map a Logpush-ingested `audit_log_events` D1 row to the merged activity shape. */
function mapAuditRow(
  r: Record<string, unknown>,
  prefixMap: Record<string, string>,
  account: UserAccount,
): Record<string, unknown> {
  const prefixId = String(r.resource_id || '');
  const cidr = prefixId ? prefixMap[prefixId] : undefined;
  const description = String(r.action_description || r.resource_type || r.action_type || 'Audit event');
  const target = cidr || prefixId;
  const details = target ? `${description} — ${target}` : description;

  return {
    source: 'audit' as const,
    id: String(r.audit_log_id || ''),
    account_id: account.account_id,
    account_label: account.account_label,
    action: String(r.action_type || 'audit'),
    action_description: r.action_description,
    result: r.action_result,
    details,
    created_at: (r.action_time as string) || '',
    actor_email: r.actor_email,
    actor_type: r.actor_type,
    actor_context: r.actor_context,
    actor_ip: r.actor_ip,
    prefix_id: prefixId,
    cidr,
  };
}

function mapAuditEntry(
  e: AuditLogEntry,
  prefixMap: Record<string, string>,
  account: UserAccount,
): Record<string, unknown> {
  const prefixId = e.resource?.id;
  const cidr = prefixId ? prefixMap[prefixId] : undefined;
  const description = e.action?.description || e.resource?.type || e.action?.type || 'Audit event';
  const target = cidr || prefixId;
  const details = target ? `${description} — ${target}` : description;

  return {
    source: 'audit' as const,
    id: e.id,
    account_id: account.account_id,
    account_label: account.account_label,
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
