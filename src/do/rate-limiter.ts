import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';

const WINDOW_MINUTES = 5; // Cloudflare API limit is per 5-minute window.

interface Buckets {
  [minute: string]: number;
}

/**
 * Per-account Cloudflare API-budget coordinator. One instance per account
 * (addressed by `idFromName(accountId)`), it keeps a rolling 5-minute count of
 * requests across all isolates so concurrent Workers do not collectively blow
 * past the account's limit.
 *
 * The budget is supplied by the caller on every `/take` (from the editable
 * `user_accounts.api_rate_limit_5min`), so a granted rate-limit increase takes
 * effect immediately without redeploying.
 *
 * SQLite-backed: state is a tiny per-minute bucket map in DO storage.
 */
export class RateLimiterDO extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/take') return new Response('not found', { status: 404 });

    const budget = Math.max(1, parseInt(url.searchParams.get('budget') || '1200', 10) || 1200);
    const n = Math.max(1, parseInt(url.searchParams.get('n') || '1', 10) || 1);

    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const oldest = minute - (WINDOW_MINUTES - 1);

    const stored = (await this.ctx.storage.get<Buckets>('buckets')) || {};
    // Drop buckets outside the window.
    const buckets: Buckets = {};
    let used = 0;
    for (const [k, v] of Object.entries(stored)) {
      if (Number(k) >= oldest) {
        buckets[k] = v;
        used += v;
      }
    }

    if (used + n > budget) {
      // Over budget: tell the caller how long until the oldest bucket expires.
      const minuteKeys = Object.keys(buckets).map(Number);
      const oldestInWindow = minuteKeys.length ? Math.min(...minuteKeys) : minute;
      const retryAfterMs = Math.max(0, (oldestInWindow + WINDOW_MINUTES) * 60000 - now);
      return Response.json({ allowed: false, retryAfterMs, used, budget });
    }

    buckets[String(minute)] = (buckets[String(minute)] || 0) + n;
    await this.ctx.storage.put('buckets', buckets);
    return Response.json({ allowed: true, used: used + n, budget });
  }
}
