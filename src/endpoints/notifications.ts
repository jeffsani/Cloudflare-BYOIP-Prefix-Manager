import type {
  Env, NotificationChannel, NotificationSubscription, ChannelType, NotificationPayload,
} from '../types';
import { NOTIFICATION_EVENTS } from '../types';
import { dispatchToChannel } from '../notify';
import {
  mapChannel, mapSubscription, mapLog, maskChannelConfig, safeParse,
} from '../notifications-db';

const CHANNEL_TYPES: ChannelType[] = ['email', 'pagerduty', 'webhook'];

// ─── Channels ───

export async function listChannels(env: Env, email: string, accountId: string): Promise<NotificationChannel[]> {
  const rows = await env.DB.prepare(
    'SELECT * FROM notification_channels WHERE user_email = ? AND account_id = ? ORDER BY created_at DESC'
  ).bind(email, accountId).all<Record<string, unknown>>();
  return (rows.results || []).map(mapChannel).map(maskChannelConfig);
}

export async function createChannel(
  env: Env, email: string, body: Record<string, any>,
): Promise<{ ok: boolean; id?: number; error?: string }> {
  const accountId = (body.account_id || '').trim();
  if (!accountId) return { ok: false, error: 'account_id is required' };
  const type = body.type as ChannelType;
  if (!CHANNEL_TYPES.includes(type)) return { ok: false, error: 'Invalid channel type' };
  const config = body.config || {};
  if (type === 'webhook' && !config.url) return { ok: false, error: 'Webhook URL required' };
  if (type === 'pagerduty' && !config.routing_key) return { ok: false, error: 'PagerDuty routing key required' };
  if (type === 'email' && !config.email) return { ok: false, error: 'Email address required' };
  const name = (body.name || '').trim() || type;

  const res = await env.DB.prepare(
    'INSERT INTO notification_channels (user_email, account_id, type, name, config, enabled) VALUES (?, ?, ?, ?, ?, 1)'
  ).bind(email, accountId, type, name, JSON.stringify(config)).run();
  return { ok: true, id: res.meta.last_row_id as number };
}

export async function updateChannel(
  env: Env, email: string, id: number, body: Record<string, any>,
): Promise<{ ok: boolean; error?: string }> {
  const existing = await env.DB.prepare(
    'SELECT * FROM notification_channels WHERE id = ? AND user_email = ?'
  ).bind(id, email).first<Record<string, unknown>>();
  if (!existing) return { ok: false, error: 'Not found' };

  const name = body.name !== undefined ? String(body.name).trim() : (existing.name as string);
  const enabled = body.enabled !== undefined ? (body.enabled ? 1 : 0) : (existing.enabled as number);
  let config = existing.config as string;
  if (body.config) {
    const incoming = { ...body.config };
    const prev = safeParse<Record<string, any>>(existing.config, {});
    // Keep existing secrets when the client sends masked placeholders.
    if (incoming.routing_key && String(incoming.routing_key).startsWith('••')) incoming.routing_key = prev.routing_key;
    if (incoming.token && String(incoming.token).startsWith('••')) incoming.token = prev.token;
    config = JSON.stringify(incoming);
  }
  await env.DB.prepare(
    'UPDATE notification_channels SET name = ?, enabled = ?, config = ? WHERE id = ? AND user_email = ?'
  ).bind(name, enabled, config, id, email).run();
  return { ok: true };
}

export async function deleteChannel(env: Env, email: string, id: number): Promise<{ ok: boolean }> {
  await env.DB.prepare('DELETE FROM notification_channels WHERE id = ? AND user_email = ?').bind(id, email).run();
  return { ok: true };
}

export async function testChannel(env: Env, email: string, id: number): Promise<{ ok: boolean; error?: string }> {
  const row = await env.DB.prepare(
    'SELECT * FROM notification_channels WHERE id = ? AND user_email = ?'
  ).bind(id, email).first<Record<string, unknown>>();
  if (!row) return { ok: false, error: 'Not found' };
  const channel = mapChannel(row);
  const payload: NotificationPayload = {
    event_type: 'test',
    event_label: 'Test Notification',
    account_id: channel.account_id,
    title: 'Test notification from Prefix Manager',
    details: 'If you received this, the channel is configured correctly.',
    timestamp: new Date().toISOString(),
  };
  return dispatchToChannel(env, channel, payload);
}

// ─── Subscriptions ───

export async function getSubscriptions(
  env: Env, email: string, accountId: string,
): Promise<{ events: Record<string, string>; subscriptions: NotificationSubscription[] }> {
  const rows = await env.DB.prepare(
    'SELECT * FROM notification_subscriptions WHERE user_email = ? AND account_id = ?'
  ).bind(email, accountId).all<Record<string, unknown>>();
  return {
    events: NOTIFICATION_EVENTS,
    subscriptions: (rows.results || []).map(mapSubscription),
  };
}

export async function updateSubscription(
  env: Env, email: string, body: Record<string, any>,
): Promise<{ ok: boolean; error?: string }> {
  const accountId = (body.account_id || '').trim();
  const eventType = (body.event_type || '').trim();
  if (!accountId || !eventType) return { ok: false, error: 'account_id and event_type are required' };
  if (!NOTIFICATION_EVENTS[eventType]) return { ok: false, error: `Unknown event: ${eventType}` };
  const channelIds = Array.isArray(body.channel_ids) ? body.channel_ids.map(Number).filter((n: number) => !Number.isNaN(n)) : [];
  const enabled = body.enabled === undefined ? 1 : (body.enabled ? 1 : 0);

  await env.DB.prepare(
    `INSERT INTO notification_subscriptions (user_email, account_id, event_type, channel_ids, enabled, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_email, account_id, event_type)
     DO UPDATE SET channel_ids = excluded.channel_ids, enabled = excluded.enabled, updated_at = datetime('now')`
  ).bind(email, accountId, eventType, JSON.stringify(channelIds), enabled).run();
  return { ok: true };
}

// ─── Log / queue status ───

export async function listLog(env: Env, email: string, accountId?: string) {
  const rows = accountId
    ? await env.DB.prepare(
        'SELECT * FROM notification_log WHERE user_email = ? AND account_id = ? ORDER BY created_at DESC LIMIT 100'
      ).bind(email, accountId).all<Record<string, unknown>>()
    : await env.DB.prepare(
        'SELECT * FROM notification_log WHERE user_email = ? ORDER BY created_at DESC LIMIT 100'
      ).bind(email).all<Record<string, unknown>>();
  return (rows.results || []).map(mapLog);
}

export async function retryLog(env: Env, email: string, id: number): Promise<{ ok: boolean; error?: string }> {
  const row = await env.DB.prepare(
    'SELECT * FROM notification_log WHERE id = ? AND user_email = ?'
  ).bind(id, email).first<Record<string, unknown>>();
  if (!row) return { ok: false, error: 'Not found' };

  await env.DB.prepare(
    "UPDATE notification_log SET status = 'queued', error = NULL, updated_at = datetime('now') WHERE id = ?"
  ).bind(id).run();
  try {
    await env.NOTIFY_QUEUE.send({ logId: id });
  } catch (err) {
    await env.DB.prepare(
      "UPDATE notification_log SET status = 'failed', error = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(`re-enqueue failed: ${err instanceof Error ? err.message : String(err)}`, id).run();
    return { ok: false, error: 'Failed to re-enqueue' };
  }
  return { ok: true };
}
