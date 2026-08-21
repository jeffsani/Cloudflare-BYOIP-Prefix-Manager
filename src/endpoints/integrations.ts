import type { Env, ApiKey, WebhookEndpoint } from '../types';
import { safeParse } from '../notifications-db';
import { sha256Hex, generateToken } from '../machine-auth';

// Prefix on generated tokens so they're recognizable in logs/UIs.
const API_KEY_PREFIX = 'pmk_';

function mapApiKey(r: Record<string, unknown>): ApiKey {
  return {
    id: r.id as number,
    account_id: r.account_id as string,
    owner_email: r.owner_email as string,
    name: r.name as string,
    key_prefix: r.key_prefix as string,
    scopes: safeParse<string[]>(r.scopes, ['read']),
    enabled: !!r.enabled,
    last_used_at: (r.last_used_at as string) ?? null,
    created_at: r.created_at as string,
  };
}

function mapWebhook(r: Record<string, unknown>): WebhookEndpoint {
  return {
    id: r.id as number,
    account_id: r.account_id as string,
    owner_email: r.owner_email as string,
    name: r.name as string,
    enabled: !!r.enabled,
    last_seen_at: (r.last_seen_at as string) ?? null,
    created_at: r.created_at as string,
  };
}

/** Confirm the account belongs to the authenticated user before scoping a key. */
async function ownsAccount(env: Env, email: string, accountId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    'SELECT id FROM user_accounts WHERE user_email = ? AND account_id = ?',
  ).bind(email, accountId).first<{ id: number }>();
  return !!row;
}

// ─── API keys ───

export async function listApiKeys(env: Env, email: string, accountId: string): Promise<ApiKey[]> {
  const rows = await env.DB.prepare(
    'SELECT * FROM api_keys WHERE owner_email = ? AND account_id = ? ORDER BY created_at DESC',
  ).bind(email, accountId).all<Record<string, unknown>>();
  return (rows.results || []).map(mapApiKey);
}

export async function createApiKey(
  env: Env, email: string, body: Record<string, any>,
): Promise<{ ok: boolean; id?: number; key?: string; error?: string }> {
  const accountId = (body.account_id || '').trim();
  if (!accountId) return { ok: false, error: 'account_id is required' };
  if (!(await ownsAccount(env, email, accountId))) return { ok: false, error: 'Unknown account' };

  const name = (body.name || '').trim() || 'API key';
  const token = API_KEY_PREFIX + generateToken(32);
  const keyHash = await sha256Hex(token);
  const keyPrefix = token.slice(0, 12);

  const res = await env.DB.prepare(
    `INSERT INTO api_keys (account_id, owner_email, name, key_hash, key_prefix, scopes, enabled)
     VALUES (?, ?, ?, ?, ?, '["read"]', 1)`,
  ).bind(accountId, email, name, keyHash, keyPrefix).run();

  // Plaintext key is returned exactly once and never stored.
  return { ok: true, id: res.meta.last_row_id as number, key: token };
}

export async function deleteApiKey(env: Env, email: string, id: number): Promise<{ ok: boolean }> {
  await env.DB.prepare('DELETE FROM api_keys WHERE id = ? AND owner_email = ?').bind(id, email).run();
  return { ok: true };
}

// ─── Inbound webhook endpoints ───

export async function listWebhookEndpoints(env: Env, email: string, accountId: string): Promise<WebhookEndpoint[]> {
  const rows = await env.DB.prepare(
    'SELECT * FROM webhook_endpoints WHERE owner_email = ? AND account_id = ? ORDER BY created_at DESC',
  ).bind(email, accountId).all<Record<string, unknown>>();
  return (rows.results || []).map(mapWebhook);
}

export async function createWebhookEndpoint(
  env: Env, email: string, body: Record<string, any>,
): Promise<{ ok: boolean; id?: number; secret?: string; error?: string }> {
  const accountId = (body.account_id || '').trim();
  if (!accountId) return { ok: false, error: 'account_id is required' };
  if (!(await ownsAccount(env, email, accountId))) return { ok: false, error: 'Unknown account' };

  const name = (body.name || '').trim() || 'Cloudflare webhook';
  const secret = generateToken(32);
  const secretHash = await sha256Hex(secret);

  const res = await env.DB.prepare(
    `INSERT INTO webhook_endpoints (account_id, owner_email, name, secret_hash, enabled)
     VALUES (?, ?, ?, ?, 1)`,
  ).bind(accountId, email, name, secretHash).run();

  // Secret is returned exactly once (paste into Cloudflare's webhook config).
  return { ok: true, id: res.meta.last_row_id as number, secret };
}

export async function deleteWebhookEndpoint(env: Env, email: string, id: number): Promise<{ ok: boolean }> {
  await env.DB.prepare('DELETE FROM webhook_endpoints WHERE id = ? AND owner_email = ?').bind(id, email).run();
  return { ok: true };
}
