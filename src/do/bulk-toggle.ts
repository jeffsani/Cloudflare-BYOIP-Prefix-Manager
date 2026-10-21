import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';
import { performBulkToggle, type BulkToggleArgs } from '../bulk';

/**
 * Per-account bulk advertise/withdraw orchestrator. Addressed by
 * `idFromName(accountId)` so concurrent bulk jobs for the same account are
 * serialized (a Durable Object processes one request at a time) instead of
 * racing each other and the account's API budget. The handler stays synchronous
 * from the caller's perspective: it returns the same per-prefix result array the
 * endpoint has always returned.
 */
export class BulkToggleDO extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/run') return new Response('not found', { status: 404 });

    const args = (await request.json()) as BulkToggleArgs;
    const results = await performBulkToggle(this.env, args);
    return Response.json({ results });
  }
}
