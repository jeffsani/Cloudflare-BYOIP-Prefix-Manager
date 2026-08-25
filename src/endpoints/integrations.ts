import type { Env, ApiKey, WebhookEndpoint } from '../types';
import { safeParse } from '../notifications-db';
import { sha256Hex, generateToken } from '../machine-auth';
import { getToken } from '../helpers';
import { createAuditLogpushJob, listLogpushJobs } from '../api';

const AUDIT_LOGPUSH_DATASET = 'audit_logs_v2';

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

// ─── Audit Logs v2 streaming (Logpush) ───

/** Current audit-log Logpush job status for an account. */
export async function getAuditLogpushStatus(
  env: Env, email: string, accountId: string,
): Promise<{ ok: boolean; jobs?: unknown[]; error?: string }> {
  if (!accountId) return { ok: false, error: 'account_id is required' };
  if (!(await ownsAccount(env, email, accountId))) return { ok: false, error: 'Unknown account' };
  try {
    const token = await getToken(env.DB, email, accountId);
    const res = await listLogpushJobs(accountId, token);
    if (!res.success) return { ok: false, error: res.errors?.[0]?.message || 'Logpush API error' };
    const jobs = (res.result || []).filter((j) => j.dataset === AUDIT_LOGPUSH_DATASET);
    return { ok: true, jobs };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to query Logpush jobs' };
  }
}

/**
 * Enable audit-log streaming: mint a dedicated webhook secret, then attempt to
 * create the `audit_logs_v2` Logpush job pointing at /webhooks/logpush. On
 * failure (e.g. non-Enterprise plan or missing `Logs Write` permission) return
 * the ready-to-paste destination URL + secret for manual dashboard setup.
 */
export async function enableAuditLogpush(
  env: Env, email: string, body: Record<string, any>, origin: string,
): Promise<{
  ok: boolean; auto?: boolean; job_id?: number; destination?: string;
  secret?: string; error?: string;
}> {
  const accountId = (body.account_id || '').trim();
  if (!accountId) return { ok: false, error: 'account_id is required' };
  if (!(await ownsAccount(env, email, accountId))) return { ok: false, error: 'Unknown account' };

  const webhookUrl = `${origin}/webhooks/logpush`;

  // Mint (and persist the hash of) a dedicated secret for this destination.
  const secret = generateToken(32);
  const secretHash = await sha256Hex(secret);
  await env.DB.prepare(
    `INSERT INTO webhook_endpoints (account_id, owner_email, name, secret_hash, enabled)
     VALUES (?, ?, ?, ?, 1)`,
  ).bind(accountId, email, 'Audit Logs (Logpush)', secretHash).run();

  const destination = `${webhookUrl}?header_cf-webhook-auth=${encodeURIComponent(secret)}`;

  try {
    const token = await getToken(env.DB, email, accountId);
    const res = await createAuditLogpushJob(accountId, token, webhookUrl, secret);
    if (res.success) {
      return { ok: true, auto: true, job_id: res.result?.id, destination, secret };
    }
    // Auto-create failed — hand back manual-setup details plus the CF error.
    const rawError = res.errors?.[0]?.message || 'Logpush job creation failed';
    return { ok: true, auto: false, destination, secret, error: explainLogpushError(rawError) };
  } catch (e) {
    const rawError = e instanceof Error ? e.message : 'Logpush job creation failed';
    return { ok: true, auto: false, destination, secret, error: explainLogpushError(rawError) };
  }
}

/**
 * Turn opaque Cloudflare Logpush errors into actionable guidance. The most
 * common failure is a `status:302` during destination validation: Cloudflare
 * Access intercepts the validation POST at the edge (before the Worker runs)
 * and redirects it to the IdP login page. This is not an API-permission issue —
 * it requires a Zero Trust Access *Bypass* policy for the `/webhooks/*` path.
 */
function explainLogpushError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('validating destination') || lower.includes('status:302') || lower.includes('status: 302')) {
    return (
      `${raw} — This is a Cloudflare Access redirect (302), not an API-permission problem. ` +
      `The destination-validation request is being blocked at the edge before it reaches this Worker. ` +
      `In Zero Trust → Access → Applications, add a self-hosted app for this host's ` +
      `"/webhooks/*" path with a Bypass (Everyone) policy, then retry. ` +
      `(Those routes stay protected by the cf-webhook-auth secret.)`
    );
  }
  return raw;
}
