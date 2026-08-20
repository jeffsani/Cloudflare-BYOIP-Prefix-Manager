import type { Env, NotifyMessage, NotificationPayload } from './types';
import { NOTIFICATION_EVENTS } from './types';
import { dispatchToChannel } from './notify';
import { getSubscription, loadChannelsByIds, mapLog, mapChannel } from './notifications-db';

const DLQ_NAME = 'prefix-mgr-notifications-dlq';

export interface NotificationInput {
  user_email: string;
  account_id: string;
  event_type: string;
  title: string;
  details?: string;
}

/**
 * Fan an event out to its subscribed channels: create a queued `notification_log`
 * row per channel and enqueue a Cloudflare Queue message referencing it.
 * Safe to await or fire-and-forget; never throws.
 */
export async function enqueueNotification(env: Env, input: NotificationInput): Promise<void> {
  try {
    const sub = await getSubscription(env, input.user_email, input.account_id, input.event_type);
    if (!sub || !sub.enabled || !sub.channel_ids.length) return;

    const channels = await loadChannelsByIds(env, input.user_email, input.account_id, sub.channel_ids);
    if (!channels.length) return;

    const payload: NotificationPayload = {
      event_type: input.event_type,
      event_label: NOTIFICATION_EVENTS[input.event_type] || input.event_type,
      account_id: input.account_id,
      title: input.title,
      details: input.details || '',
      timestamp: new Date().toISOString(),
    };

    for (const ch of channels) {
      const res = await env.DB.prepare(
        `INSERT INTO notification_log
           (user_email, account_id, event_type, title, details, channel_id, channel_type, payload, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued')`
      ).bind(
        input.user_email, input.account_id, input.event_type, input.title, input.details || '',
        ch.id, ch.type, JSON.stringify(payload),
      ).run();
      const logId = res.meta.last_row_id as number;

      try {
        await env.NOTIFY_QUEUE.send({ logId } satisfies NotifyMessage);
      } catch (err) {
        await env.DB.prepare(
          "UPDATE notification_log SET status = 'failed', error = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(`enqueue failed: ${err instanceof Error ? err.message : String(err)}`, logId).run();
      }
    }
  } catch (err) {
    console.error('enqueueNotification failed:', err);
  }
}

/**
 * Consumer entry point for both the main queue and the dead-letter queue.
 * Distinguishes them via `batch.queue`.
 */
export async function handleQueueBatch(batch: MessageBatch<NotifyMessage>, env: Env): Promise<void> {
  const isDlq = batch.queue === DLQ_NAME;
  for (const msg of batch.messages) {
    try {
      if (isDlq) {
        await markDeadLetter(env, msg.body.logId);
        msg.ack();
      } else {
        await deliver(env, msg.body.logId);
        msg.ack();
      }
    } catch (err) {
      // Delivery failed — let Queues retry (and eventually route to the DLQ).
      console.error('queue message failed:', err);
      msg.retry();
    }
  }
}

async function markDeadLetter(env: Env, logId: number): Promise<void> {
  await env.DB.prepare(
    "UPDATE notification_log SET status = 'dead_letter', updated_at = datetime('now') WHERE id = ?"
  ).bind(logId).run();
}

/**
 * Deliver a single notification_log row. Throws on failure so the queue retries;
 * records status transitions in D1 for the UI panel.
 */
async function deliver(env: Env, logId: number): Promise<void> {
  const row = await env.DB.prepare('SELECT * FROM notification_log WHERE id = ?')
    .bind(logId).first<Record<string, unknown>>();
  if (!row) return; // Row deleted — nothing to do.
  const log = mapLog(row);

  // Idempotency: don't re-send terminal rows on redelivery.
  if (log.status === 'sent' || log.status === 'dead_letter') return;
  if (log.channel_id == null) throw new Error('log row has no channel');

  const channel = await env.DB.prepare('SELECT * FROM notification_channels WHERE id = ?')
    .bind(log.channel_id).first<Record<string, unknown>>();
  if (!channel) {
    await env.DB.prepare(
      "UPDATE notification_log SET status = 'failed', error = 'channel deleted', updated_at = datetime('now') WHERE id = ?"
    ).bind(logId).run();
    return;
  }

  const res = await dispatchToChannel(env, mapChannel(channel), log.payload as unknown as NotificationPayload);

  if (res.ok) {
    await env.DB.prepare(
      "UPDATE notification_log SET status = 'sent', error = NULL, attempts = attempts + 1, delivered_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).bind(logId).run();
    return;
  }

  // Mark retrying and throw so the queue schedules a retry.
  await env.DB.prepare(
    "UPDATE notification_log SET status = 'retrying', error = ?, attempts = attempts + 1, updated_at = datetime('now') WHERE id = ?"
  ).bind(res.error || 'delivery failed', logId).run();
  throw new Error(res.error || 'delivery failed');
}
