import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';
import { pollAccount, ACCOUNT_COLUMNS, type AccountRow } from '../poller';

const POLL_INTERVAL_MS = 60_000; // Match the previous every-minute cron cadence.

interface Target {
  user_email: string;
  account_id: string;
}

/**
 * Per-account Radar advertisement poller. One instance per (user, account),
 * addressed by `idFromName("<user_email>:<account_id>")`. It self-schedules via
 * the Durable Object alarm API instead of relying on the global cron fan-out,
 * which gives each account an isolated, non-overlapping poll loop (alarms are
 * serialized per object).
 *
 * The cron still calls `/ensure` each minute as a heartbeat so new accounts get
 * an alarm and a stalled loop restarts; `/ensure` is idempotent.
 */
export class PollerDO extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/ensure') return new Response('not found', { status: 404 });

    const target = (await request.json()) as Target;
    await this.ctx.storage.put('target', target);

    // Only schedule if no alarm is already pending (idempotent heartbeat).
    const existing = await this.ctx.storage.getAlarm();
    if (existing == null) await this.ctx.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);

    return Response.json({ ok: true });
  }

  async alarm(): Promise<void> {
    const target = await this.ctx.storage.get<Target>('target');
    if (!target) return; // No target configured → stop (cron will re-ensure).

    const acct = await this.env.DB.prepare(
      `SELECT ${ACCOUNT_COLUMNS} FROM user_accounts WHERE user_email = ? AND account_id = ?`,
    )
      .bind(target.user_email, target.account_id)
      .first<AccountRow>();

    if (!acct) {
      // Account was removed — clear target and let the loop stop.
      await this.ctx.storage.delete('target');
      return;
    }

    try {
      const res = await pollAccount(this.env, acct);
      if (res.errors.length) {
        console.error(`PollerDO ${target.account_id}: ${res.errors.slice(0, 5).join('; ')}`);
      }
    } catch (err) {
      console.error(`PollerDO ${target.account_id} failed:`, err);
    } finally {
      // Reschedule the next tick regardless of outcome.
      await this.ctx.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);
    }
  }
}
