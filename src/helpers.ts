import type { Env, UserAccount } from './types';

// Get the API token for an account
export async function getToken(db: D1Database, email: string, accountId: string): Promise<string> {
  const row = await db
    .prepare('SELECT api_token FROM user_accounts WHERE user_email = ? AND account_id = ?')
    .bind(email, accountId)
    .first<{ api_token: string }>();

  if (!row?.api_token) {
    throw new Error('No API token configured for this account');
  }
  return row.api_token;
}

// Helper: log activity
export async function logActivity(
  db: D1Database,
  email: string,
  accountId: string,
  action: string,
  details: string,
) {
  try {
    await db
      .prepare('INSERT INTO activity_log (user_email, account_id, action, details) VALUES (?, ?, ?, ?)')
      .bind(email, accountId, action, details)
      .run();
    // Retention is enforced by the scheduled purge (see purgeExpiredLogs), which
    // honors each account's configurable activity_retention_days.
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}

// Default retention (days) applied when an account has no explicit value, or to
// orphaned user-scoped rows that aren't tied to a specific account.
export const DEFAULT_RETENTION_DAYS = 180;

// Run a DELETE, swallowing "no such table" errors so purges work on databases
// that haven't been migrated to include every optional log table yet.
async function safeDelete(db: D1Database, sql: string, binds: unknown[]): Promise<number> {
  try {
    const res = await db.prepare(sql).bind(...binds).run();
    return res.meta?.changes ?? 0;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (/no such table/i.test(message)) return 0;
    throw e;
  }
}

// Delete local log rows older than the account's retention window across all
// four local log tables. Returns the total number of rows removed.
//
// activity_log / notification_log carry user_email + account_id (user-scoped);
// audit_log_events / webhook_events are account-scoped only, so purging them
// affects every user sharing that Cloudflare account_id — consistent with how
// the Activity panel already surfaces those rows per-account.
export async function purgeAccountLogs(
  db: D1Database,
  userEmail: string,
  accountId: string,
  retentionDays: number,
): Promise<number> {
  const days = retentionDays && retentionDays > 0 ? Math.floor(retentionDays) : DEFAULT_RETENTION_DAYS;
  const modifier = `-${days} days`;
  // audit_log_events.action_time is an RFC3339 string; compare against an ISO
  // cutoff rather than SQLite's ' '-separated datetime() output.
  const cutoffIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let removed = 0;
  removed += await safeDelete(
    db,
    "DELETE FROM activity_log WHERE user_email = ? AND account_id = ? AND created_at < datetime('now', ?)",
    [userEmail, accountId, modifier],
  );
  removed += await safeDelete(
    db,
    "DELETE FROM notification_log WHERE user_email = ? AND account_id = ? AND created_at < datetime('now', ?)",
    [userEmail, accountId, modifier],
  );
  removed += await safeDelete(
    db,
    'DELETE FROM audit_log_events WHERE account_id = ? AND action_time < ?',
    [accountId, cutoffIso],
  );
  removed += await safeDelete(
    db,
    "DELETE FROM webhook_events WHERE account_id = ? AND created_at < datetime('now', ?)",
    [accountId, modifier],
  );
  return removed;
}

// Scheduled sweep: purge expired local logs for every configured account, plus
// orphaned user-scoped activity_log rows that have no account_id.
export async function purgeExpiredLogs(env: Env): Promise<{ purged: number; errors: string[] }> {
  const errors: string[] = [];
  let purged = 0;

  const accounts = await env.DB.prepare(
    'SELECT user_email, account_id, activity_retention_days FROM user_accounts',
  ).all<{ user_email: string; account_id: string; activity_retention_days: number | null }>();

  for (const acct of accounts.results || []) {
    if (!acct.account_id) continue;
    try {
      purged += await purgeAccountLogs(
        env.DB,
        acct.user_email,
        acct.account_id,
        acct.activity_retention_days ?? DEFAULT_RETENTION_DAYS,
      );
    } catch (e) {
      errors.push(`${acct.account_id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Orphaned local rows not tied to an account use the default retention.
  try {
    purged += await safeDelete(
      env.DB,
      "DELETE FROM activity_log WHERE account_id IS NULL AND created_at < datetime('now', ?)",
      [`-${DEFAULT_RETENTION_DAYS} days`],
    );
  } catch (e) {
    errors.push(`orphan activity_log: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { purged, errors };
}

// Helper: resolve account by account_id param or default
export async function resolveAccount(
  db: D1Database,
  email: string,
  accountId?: string,
): Promise<UserAccount | null> {
  if (accountId) {
    return db
      .prepare('SELECT * FROM user_accounts WHERE user_email = ? AND account_id = ?')
      .bind(email, accountId)
      .first<UserAccount>();
  }
  const def = await db
    .prepare('SELECT * FROM user_accounts WHERE user_email = ? AND is_default = 1')
    .bind(email)
    .first<UserAccount>();
  if (def) return def;
  return db
    .prepare('SELECT * FROM user_accounts WHERE user_email = ? ORDER BY id ASC LIMIT 1')
    .bind(email)
    .first<UserAccount>();
}

// Character used to mask secrets for display. A submitted value containing it
// is a masked placeholder echoed back by the UI, never a real secret.
export const MASK_CHAR = '•';

// Mask API token for display
export function maskToken(token: string): string {
  if (!token || token.length < 8) return '••••••••';
  return token.slice(0, 4) + '••••' + token.slice(-4);
}

// True when a submitted secret is a real value, not a masked placeholder.
export function isRealSecret(value: string | undefined | null): value is string {
  return !!value && !value.includes(MASK_CHAR);
}

// Helper to resolve RIR credentials from request body or DB
export async function resolveRirCreds(
  db: D1Database, email: string, accountId: string, rir: string,
  bodyKey?: string, bodyMnt?: string,
): Promise<{ apiKey: string; maintainer: string; tokenRecord: string } | null> {
  if (bodyKey) return { apiKey: bodyKey, maintainer: bodyMnt || '', tokenRecord: '' };
  const stored = await db.prepare(
    'SELECT api_key, maintainer, token_record FROM rir_credentials WHERE user_email = ? AND account_id = ? AND rir = ?',
  ).bind(email, accountId, rir).first<{ api_key: string; maintainer: string; token_record: string }>();
  if (!stored?.api_key) return null;
  return { apiKey: stored.api_key, maintainer: stored.maintainer || '', tokenRecord: stored.token_record || '' };
}
