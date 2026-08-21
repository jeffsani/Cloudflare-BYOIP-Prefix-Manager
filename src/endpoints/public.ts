import type { Context } from 'hono';
import type { Env, PrefixState } from '../types';

type MachineEnv = {
  Bindings: Env;
  Variables: { account_id: string; owner_email: string; scopes: string[] };
};

const MAX_LIMIT = 1000;

function mapState(r: Record<string, unknown>): PrefixState {
  return {
    cidr: r.cidr as string,
    announced: !!r.announced,
    origin_asn: (r.origin_asn as number) ?? null,
    visible_routes: (r.visible_routes as number) ?? 0,
    cf_advertised: r.cf_advertised == null ? null : !!r.cf_advertised,
    source: (r.source as string) || 'radar',
    last_change_at: (r.last_change_at as string) ?? null,
    last_webhook_at: (r.last_webhook_at as string) ?? null,
    last_webhook_event: (r.last_webhook_event as string) ?? null,
    updated_at: r.updated_at as string,
  };
}

/**
 * GET /api/public/v1/prefixes
 * List the consolidated prefix state for the authenticated account.
 * Query params: advertised=true|false, cidr=<substr>, since=<ISO ts>,
 * limit (<=1000), offset.
 */
export async function listPrefixStates(c: Context<MachineEnv>) {
  const accountId = c.get('account_id');

  const advertised = c.req.query('advertised');
  const cidr = c.req.query('cidr');
  const since = c.req.query('since');
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(c.req.query('limit') || '1000', 10) || 1000));
  const offset = Math.max(0, parseInt(c.req.query('offset') || '0', 10) || 0);

  const where: string[] = ['account_id = ?'];
  const binds: unknown[] = [accountId];

  if (advertised === 'true' || advertised === 'false') {
    where.push('announced = ?');
    binds.push(advertised === 'true' ? 1 : 0);
  }
  if (cidr) {
    where.push('cidr LIKE ?');
    binds.push(`%${cidr}%`);
  }
  if (since) {
    where.push('updated_at >= ?');
    binds.push(since);
  }

  const whereSql = where.join(' AND ');
  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM prefix_radar_state WHERE ${whereSql}`,
  ).bind(...binds).first<{ cnt: number }>();

  const rows = await c.env.DB.prepare(
    `SELECT * FROM prefix_radar_state WHERE ${whereSql} ORDER BY cidr ASC LIMIT ? OFFSET ?`,
  ).bind(...binds, limit, offset).all<Record<string, unknown>>();

  return c.json({
    account_id: accountId,
    server_time: new Date().toISOString(),
    total: countRow?.cnt ?? 0,
    limit,
    offset,
    prefixes: (rows.results || []).map(mapState),
  });
}

/**
 * GET /api/public/v1/prefixes/lookup?cidr=<cidr>
 * Fetch the consolidated state for a single CIDR (query param because CIDRs
 * contain a slash).
 */
export async function lookupPrefixState(c: Context<MachineEnv>) {
  const accountId = c.get('account_id');
  const cidr = c.req.query('cidr');
  if (!cidr) return c.json({ error: 'cidr query param is required' }, 400);

  const row = await c.env.DB.prepare(
    'SELECT * FROM prefix_radar_state WHERE account_id = ? AND cidr = ?',
  ).bind(accountId, cidr).first<Record<string, unknown>>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  return c.json({ prefix: mapState(row), server_time: new Date().toISOString() });
}

/** GET /api/public/v1/health — liveness + server time for anchoring `since`. */
export async function publicHealth(c: Context<MachineEnv>) {
  return c.json({ ok: true, account_id: c.get('account_id'), server_time: new Date().toISOString() });
}
