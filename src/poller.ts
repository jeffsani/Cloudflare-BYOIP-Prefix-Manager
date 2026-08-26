import type { Env } from './types';
import { listPrefixes, listBgpPrefixes, lookupBgpRoutes } from './api';
import { enqueueNotification } from './queue';
import { logActivity } from './helpers';
import { safeParse } from './notifications-db';

const CACHE_TTL_MS = 15 * 60 * 1000; // Refresh the monitored-CIDR list every 15 min.
const SUPPRESS_WINDOW_MIN = 10;       // Skip external alerts within N min of a tool-driven toggle.
const BUDGET_FRACTION = 0.5;          // Use at most half the account's API budget for polling.

interface AccountRow {
  user_email: string;
  account_id: string;
  api_token: string;
  api_rate_limit_5min: number;
}

interface RadarState {
  announced: boolean;
  origin_asn: number | null;
  visible_routes: number;
}

/**
 * Cron entry point: for each account, poll a rate-limited slice of its monitored
 * CIDRs against Cloudflare Radar and emit notifications for advertisement changes
 * that happened outside this tool.
 */
export async function pollAdvertisementChanges(env: Env): Promise<{ checked: number; errors: string[] }> {
  const errors: string[] = [];
  let checked = 0;

  const accounts = await env.DB.prepare(
    'SELECT user_email, account_id, api_token, api_rate_limit_5min FROM user_accounts'
  ).all<AccountRow>();

  const nowMinute = Math.floor(Date.now() / 60000);

  for (const acct of accounts.results || []) {
    if (!acct.api_token || !acct.account_id) continue;
    try {
      const cidrs = await getMonitoredCidrs(env, acct);
      if (!cidrs.length) continue;

      // Size this tick's slice from the per-account API budget.
      const budget = Math.max(1, Math.floor((acct.api_rate_limit_5min || 1200) * BUDGET_FRACTION));
      const perTickCap = Math.max(1, Math.floor(budget / 5));
      const numSlices = Math.ceil(cidrs.length / perTickCap);
      const sliceIndex = nowMinute % numSlices;
      const slice = cidrs.slice(sliceIndex * perTickCap, sliceIndex * perTickCap + perTickCap);

      for (const cidr of slice) {
        try {
          const observed = await observeRadarState(cidr, acct.api_token);
          checked++;
          await reconcile(env, acct, cidr, observed);
        } catch (err) {
          errors.push(`${acct.account_id} ${cidr}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      errors.push(`${acct.account_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { checked, errors };
}

/** Return the account's monitored CIDR set, refreshing the cache if stale. */
async function getMonitoredCidrs(env: Env, acct: AccountRow): Promise<string[]> {
  const cached = await env.DB.prepare(
    'SELECT cidrs, refreshed_at FROM prefix_monitor_cache WHERE user_email = ? AND account_id = ?'
  ).bind(acct.user_email, acct.account_id).first<{ cidrs: string; refreshed_at: string }>();

  if (cached) {
    const age = Date.now() - new Date(cached.refreshed_at + 'Z').getTime();
    if (age < CACHE_TTL_MS) return safeParse<string[]>(cached.cidrs, []);
  }

  const advertisedByCidr = await enumerateCidrs(acct);
  const cidrs = [...advertisedByCidr.keys()];
  await env.DB.prepare(
    `INSERT INTO prefix_monitor_cache (user_email, account_id, cidrs, refreshed_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_email, account_id)
     DO UPDATE SET cidrs = excluded.cidrs, refreshed_at = excluded.refreshed_at`
  ).bind(acct.user_email, acct.account_id, JSON.stringify(cidrs)).run();

  // Refresh the control-plane advertised flag on any existing state rows. This
  // is an UPDATE-only pass, so it never creates rows ahead of a Radar
  // observation (which would confuse reconcile's first-observation logic).
  // `advertised` is null when the control-plane state is unknown (e.g. a parent
  // prefix with no BGP sub-prefixes to derive status from).
  for (const [cidr, advertised] of advertisedByCidr) {
    await env.DB.prepare(
      `UPDATE prefix_radar_state SET cf_advertised = ?, updated_at = datetime('now')
       WHERE account_id = ? AND cidr = ?`
    ).bind(advertised === null ? null : (advertised ? 1 : 0), acct.account_id, cidr).run();
  }
  return cidrs;
}

/**
 * Enumerate announced CIDRs (BGP sub-prefixes where present, else parent
 * prefixes) mapped to their control-plane advertised flag. The flag is derived
 * from BGP sub-prefixes (the parent-level `advertised` field is deprecated); a
 * parent CIDR with no sub-prefixes maps to `null` (status unknown).
 */
async function enumerateCidrs(acct: AccountRow): Promise<Map<string, boolean | null>> {
  const out = new Map<string, boolean | null>();
  const prefixResp = await listPrefixes(acct.account_id, acct.api_token);
  if (!prefixResp.success) return out;
  for (const p of prefixResp.result || []) {
    let hasChild = false;
    try {
      const bgpResp = await listBgpPrefixes(acct.account_id, p.id, acct.api_token);
      if (bgpResp.success) {
        for (const b of bgpResp.result || []) {
          if (b.cidr) { out.set(b.cidr, !!b.on_demand?.advertised); hasChild = true; }
        }
      }
    } catch {
      // Ignore per-prefix listing failures; fall back to the parent CIDR.
    }
    if (!hasChild && p.cidr) out.set(p.cidr, null);
  }
  return out;
}

/** Query Radar for the current global BGP state of a CIDR. */
async function observeRadarState(cidr: string, token: string): Promise<RadarState> {
  const result = await lookupBgpRoutes(cidr, token);
  const origins = result.meta?.prefix_origins || [];
  const routes = result.routes || [];
  const announced = routes.length > 0 || origins.length > 0;
  const origin_asn = origins.length ? origins[0].origin : (routes.length ? routes[0].as_path?.[routes[0].as_path.length - 1] ?? null : null);
  return { announced, origin_asn: origin_asn ?? null, visible_routes: routes.length };
}

/** Compare observed state to the stored snapshot and emit events on transitions. */
async function reconcile(env: Env, acct: AccountRow, cidr: string, observed: RadarState): Promise<void> {
  const prev = await env.DB.prepare(
    'SELECT announced, origin_asn FROM prefix_radar_state WHERE account_id = ? AND cidr = ?'
  ).bind(acct.account_id, cidr).first<{ announced: number; origin_asn: number | null }>();

  const upsert = () => env.DB.prepare(
    `INSERT INTO prefix_radar_state (account_id, cidr, announced, origin_asn, visible_routes, source, last_change_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'radar', datetime('now'), datetime('now'))
     ON CONFLICT(account_id, cidr)
     DO UPDATE SET announced = excluded.announced, origin_asn = excluded.origin_asn,
                   visible_routes = excluded.visible_routes, source = 'radar',
                   last_change_at = datetime('now'), updated_at = datetime('now')`
  ).bind(acct.account_id, cidr, observed.announced ? 1 : 0, observed.origin_asn, observed.visible_routes).run();

  // First observation: seed silently.
  if (!prev) { await upsert(); return; }

  const wasAnnounced = !!prev.announced;
  if (wasAnnounced === observed.announced) {
    // No advertise/withdraw change; check origin change while announced.
    if (observed.announced && observed.origin_asn != null && prev.origin_asn != null
        && observed.origin_asn !== prev.origin_asn) {
      await maybeEmit(env, acct, cidr, 'external_origin_change',
        `Origin ASN for ${cidr} changed from AS${prev.origin_asn} to AS${observed.origin_asn}`);
    }
    await bumpUpdated(env, acct.account_id, cidr, observed);
    return;
  }

  const eventType = observed.announced ? 'external_advertise' : 'external_withdraw';
  const verb = observed.announced ? 'advertised' : 'withdrawn';
  await maybeEmit(env, acct, cidr, eventType, `Prefix ${cidr} is now ${verb} in the global BGP table (via Radar)`);
  await upsert();
}

/** Emit unless a matching tool-driven toggle happened recently (suppression). */
async function maybeEmit(env: Env, acct: AccountRow, cidr: string, eventType: string, details: string): Promise<void> {
  if (eventType !== 'external_origin_change') {
    const recent = await env.DB.prepare(
      `SELECT 1 FROM activity_log
       WHERE user_email = ?
         AND created_at >= datetime('now', ?)
         AND (
           (action IN ('advertise','withdraw') AND details LIKE ?)
           OR action IN ('bulk_advertise','bulk_withdraw')
         )
       LIMIT 1`
    ).bind(acct.user_email, `-${SUPPRESS_WINDOW_MIN} minutes`, `%${cidr}%`).first();
    if (recent) return; // Tool-driven change already surfaced inline.
  }

  await logActivity(env.DB, acct.user_email, eventType, details);
  await enqueueNotification(env, {
    user_email: acct.user_email,
    account_id: acct.account_id,
    event_type: eventType,
    title: cidr,
    details,
  });
}

async function bumpUpdated(env: Env, accountId: string, cidr: string, observed: RadarState): Promise<void> {
  await env.DB.prepare(
    `UPDATE prefix_radar_state SET origin_asn = ?, visible_routes = ?, updated_at = datetime('now')
     WHERE account_id = ? AND cidr = ?`
  ).bind(observed.origin_asn, observed.visible_routes, accountId, cidr).run();
}
