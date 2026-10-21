import type { Env } from './types';

/**
 * Cron heartbeat: ensure every configured (user, account) has an active PollerDO
 * with a pending alarm. `/ensure` is idempotent, so this both bootstraps new
 * accounts and restarts any loop whose alarm was cleared (e.g. after the account
 * was briefly removed). Addressed by `idFromName("<user_email>:<account_id>")`
 * to match PollerDO.
 */
export async function ensureAccountPollers(env: Env): Promise<void> {
  const ns = env.POLLER;
  if (!ns) return;

  const accounts = await env.DB.prepare(
    'SELECT user_email, account_id FROM user_accounts',
  ).all<{ user_email: string; account_id: string }>();

  await Promise.all(
    (accounts.results || []).map(async (a) => {
      if (!a.account_id) return;
      const stub = ns.get(ns.idFromName(`${a.user_email}:${a.account_id}`));
      await stub.fetch('https://poller/ensure', {
        method: 'POST',
        body: JSON.stringify({ user_email: a.user_email, account_id: a.account_id }),
      });
    }),
  );
}
