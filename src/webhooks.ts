import type { Context } from 'hono';
import type { Env } from './types';
import { enqueueNotification } from './queue';

type MachineEnv = {
  Bindings: Env;
  Variables: { account_id: string; owner_email: string; scopes: string[] };
};

// IPv4 and (loose) IPv6 CIDR matchers used to pull prefixes out of free-form
// webhook text/data. Deliberately permissive — raw payloads are also stored.
const IPV4_CIDR = /\b(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}\b/g;
const IPV6_CIDR = /\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\/\d{1,3}\b/g;

export interface ParsedWebhook {
  cidrs: string[];
  action: 'advertise' | 'withdraw' | 'unknown';
  alert_type: string;
  account_id: string;
}

/**
 * Tolerant parser for Cloudflare's generic webhook payload. Extracts affected
 * CIDRs and an advertise/withdraw intent from alert_type + text + data. The
 * `data` schema is alert-type-specific and not fully documented, so we scan the
 * stringified payload heuristically.
 */
export function parseCfWebhook(payload: Record<string, any>): ParsedWebhook {
  const alertType = String(payload.alert_type || payload.name || '');
  const haystack = [
    String(payload.text || ''),
    JSON.stringify(payload.data ?? {}),
    alertType,
  ].join(' ');

  const cidrs = [...new Set([
    ...(haystack.match(IPV4_CIDR) || []),
    ...(haystack.match(IPV6_CIDR) || []),
  ])];

  const lower = haystack.toLowerCase();
  let action: ParsedWebhook['action'] = 'unknown';
  if (/withdraw/.test(lower)) action = 'withdraw';
  else if (/advertis/.test(lower)) action = 'advertise';

  return {
    cidrs,
    action,
    alert_type: alertType,
    account_id: String(payload.account_id || ''),
  };
}

/**
 * POST /webhooks/cloudflare — receive an inbound Cloudflare notification.
 * Auth (cf-webhook-auth) is enforced by webhookAuthMiddleware, which sets
 * account_id / owner_email on the context. Always returns 200 quickly so
 * Cloudflare does not retry; heavy work is best-effort.
 */
export async function handleCloudflareWebhook(c: Context<MachineEnv>) {
  const accountId = c.get('account_id');
  const ownerEmail = c.get('owner_email');

  let payload: Record<string, any> = {};
  try {
    payload = await c.req.json();
  } catch {
    // Cloudflare's "test" ping and some clients may send non-JSON — accept it.
    return c.json({ ok: true, note: 'no JSON body' });
  }

  // Cloudflare's test webhook sends only { text: "..." } with no alert data.
  const parsed = parseCfWebhook(payload);

  // Persist the raw event for auditing/replay (best-effort).
  try {
    await c.env.DB.prepare(
      'INSERT INTO webhook_events (account_id, alert_type, cidrs, action, raw) VALUES (?, ?, ?, ?, ?)',
    ).bind(
      accountId, parsed.alert_type, JSON.stringify(parsed.cidrs), parsed.action,
      JSON.stringify(payload).slice(0, 100000),
    ).run();
  } catch (err) {
    console.error('webhook_events insert failed:', err);
  }

  if (!parsed.cidrs.length) {
    // Nothing actionable (e.g. test ping) — acknowledge without state changes.
    return c.json({ ok: true, cidrs: 0, action: parsed.action });
  }

  for (const cidr of parsed.cidrs) {
    try {
      await applyWebhookState(c.env, accountId, cidr, parsed);
      await notifyWebhook(c.env, ownerEmail, accountId, cidr, parsed);
    } catch (err) {
      console.error(`webhook processing failed for ${cidr}:`, err);
    }
  }

  return c.json({ ok: true, cidrs: parsed.cidrs.length, action: parsed.action });
}

/**
 * Record webhook-sourced provenance on the consolidated state row. Radar remains
 * authoritative for `announced`: existing rows keep their radar-observed value
 * and only get provenance updated; new rows are seeded from the webhook action
 * so the Query API has data until the next Radar poll reconciles.
 */
async function applyWebhookState(
  env: Env, accountId: string, cidr: string, parsed: ParsedWebhook,
): Promise<void> {
  const eventLabel = `${parsed.alert_type || 'webhook'}:${parsed.action}`;
  const existing = await env.DB.prepare(
    'SELECT id FROM prefix_radar_state WHERE account_id = ? AND cidr = ?',
  ).bind(accountId, cidr).first<{ id: number }>();

  if (existing) {
    await env.DB.prepare(
      `UPDATE prefix_radar_state
         SET source = 'webhook', last_webhook_at = datetime('now'),
             last_webhook_event = ?, updated_at = datetime('now')
       WHERE account_id = ? AND cidr = ?`,
    ).bind(eventLabel, accountId, cidr).run();
    return;
  }

  const seededAnnounced = parsed.action === 'advertise' ? 1 : 0;
  await env.DB.prepare(
    `INSERT INTO prefix_radar_state
       (account_id, cidr, announced, visible_routes, source, last_change_at,
        last_webhook_at, last_webhook_event, updated_at)
     VALUES (?, ?, ?, 0, 'webhook', datetime('now'), datetime('now'), ?, datetime('now'))`,
  ).bind(accountId, cidr, seededAnnounced, eventLabel).run();
}

/** Fan the webhook event out through the account's notification channels. */
async function notifyWebhook(
  env: Env, ownerEmail: string, accountId: string, cidr: string, parsed: ParsedWebhook,
): Promise<void> {
  const eventType = parsed.action === 'advertise' ? 'webhook_advertise'
    : parsed.action === 'withdraw' ? 'webhook_withdraw'
    : 'webhook_event';
  const verb = parsed.action === 'advertise' ? 'advertised'
    : parsed.action === 'withdraw' ? 'withdrawn'
    : 'reported';
  const detail = parsed.alert_type
    ? `Prefix ${cidr} ${verb} via Cloudflare notification (${parsed.alert_type})`
    : `Prefix ${cidr} ${verb} via Cloudflare notification`;

  await enqueueNotification(env, {
    user_email: ownerEmail,
    account_id: accountId,
    event_type: eventType,
    title: cidr,
    details: detail,
  });
}
