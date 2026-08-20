import type {
  Env, NotificationChannel, NotificationSubscription, NotificationLog, ChannelType,
} from './types';

export function safeParse<T>(s: unknown, fallback: T): T {
  try {
    return s ? (JSON.parse(s as string) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function mapChannel(r: Record<string, unknown>): NotificationChannel {
  return {
    id: r.id as number,
    user_email: r.user_email as string,
    account_id: r.account_id as string,
    type: r.type as ChannelType,
    name: r.name as string,
    config: safeParse(r.config, {}),
    enabled: !!r.enabled,
    created_at: r.created_at as string,
  };
}

export function mapSubscription(r: Record<string, unknown>): NotificationSubscription {
  return {
    id: r.id as number,
    user_email: r.user_email as string,
    account_id: r.account_id as string,
    event_type: r.event_type as string,
    channel_ids: safeParse(r.channel_ids, [] as number[]),
    enabled: !!r.enabled,
    updated_at: r.updated_at as string,
  };
}

export function mapLog(r: Record<string, unknown>): NotificationLog {
  return {
    id: r.id as number,
    user_email: r.user_email as string,
    account_id: r.account_id as string,
    event_type: r.event_type as string,
    title: r.title as string,
    details: r.details as string,
    channel_id: (r.channel_id as number) ?? null,
    channel_type: r.channel_type as string,
    payload: safeParse(r.payload, {}),
    status: r.status as NotificationLog['status'],
    attempts: (r.attempts as number) ?? 0,
    error: (r.error as string) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    delivered_at: (r.delivered_at as string) ?? null,
  };
}

/** Mask secret values in a channel config for safe display. */
export function maskChannelConfig(c: NotificationChannel): NotificationChannel {
  if (c.type === 'pagerduty' && c.config.routing_key) {
    return { ...c, config: { routing_key: '••••' + c.config.routing_key.slice(-4) } };
  }
  if (c.type === 'webhook' && c.config.token) {
    return { ...c, config: { ...c.config, token: '••••' + c.config.token.slice(-4) } };
  }
  return c;
}

/** Load the enabled subscription for an account + event (or null). */
export async function getSubscription(
  env: Env, email: string, accountId: string, eventType: string,
): Promise<NotificationSubscription | null> {
  const row = await env.DB.prepare(
    'SELECT * FROM notification_subscriptions WHERE user_email = ? AND account_id = ? AND event_type = ?'
  ).bind(email, accountId, eventType).first<Record<string, unknown>>();
  return row ? mapSubscription(row) : null;
}

/** Load full (unmasked) enabled channels by id list, scoped to user + account. */
export async function loadChannelsByIds(
  env: Env, email: string, accountId: string, ids: number[],
): Promise<NotificationChannel[]> {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = await env.DB.prepare(
    `SELECT * FROM notification_channels WHERE user_email = ? AND account_id = ? AND enabled = 1 AND id IN (${placeholders})`
  ).bind(email, accountId, ...ids).all<Record<string, unknown>>();
  return (rows.results || []).map(mapChannel);
}

/** Load a single channel by id (unmasked), scoped to user. */
export async function loadChannel(
  env: Env, email: string, id: number,
): Promise<NotificationChannel | null> {
  const row = await env.DB.prepare(
    'SELECT * FROM notification_channels WHERE id = ? AND user_email = ?'
  ).bind(id, email).first<Record<string, unknown>>();
  return row ? mapChannel(row) : null;
}
