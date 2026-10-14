import type { Env } from './types';
import { listPrefixes, listBgpPrefixes } from './api';
import { enqueueNotification } from './queue';
import { logActivity } from './helpers';

export const DEFAULT_ADVERTISE_LIMIT = 100;
export const DEFAULT_THRESHOLD_PCT = 80;

export type CapAlertLevel = 'none' | 'threshold' | 'limit';

const LEVEL_RANK: Record<CapAlertLevel, number> = { none: 0, threshold: 1, limit: 2 };

/** Minimal account shape needed to evaluate the advertisement cap. */
export interface CapAccount {
  account_id: string;
  prefix_advertise_limit?: number | null;
  prefix_advertise_threshold_pct?: number | null;
  cap_alert_level?: string | null;
}

/**
 * Count BGP sub-prefixes currently in an advertised state for an account.
 * Mirrors the `stats.bgp.advertised` metric (on_demand.advertised === true).
 */
export async function countAdvertisedBgpPrefixes(accountId: string, token: string): Promise<number> {
  const prefixResp = await listPrefixes(accountId, token);
  if (!prefixResp.success) return 0;
  const prefixes = prefixResp.result || [];

  const bgpResults = await Promise.all(
    prefixes.map(async (p) => {
      try {
        const bgpResp = await listBgpPrefixes(accountId, p.id, token);
        return bgpResp.success ? (bgpResp.result || []) : [];
      } catch {
        return [];
      }
    }),
  );

  return bgpResults.flat().filter((bp) => bp.on_demand?.advertised === true).length;
}

/** Derive the cap alert level from a count against a limit + threshold percentage. */
export function deriveCapLevel(count: number, limit: number, thresholdPct: number): CapAlertLevel {
  if (count >= limit) return 'limit';
  const thresholdCount = Math.ceil((limit * thresholdPct) / 100);
  if (count >= thresholdCount) return 'threshold';
  return 'none';
}

/**
 * Evaluate the account's advertised-prefix count against its configured cap and
 * emit an edge-triggered notification when it crosses up into a new severity.
 * De-dup state is persisted in `user_accounts.cap_alert_level`; a drop in level
 * resets the state silently so a later re-crossing alerts again. Never throws.
 */
export async function checkAdvertisementCap(
  env: Env,
  userEmail: string,
  account: CapAccount,
  token: string,
): Promise<void> {
  try {
    const limit = account.prefix_advertise_limit && account.prefix_advertise_limit > 0
      ? account.prefix_advertise_limit
      : DEFAULT_ADVERTISE_LIMIT;
    const thresholdPct = account.prefix_advertise_threshold_pct && account.prefix_advertise_threshold_pct > 0
      ? account.prefix_advertise_threshold_pct
      : DEFAULT_THRESHOLD_PCT;

    const count = await countAdvertisedBgpPrefixes(account.account_id, token);
    const level = deriveCapLevel(count, limit, thresholdPct);
    const prev = (account.cap_alert_level as CapAlertLevel) || 'none';

    if (LEVEL_RANK[level] > LEVEL_RANK[prev]) {
      if (level === 'limit') {
        const details = `Account ${account.account_id} has reached its advertised-prefix cap: ${count} of ${limit} advertised. Further advertisements will fail.`;
        await logActivity(env.DB, userEmail, account.account_id, 'prefix_cap_reached', details);
        await enqueueNotification(env, {
          user_email: userEmail,
          account_id: account.account_id,
          event_type: 'prefix_cap_reached',
          title: `${count}/${limit} prefixes advertised`,
          details,
        });
      } else {
        const pct = Math.round((count / limit) * 100);
        const details = `Account ${account.account_id} is approaching its advertised-prefix cap: ${count} of ${limit} advertised (${pct}%, threshold ${thresholdPct}%).`;
        await logActivity(env.DB, userEmail, account.account_id, 'prefix_cap_threshold', details);
        await enqueueNotification(env, {
          user_email: userEmail,
          account_id: account.account_id,
          event_type: 'prefix_cap_threshold',
          title: `${count}/${limit} prefixes advertised (${pct}%)`,
          details,
        });
      }
    }

    if (level !== prev) {
      await env.DB.prepare(
        "UPDATE user_accounts SET cap_alert_level = ? WHERE user_email = ? AND account_id = ?",
      ).bind(level, userEmail, account.account_id).run();
    }
  } catch (err) {
    console.error('checkAdvertisementCap failed:', err);
  }
}
