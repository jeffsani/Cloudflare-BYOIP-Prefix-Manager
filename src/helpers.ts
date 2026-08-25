import type { UserAccount } from './types';

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
export async function logActivity(db: D1Database, email: string, action: string, details: string) {
  try {
    await db
      .prepare('INSERT INTO activity_log (user_email, action, details) VALUES (?, ?, ?)')
      .bind(email, action, details)
      .run();
    // Prune entries older than 180 days
    await db
      .prepare("DELETE FROM activity_log WHERE created_at < datetime('now', '-180 days')")
      .run();
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
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
): Promise<{ apiKey: string; maintainer: string } | null> {
  if (bodyKey) return { apiKey: bodyKey, maintainer: bodyMnt || '' };
  const stored = await db.prepare(
    'SELECT api_key, maintainer FROM rir_credentials WHERE user_email = ? AND account_id = ? AND rir = ?',
  ).bind(email, accountId, rir).first<{ api_key: string; maintainer: string }>();
  if (!stored?.api_key) return null;
  return { apiKey: stored.api_key, maintainer: stored.maintainer || '' };
}
