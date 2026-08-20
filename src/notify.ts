import type { Env, NotificationChannel, NotificationPayload } from './types';

/**
 * POST a JSON payload to an arbitrary webhook URL. If a bearer token is
 * provided, it is sent as an `Authorization: Bearer <token>` header.
 */
export async function sendWebhook(
  url: string,
  payload: NotificationPayload,
  token?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type: 'prefix_manager_event', ...payload }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, error: `HTTP ${resp.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Trigger a PagerDuty incident via the Events API v2.
 */
export async function sendPagerDuty(
  routingKey: string,
  payload: NotificationPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: 'trigger',
        dedup_key: `prefix-mgr-${payload.account_id}-${payload.event_type}-${payload.title}`,
        payload: {
          summary: `${payload.event_label}: ${payload.title}`,
          source: `prefix-mgr/${payload.account_id}`,
          severity: payload.event_type.startsWith('external_') ? 'warning' : 'info',
          custom_details: payload,
        },
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, error: `HTTP ${resp.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send an email via the Resend API. Requires RESEND_API_KEY + ALERT_FROM_EMAIL.
 */
export async function sendEmail(
  env: Env,
  to: string,
  payload: NotificationPayload,
): Promise<{ ok: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not configured' };
  if (!env.ALERT_FROM_EMAIL) return { ok: false, error: 'ALERT_FROM_EMAIL not configured' };

  const subject = `Prefix Manager: ${payload.event_label}`;
  const html =
    `<h2>Prefix Manager Notification</h2>` +
    `<p><strong>${escapeHtml(payload.event_label)}</strong></p>` +
    `<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">` +
    `<tr><td><b>Event</b></td><td>${escapeHtml(payload.event_label)}</td></tr>` +
    `<tr><td><b>Account</b></td><td>${escapeHtml(payload.account_id)}</td></tr>` +
    `<tr><td><b>Summary</b></td><td>${escapeHtml(payload.title)}</td></tr>` +
    `<tr><td><b>Details</b></td><td>${escapeHtml(payload.details)}</td></tr>` +
    `<tr><td><b>Time</b></td><td>${escapeHtml(payload.timestamp)}</td></tr>` +
    `</table>`;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.ALERT_FROM_EMAIL, to: [to], subject, html }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, error: `HTTP ${resp.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Dispatch a notification through a single channel based on its type.
 */
export async function dispatchToChannel(
  env: Env,
  channel: NotificationChannel,
  payload: NotificationPayload,
): Promise<{ ok: boolean; error?: string }> {
  switch (channel.type) {
    case 'webhook':
      if (!channel.config.url) return { ok: false, error: 'Webhook URL missing' };
      return sendWebhook(channel.config.url, payload, channel.config.token);
    case 'pagerduty':
      if (!channel.config.routing_key) return { ok: false, error: 'PagerDuty routing key missing' };
      return sendPagerDuty(channel.config.routing_key, payload);
    case 'email':
      if (!channel.config.email) return { ok: false, error: 'Email address missing' };
      return sendEmail(env, channel.config.email, payload);
    default:
      return { ok: false, error: `Unknown channel type: ${(channel as { type: string }).type}` };
  }
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
