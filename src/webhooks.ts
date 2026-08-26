import type { Context } from 'hono';
import type { Env } from './types';
import { enqueueNotification } from './queue';
import { logActivity } from './helpers';

type MachineEnv = {
  Bindings: Env;
  Variables: { account_id: string; owner_email: string; scopes: string[] };
};

// IPv4 and (loose) IPv6 CIDR matchers used to pull prefixes out of free-form
// webhook text/data. Deliberately permissive — raw payloads are also stored.
const IPV4_CIDR = /\b(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}\b/g;
const IPV6_CIDR = /\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\/\d{1,3}\b/g;

/** Per-prefix advertisement status from auto-advertisement notifications. */
export type AdvertisementStatus =
  | 'advertised'         // successfully advertised
  | 'already_advertised' // was already advertised before the attempt
  | 'delayed'            // will retry later
  | 'locked'             // prefix is locked, cannot advertise
  | 'could_not_advertise' // failed to advertise
  | 'error';             // general error

export interface ParsedWebhook {
  cidrs: string[];
  action: 'advertise' | 'withdraw' | 'unknown';
  alert_type: string;
  account_id: string;
  /** Per-CIDR advertisement status for fbm_auto_advertisement alerts. */
  prefix_statuses: Record<string, AdvertisementStatus>;
}

// Map human-readable status strings from Cloudflare to normalised keys.
// Includes both the documented UI labels and the machine values seen in actual
// webhook payloads (e.g. "failed" in data.advertise_status[].status).
const STATUS_MAP: Record<string, AdvertisementStatus> = {
  'advertised': 'advertised',
  'already advertised': 'already_advertised',
  'delayed': 'delayed',
  'locked': 'locked',
  'could not advertise': 'could_not_advertise',
  'failed': 'could_not_advertise',
  'error': 'error',
};

/**
 * Try to extract per-prefix advertisement statuses from the text/data of an
 * fbm_auto_advertisement payload.  Handles two known formats:
 *
 *   Text field (pipe-delimited):
 *     "- Prefix: 203.0.113.0/24 | Status: advertised"
 *   Text field (colon/dash-delimited):
 *     "203.0.113.0/24: Advertised"  or  "203.0.113.0/24 - Already Advertised"
 *
 *   Structured data:
 *     data.advertise_status = [{ prefix: "...", status: "..." }, ...]
 *     data.prefixes          = [{ prefix: "...", status: "..." }, ...]
 *     data.prefix_statuses   = { "CIDR": "status", ... }
 */
function parseAutoAdvertStatuses(payload: Record<string, any>): Record<string, AdvertisementStatus> {
  const statuses: Record<string, AdvertisementStatus> = {};
  const text = String(payload.text || '');
  const data = payload.data ?? {};

  const cidrPattern = '(?:\\d{1,3}\\.){3}\\d{1,3}\\/\\d{1,2}|(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\\/\\d{1,3}';
  const statusLabels = Object.keys(STATUS_MAP).join('|');

  // --- Format 1: "Prefix: CIDR | Status: value" (pipe-delimited) ---
  const pipeRegex = new RegExp(
    `Prefix:\\s*(${cidrPattern})\\s*\\|\\s*Status:\\s*(${statusLabels})`,
    'gi',
  );
  let m: RegExpExecArray | null;
  while ((m = pipeRegex.exec(text)) !== null) {
    const label = m[2].toLowerCase();
    if (STATUS_MAP[label]) statuses[m[1]] = STATUS_MAP[label];
  }

  // --- Format 2: "CIDR: Status" or "CIDR - Status" (colon/dash-delimited) ---
  const colonRegex = new RegExp(
    `(${cidrPattern})\\s*[:\\-–—]\\s*(${statusLabels})`,
    'gi',
  );
  while ((m = colonRegex.exec(text)) !== null) {
    if (!statuses[m[1]]) {
      const label = m[2].toLowerCase();
      if (STATUS_MAP[label]) statuses[m[1]] = STATUS_MAP[label];
    }
  }

  // --- Probe structured data for per-prefix status arrays ---
  // Real payloads use data.advertise_status; also probe data.prefixes and
  // data.prefix_statuses for forward-compatibility.
  const prefixList = Array.isArray(data.advertise_status) ? data.advertise_status
    : Array.isArray(data.prefixes) ? data.prefixes
    : Array.isArray(data.prefix_statuses) ? data.prefix_statuses
    : null;
  if (prefixList) {
    for (const entry of prefixList) {
      if (!entry || typeof entry !== 'object') continue;
      const cidr = String(entry.prefix || entry.cidr || '');
      const rawStatus = String(entry.status || entry.advertisement_status || '').toLowerCase();
      if (cidr && STATUS_MAP[rawStatus]) statuses[cidr] = STATUS_MAP[rawStatus];
    }
  }
  if (data.prefix_statuses && !Array.isArray(data.prefix_statuses) && typeof data.prefix_statuses === 'object') {
    for (const [cidr, rawStatus] of Object.entries(data.prefix_statuses)) {
      const label = String(rawStatus).toLowerCase();
      if (STATUS_MAP[label]) statuses[cidr] = STATUS_MAP[label];
    }
  }

  return statuses;
}

/** True when the status means the prefix is actually being announced. */
function isAdvertisedStatus(status: AdvertisementStatus): boolean {
  return status === 'advertised' || status === 'already_advertised';
}

/**
 * Tolerant parser for Cloudflare's generic webhook payload. Extracts affected
 * CIDRs and an advertise/withdraw intent from alert_type + text + data. The
 * `data` schema is alert-type-specific and not fully documented, so we scan the
 * stringified payload heuristically.
 *
 * For `fbm_auto_advertisement` alerts, per-prefix statuses are extracted so
 * that failed advertisements (Delayed / Locked / Could not Advertise / Error)
 * are not misclassified as successful.
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

  // --- Per-prefix statuses for auto-advertisement alerts ---
  let prefixStatuses: Record<string, AdvertisementStatus> = {};
  if (alertType === 'fbm_auto_advertisement') {
    prefixStatuses = parseAutoAdvertStatuses(payload);
  }

  // --- Determine the overall action ---
  const lower = haystack.toLowerCase();
  let action: ParsedWebhook['action'] = 'unknown';

  if (alertType === 'fbm_auto_advertisement' && Object.keys(prefixStatuses).length) {
    // Derive action from the per-prefix statuses: if ANY prefix was successfully
    // advertised, the overall action is 'advertise'. Otherwise 'unknown' —
    // we don't want to seed announced=1 for failed/delayed attempts.
    const hasSuccess = Object.values(prefixStatuses).some(isAdvertisedStatus);
    action = hasSuccess ? 'advertise' : 'unknown';
  } else if (/withdraw/.test(lower)) {
    action = 'withdraw';
  } else if (/(?:^|[^a-z])(?:could\s+not\s+advertis|unable\s+to\s+advertis)/i.test(haystack)) {
    // Negative phrasing — NOT a successful advertisement.
    action = 'unknown';
  } else if (/advertis/.test(lower)) {
    action = 'advertise';
  }

  return {
    cidrs,
    action,
    alert_type: alertType,
    account_id: String(payload.account_id || ''),
    prefix_statuses: prefixStatuses,
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
 * Determine whether a specific prefix should be treated as announced based on
 * the per-prefix status (if available) or the overall parsed action.
 */
function cidrIsAnnounced(cidr: string, parsed: ParsedWebhook): boolean {
  const status = parsed.prefix_statuses[cidr];
  if (status) return isAdvertisedStatus(status);
  return parsed.action === 'advertise';
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
  const status = parsed.prefix_statuses[cidr];
  const statusSuffix = status ? `:${status}` : '';
  const eventLabel = `${parsed.alert_type || 'webhook'}:${parsed.action}${statusSuffix}`;
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

  const seededAnnounced = cidrIsAnnounced(cidr, parsed) ? 1 : 0;
  await env.DB.prepare(
    `INSERT INTO prefix_radar_state
       (account_id, cidr, announced, visible_routes, source, last_change_at,
        last_webhook_at, last_webhook_event, updated_at)
     VALUES (?, ?, ?, 0, 'webhook', datetime('now'), datetime('now'), ?, datetime('now'))`,
  ).bind(accountId, cidr, seededAnnounced, eventLabel).run();
}

// ─── Logpush: Audit Logs v2 ingestion ────────────────────────────────
// Cloudflare pushes batched, gzip-compressed, newline-delimited JSON (NDJSON)
// to this endpoint. We store addressing-related entries in D1 so the Activity
// panel can read them fast instead of synchronously polling the Audit Logs API.

/** Read the (possibly gzipped) request body as text. */
async function readBodyText(c: Context<MachineEnv>): Promise<string> {
  const buf = await c.req.arrayBuffer();
  if (!buf.byteLength) return '';
  const enc = (c.req.header('content-encoding') || '').toLowerCase();
  const looksGzipped = enc.includes('gzip') || (() => {
    const b = new Uint8Array(buf);
    return b.length > 2 && b[0] === 0x1f && b[1] === 0x8b; // gzip magic bytes
  })();

  if (looksGzipped) {
    try {
      const stream = new Response(buf).body!.pipeThrough(new DecompressionStream('gzip'));
      return await new Response(stream).text();
    } catch (err) {
      console.error('logpush gunzip failed, falling back to raw text:', err);
    }
  }
  return new TextDecoder().decode(buf);
}

const AUDIT_TIME = (v: unknown): string => {
  if (typeof v === 'number') return new Date(v > 1e12 ? v : v * 1000).toISOString();
  return v ? String(v) : '';
};

/**
 * POST /webhooks/logpush — receive Cloudflare Logpush batches for the
 * `audit_logs_v2` dataset. Auth (cf-webhook-auth) is enforced by
 * webhookAuthMiddleware. Cloudflare validates the destination by pushing a
 * gzipped `{"content":"tests"}` payload, which we acknowledge with 200.
 */
export async function handleLogpushWebhook(c: Context<MachineEnv>) {
  const accountId = c.get('account_id');

  const body = await readBodyText(c);
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);

  // Destination-validation ping: a single {"content":"tests"} object.
  if (lines.length === 1) {
    try {
      const obj = JSON.parse(lines[0]) as Record<string, unknown>;
      if (obj && obj.content === 'tests' && !obj.AuditLogID) {
        return c.json({ ok: true, validation: true });
      }
    } catch {
      // Not JSON — fall through and treat as empty.
    }
  }

  let stored = 0;
  for (const line of lines) {
    let e: Record<string, any>;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (!e || !e.AuditLogID) continue;
    // Only surface addressing/prefix entries (matches the live-API filter).
    const product = String(e.ResourceProduct || '');
    if (product && product !== 'addressing') continue;

    try {
      await c.env.DB.prepare(
        `INSERT INTO audit_log_events
           (account_id, audit_log_id, action_type, action_description, action_result,
            actor_email, actor_type, actor_ip, actor_context,
            resource_id, resource_product, resource_type, action_time, raw)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(audit_log_id) DO NOTHING`,
      ).bind(
        e.AccountID || accountId,
        String(e.AuditLogID),
        String(e.ActionType || ''),
        String(e.ActionDescription || ''),
        String(e.ActionResult || ''),
        String(e.ActorEmail || ''),
        String(e.ActorType || ''),
        String(e.ActorIPAddress || ''),
        String(e.ActorContext || ''),
        String(e.ResourceID || ''),
        product,
        String(e.ResourceType || ''),
        AUDIT_TIME(e.ActionTimestamp),
        JSON.stringify(e).slice(0, 100000),
      ).run();
      stored++;
    } catch (err) {
      console.error('audit_log_events insert failed:', err);
    }
  }

  return c.json({ ok: true, received: lines.length, stored });
}

/** Human-readable label for an advertisement status. */
const STATUS_LABELS: Record<AdvertisementStatus, string> = {
  advertised: 'Advertised',
  already_advertised: 'Already Advertised',
  delayed: 'Delayed',
  locked: 'Locked',
  could_not_advertise: 'Could not Advertise',
  error: 'Error',
};

/** Fan the webhook event out through the account's notification channels. */
async function notifyWebhook(
  env: Env, ownerEmail: string, accountId: string, cidr: string, parsed: ParsedWebhook,
): Promise<void> {
  const prefixStatus = parsed.prefix_statuses[cidr];

  // Use per-prefix status to pick the right event type and verb.
  let eventType: string;
  let verb: string;

  if (prefixStatus) {
    const announced = isAdvertisedStatus(prefixStatus);
    eventType = announced ? 'webhook_advertise' : 'webhook_event';
    verb = STATUS_LABELS[prefixStatus] || prefixStatus;
  } else {
    eventType = parsed.action === 'advertise' ? 'webhook_advertise'
      : parsed.action === 'withdraw' ? 'webhook_withdraw'
      : 'webhook_event';
    verb = parsed.action === 'advertise' ? 'advertised'
      : parsed.action === 'withdraw' ? 'withdrawn'
      : 'reported';
  }

  const statusNote = prefixStatus ? ` [${STATUS_LABELS[prefixStatus] || prefixStatus}]` : '';
  const detail = parsed.alert_type
    ? `Prefix ${cidr} ${verb} via Cloudflare notification (${parsed.alert_type})${statusNote}`
    : `Prefix ${cidr} ${verb} via Cloudflare notification${statusNote}`;

  await logActivity(env.DB, ownerEmail, eventType, detail);
  await enqueueNotification(env, {
    user_email: ownerEmail,
    account_id: accountId,
    event_type: eventType,
    title: cidr,
    details: detail,
  });
}
