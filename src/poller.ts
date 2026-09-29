import type { Env } from './types';
import { listPrefixes, listBgpPrefixes, lookupBgpRoutes } from './api';
import { enqueueNotification } from './queue';
import { logActivity } from './helpers';
import { safeParse } from './notifications-db';

const CACHE_TTL_MS = 15 * 60 * 1000; // Refresh the monitored-CIDR list every 15 min.
const SUPPRESS_WINDOW_MIN = 10;       // Skip external alerts within N min of a tool-driven toggle.
const BUDGET_FRACTION = 0.5;          // Use at most half the account's API budget for polling.
const CONFIRM_POLLS = 3;              // Consecutive polls a changed state must hold before we commit + emit it.
const MIN_VISIBILITY = 0.25;          // Min peer-visibility ratio to treat an exact-prefix origin as announced.

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

/** Normalize a CIDR for equality comparison (case-insensitive, trimmed). */
function normalizeCidr(cidr: string): string {
  return cidr.trim().toLowerCase();
}

/**
 * Query Radar for the current global BGP state of a CIDR.
 *
 * The realtime endpoint can surface routes/origins for overlapping prefixes
 * (covering aggregates or more-specifics), so we filter both `routes` and
 * `prefix_origins` down to the exact queried CIDR before deciding anything —
 * otherwise an aggregate and its sub-prefixes contaminate each other's signal.
 * `announced` is then driven by peer visibility (a ratio from `prefix_origins`)
 * with an exact-match route count as a fallback, rather than the mere presence
 * of any route, which is too noisy on a single realtime sample.
 */
async function observeRadarState(cidr: string, token: string): Promise<RadarState> {
  const result = await lookupBgpRoutes(cidr, token);
  const want = normalizeCidr(cidr);

  const origins = (result.meta?.prefix_origins || []).filter((o) => normalizeCidr(o.prefix) === want);
  const routes = (result.routes || []).filter((r) => normalizeCidr(r.prefix) === want);

  // Prefer visibility from an exact-prefix origin; fall back to seeing any
  // exact-prefix route when origin visibility data is unavailable.
  const maxVisibility = origins.reduce((m, o) => Math.max(m, o.visibility ?? 0), 0);
  const announced = maxVisibility >= MIN_VISIBILITY || routes.length > 0;

  const origin_asn = origins.length
    ? origins[0].origin
    : (routes.length ? routes[0].as_path?.[routes[0].as_path.length - 1] ?? null : null);
  return { announced, origin_asn: origin_asn ?? null, visible_routes: routes.length };
}

/** Outcome of applying an observation to the stored snapshot (pure, testable). */
export interface TransitionDecision {
  /** Value to store in `announced` (the committed state). */
  committedAnnounced: boolean;
  /** Value to store in `pending_announced` (null clears the candidate). */
  pendingAnnounced: boolean | null;
  /** Value to store in `pending_count`. */
  pendingCount: number;
  /** Whether the committed `announced` value just changed (bump last_change_at). */
  changed: boolean;
  /** Whether to emit an external advertise/withdraw event this poll. */
  emit: boolean;
}

/**
 * Debounce/hysteresis core: a change from the committed `announced` value must be
 * observed for CONFIRM_POLLS consecutive polls before it is committed and an event
 * emitted. A single-poll blip that reverts on the next poll never reaches the
 * threshold, so transient Radar realtime jitter no longer flaps the state.
 */
export function decideTransition(
  prevAnnounced: boolean,
  prevPendingAnnounced: boolean | null,
  prevPendingCount: number,
  observedAnnounced: boolean,
): TransitionDecision {
  // Observed agrees with the committed state: stable, drop any in-flight candidate.
  if (observedAnnounced === prevAnnounced) {
    return { committedAnnounced: prevAnnounced, pendingAnnounced: null, pendingCount: 0, changed: false, emit: false };
  }

  // Observed differs from committed. Advance the candidate if it continues the
  // same pending direction, otherwise start a fresh candidate.
  const continuing = prevPendingAnnounced !== null && prevPendingAnnounced === observedAnnounced;
  const nextCount = continuing ? prevPendingCount + 1 : 1;

  if (nextCount >= CONFIRM_POLLS) {
    // Confirmed across enough consecutive polls: commit the change and emit.
    return { committedAnnounced: observedAnnounced, pendingAnnounced: null, pendingCount: 0, changed: true, emit: true };
  }

  // Not yet confirmed: keep the committed state, record the candidate, stay quiet.
  return { committedAnnounced: prevAnnounced, pendingAnnounced: observedAnnounced, pendingCount: nextCount, changed: false, emit: false };
}

/** Compare observed state to the stored snapshot and emit events on confirmed transitions. */
async function reconcile(env: Env, acct: AccountRow, cidr: string, observed: RadarState): Promise<void> {
  const prev = await env.DB.prepare(
    'SELECT announced, origin_asn, pending_announced, pending_count FROM prefix_radar_state WHERE account_id = ? AND cidr = ?'
  ).bind(acct.account_id, cidr).first<{
    announced: number; origin_asn: number | null; pending_announced: number | null; pending_count: number;
  }>();

  // First observation: seed silently.
  if (!prev) { await seedState(env, acct.account_id, cidr, observed); return; }

  const prevAnnounced = !!prev.announced;
  const prevPending = prev.pending_announced == null ? null : !!prev.pending_announced;
  const decision = decideTransition(prevAnnounced, prevPending, prev.pending_count || 0, observed.announced);

  // Origin-change alerts only make sense while the committed state is stably announced.
  if (observed.announced === prevAnnounced && observed.announced
      && observed.origin_asn != null && prev.origin_asn != null
      && observed.origin_asn !== prev.origin_asn) {
    await maybeEmit(env, acct, cidr, 'external_origin_change',
      `Origin ASN for ${cidr} changed from AS${prev.origin_asn} to AS${observed.origin_asn}`);
  }

  await writeState(env, acct.account_id, cidr, observed, decision);

  if (decision.emit) {
    const verb = observed.announced ? 'advertised' : 'withdrawn';
    const eventType = observed.announced ? 'external_advertise' : 'external_withdraw';
    await maybeEmit(env, acct, cidr, eventType, `Prefix ${cidr} is now ${verb} in the global BGP table (via Radar)`);
  }
}

/** Emit unless a matching tool-driven toggle happened recently (suppression). */
async function maybeEmit(env: Env, acct: AccountRow, cidr: string, eventType: string, details: string): Promise<void> {
  if (eventType !== 'external_origin_change') {
    const recent = await env.DB.prepare(
      `SELECT 1 FROM activity_log
       WHERE user_email = ?
         AND account_id = ?
         AND created_at >= datetime('now', ?)
         AND (
           (action IN ('advertise','withdraw') AND details LIKE ?)
           OR action IN ('bulk_advertise','bulk_withdraw')
         )
       LIMIT 1`
    ).bind(acct.user_email, acct.account_id, `-${SUPPRESS_WINDOW_MIN} minutes`, `%${cidr}%`).first();
    if (recent) return; // Tool-driven change already surfaced inline.
  }

  await logActivity(env.DB, acct.user_email, acct.account_id, eventType, details);
  await enqueueNotification(env, {
    user_email: acct.user_email,
    account_id: acct.account_id,
    event_type: eventType,
    title: cidr,
    details,
  });
}

/** Seed a brand-new state row from the first observation (no event emitted). */
async function seedState(env: Env, accountId: string, cidr: string, observed: RadarState): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO prefix_radar_state
       (account_id, cidr, announced, origin_asn, visible_routes, source, last_change_at,
        pending_announced, pending_count, pending_since, updated_at)
     VALUES (?, ?, ?, ?, ?, 'radar', datetime('now'), NULL, 0, NULL, datetime('now'))
     ON CONFLICT(account_id, cidr)
     DO UPDATE SET announced = excluded.announced, origin_asn = excluded.origin_asn,
                   visible_routes = excluded.visible_routes, source = 'radar',
                   last_change_at = datetime('now'), pending_announced = NULL,
                   pending_count = 0, pending_since = NULL, updated_at = datetime('now')`
  ).bind(accountId, cidr, observed.announced ? 1 : 0, observed.origin_asn, observed.visible_routes).run();
}

/** Persist the committed/pending state plus refreshed observability fields. */
async function writeState(
  env: Env, accountId: string, cidr: string, observed: RadarState, decision: TransitionDecision,
): Promise<void> {
  // These fragments reference existing columns (not user input) to conditionally
  // keep or bump timestamps without extra reads. `source` is only reasserted to
  // 'radar' when we commit a Radar-driven change, so webhook/control-plane
  // provenance survives ordinary no-change polls.
  const lastChangeExpr = decision.changed ? "datetime('now')" : 'last_change_at';
  const sourceExpr = decision.changed ? "'radar'" : 'source';
  const pendingSinceExpr = decision.pendingAnnounced === null
    ? 'NULL'
    : (decision.pendingCount === 1 ? "datetime('now')" : 'pending_since');

  await env.DB.prepare(
    `UPDATE prefix_radar_state
        SET announced = ?, origin_asn = ?, visible_routes = ?, source = ${sourceExpr},
            last_change_at = ${lastChangeExpr},
            pending_announced = ?, pending_count = ?, pending_since = ${pendingSinceExpr},
            updated_at = datetime('now')
      WHERE account_id = ? AND cidr = ?`
  ).bind(
    decision.committedAnnounced ? 1 : 0,
    observed.origin_asn,
    observed.visible_routes,
    decision.pendingAnnounced === null ? null : (decision.pendingAnnounced ? 1 : 0),
    decision.pendingCount,
    accountId, cidr,
  ).run();
}
