import type { Env } from './types';
import { isFlagOn } from './types';

// Workers KV min expirationTtl is 60s; clamp anything smaller up to it.
const KV_MIN_TTL = 60;

/**
 * Read-through JSON cache backed by Workers KV. Fail-open by design: a disabled
 * flag, an unbound namespace (local dev), or any KV error falls straight through
 * to `fetcher`, so caching can never break a request — it only makes repeat
 * reads cheaper/faster. KV is eventually consistent, so only cache data that is
 * safe to serve slightly stale; D1 remains the source of truth.
 */
export async function cachedJson<T>(
  env: Env,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  // Optional guard so transient failures are not cached (e.g. an unsuccessful
  // Cloudflare API response). Defaults to caching every resolved value; fetchers
  // that throw on error never reach the cache regardless.
  shouldCache?: (value: T) => boolean,
): Promise<T> {
  const kv = env.CACHE;
  if (!kv || !isFlagOn(env.USE_KV_CACHE)) return fetcher();

  try {
    const hit = await kv.get(key, 'json');
    if (hit != null) return hit as T;
  } catch {
    // KV read failure → treat as a miss and fetch live.
  }

  const value = await fetcher();

  if (!shouldCache || shouldCache(value)) {
    try {
      await kv.put(key, JSON.stringify(value), {
        expirationTtl: Math.max(KV_MIN_TTL, Math.floor(ttlSeconds)),
      });
    } catch {
      // KV write failure is non-fatal; the value is still returned.
    }
  }
  return value;
}

// Namespaced key builders keep cache keys collision-free and greppable.
export const cacheKeys = {
  rdap: (prefix: string) => `rdap:${prefix}`,
  rpki: (prefix: string) => `rpki:${prefix}`,
  visibility: (prefix: string) => `vis:${prefix}`,
  lookingGlass: (prefix: string) => `lg:${prefix}`,
  irrExplorer: (prefix: string) => `irrx:${prefix}`,
  irrRecords: (prefix: string) => `irr:${prefix}`,
  zones: (accountId: string) => `zones:${accountId}`,
  services: (accountId: string) => `services:${accountId}`,
  entitlements: (accountId: string) => `ent:${accountId}`,
  byoip: (accountId: string) => `byoip:${accountId}`,
};

// Shared TTLs (seconds), tuned by how fast each source realistically changes.
export const cacheTtl = {
  rdap: 24 * 60 * 60, // registration data changes rarely
  rpki: 60 * 60, // ROAs change infrequently
  visibility: 15 * 60, // propagation shifts slowly
  lookingGlass: 5 * 60, // near-realtime; keep short
  irr: 60 * 60, // IRR objects change infrequently
  zones: 10 * 60, // per-account metadata
  services: 60 * 60,
  entitlements: 10 * 60,
};
