import type { Context, Next } from 'hono';
import type { Env } from './types';
import { safeParse } from './notifications-db';

/** SHA-256 hex digest of a string (Workers Web Crypto). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a random opaque token (URL-safe base64, no padding). */
export function generateToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

type MachineEnv = {
  Bindings: Env;
  Variables: { account_id: string; owner_email: string; scopes: string[] };
};

/**
 * Authenticate machine clients to the read-only Query API via a per-account API
 * key sent as `Authorization: Bearer <key>`. Sets account_id / owner_email /
 * scopes on the context. Bypasses CF Access (see auth.ts).
 */
export async function apiKeyAuthMiddleware(c: Context<MachineEnv>, next: Next) {
  const header = c.req.header('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) return c.json({ error: 'Missing API key' }, 401);

  const keyHash = await sha256Hex(token);
  const row = await c.env.DB.prepare(
    'SELECT * FROM api_keys WHERE key_hash = ? AND enabled = 1',
  ).bind(keyHash).first<Record<string, unknown>>();
  if (!row) return c.json({ error: 'Invalid API key' }, 401);

  c.set('account_id', row.account_id as string);
  c.set('owner_email', row.owner_email as string);
  c.set('scopes', safeParse<string[]>(row.scopes, ['read']));

  // Best-effort last-used timestamp; never block the request on it.
  c.executionCtx.waitUntil(
    c.env.DB.prepare("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?")
      .bind(row.id as number).run().then(() => undefined).catch(() => undefined),
  );

  return next();
}

/**
 * Authenticate inbound Cloudflare webhooks via the `cf-webhook-auth` header,
 * matched (by hash) to a registered per-account webhook endpoint. Resolves the
 * account_id / owner_email onto the context.
 */
export async function webhookAuthMiddleware(c: Context<MachineEnv>, next: Next) {
  const secret = c.req.header('cf-webhook-auth') || '';
  if (!secret) return c.json({ error: 'Missing cf-webhook-auth header' }, 401);

  const secretHash = await sha256Hex(secret);
  const row = await c.env.DB.prepare(
    'SELECT * FROM webhook_endpoints WHERE secret_hash = ? AND enabled = 1',
  ).bind(secretHash).first<Record<string, unknown>>();
  if (!row) return c.json({ error: 'Unrecognized webhook secret' }, 401);

  c.set('account_id', row.account_id as string);
  c.set('owner_email', row.owner_email as string);

  c.executionCtx.waitUntil(
    c.env.DB.prepare("UPDATE webhook_endpoints SET last_seen_at = datetime('now') WHERE id = ?")
      .bind(row.id as number).run().then(() => undefined).catch(() => undefined),
  );

  return next();
}
