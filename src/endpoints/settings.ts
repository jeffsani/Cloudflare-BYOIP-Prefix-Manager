import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env, UserAccount } from '../types';
import { maskToken, isRealSecret } from '../helpers';
import { verifyTokenPermissions } from '../api';
import {
  AccountPreferencesSchema,
  CreateAccountRequestSchema,
  SettingsResponseSchema,
  TokenTestRequestSchema,
  TokenTestResponseSchema,
} from '../schemas/accounts';
import { ErrorResponseSchema, OkResponseSchema } from '../schemas/common';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// GET /api/settings
export class ListAccounts extends OpenAPIRoute {
  schema = {
    tags: ['Account Settings'],
    summary: 'List accounts',
    description: 'List all Cloudflare accounts configured for the authenticated user.',
    responses: {
      '200': {
        description: 'List of accounts',
        ...contentJson(SettingsResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const rows = await c.env.DB.prepare(
      'SELECT * FROM user_accounts WHERE user_email = ? ORDER BY is_default DESC, id ASC',
    )
      .bind(email)
      .all<UserAccount>();

    const accounts = (rows.results || []).map((r) => ({
      id: r.id,
      account_label: r.account_label,
      account_id: r.account_id,
      api_token: maskToken(r.api_token),
      is_default: r.is_default,
      api_rate_limit_5min: r.api_rate_limit_5min ?? 1200,
      updated_at: r.updated_at,
    }));
    let aggregateAccounts = false;
    try {
      const preferences = await c.env.DB.prepare(
        'SELECT aggregate_accounts FROM user_preferences WHERE user_email = ?',
      )
        .bind(email)
        .first<{ aggregate_accounts: number }>();
      aggregateAccounts = !!preferences?.aggregate_accounts;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!/no such table:\s*user_preferences\b/i.test(message)) throw e;
    }

    return c.json({ accounts, aggregate_accounts: aggregateAccounts });
  }
}

// PUT /api/settings/preferences
export class UpdateAccountPreferences extends OpenAPIRoute {
  schema = {
    tags: ['Account Settings'],
    summary: 'Update account display preferences',
    description: 'Update aggregate multi-account behavior for the authenticated user.',
    request: {
      body: contentJson(AccountPreferencesSchema),
    },
    responses: {
      '200': {
        description: 'Preferences updated',
        ...contentJson(AccountPreferencesSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const aggregateAccounts = data.body.aggregate_accounts;

    await c.env.DB.prepare(
      `INSERT INTO user_preferences (user_email, aggregate_accounts) VALUES (?, ?)
       ON CONFLICT(user_email) DO UPDATE SET aggregate_accounts = excluded.aggregate_accounts`,
    )
      .bind(email, aggregateAccounts ? 1 : 0)
      .run();

    return c.json({ aggregate_accounts: aggregateAccounts });
  }
}

// POST /api/settings
export class CreateAccount extends OpenAPIRoute {
  schema = {
    tags: ['Account Settings'],
    summary: 'Add or update account',
    description: 'Add a new Cloudflare account or update an existing one (upsert by account_id).',
    request: {
      body: contentJson(CreateAccountRequestSchema),
    },
    responses: {
      '200': {
        description: 'Account saved',
        ...contentJson(OkResponseSchema),
      },
      '400': {
        description: 'Validation error',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;

    // Upsert
    const existing = await c.env.DB.prepare(
      'SELECT id FROM user_accounts WHERE user_email = ? AND account_id = ?',
    )
      .bind(email, body.account_id)
      .first<{ id: number }>();

    const rateLimit = body.api_rate_limit_5min && body.api_rate_limit_5min > 0 ? body.api_rate_limit_5min : 1200;

    // The UI shows a masked token (maskToken) and echoes it back unchanged when
    // the user doesn't edit it. Treat a masked placeholder as "no change" so we
    // never overwrite the real stored token with bullet characters.
    const tokenProvided = isRealSecret(body.api_token);

    if (existing) {
      if (tokenProvided) {
        await c.env.DB.prepare(
          `UPDATE user_accounts SET account_label = ?, api_token = ?, api_rate_limit_5min = ?, updated_at = datetime('now')
           WHERE id = ? AND user_email = ?`,
        )
          .bind(body.account_label || '', body.api_token, rateLimit, existing.id, email)
          .run();
      } else {
        await c.env.DB.prepare(
          `UPDATE user_accounts SET account_label = ?, api_rate_limit_5min = ?, updated_at = datetime('now')
           WHERE id = ? AND user_email = ?`,
        )
          .bind(body.account_label || '', rateLimit, existing.id, email)
          .run();
      }
    } else {
      // Auto-set default if first account
      const count = await c.env.DB.prepare(
        'SELECT COUNT(*) as cnt FROM user_accounts WHERE user_email = ?',
      )
        .bind(email)
        .first<{ cnt: number }>();
      const isDefault = (count?.cnt || 0) === 0 ? 1 : 0;

      await c.env.DB.prepare(
        `INSERT INTO user_accounts (user_email, account_label, account_id, api_token, is_default, api_rate_limit_5min)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
        .bind(email, body.account_label || '', body.account_id, tokenProvided ? body.api_token : '', isDefault, rateLimit)
        .run();
    }

    return c.json({ ok: true });
  }
}

// DELETE /api/settings/:id
export class DeleteAccount extends OpenAPIRoute {
  schema = {
    tags: ['Account Settings'],
    summary: 'Delete account',
    description: 'Delete a Cloudflare account configuration. If the deleted account was the default, the next account becomes default.',
    request: {
      params: z.object({
        id: z.string().describe('Account row ID'),
      }),
    },
    responses: {
      '200': {
        description: 'Account deleted',
        ...contentJson(OkResponseSchema),
      },
      '404': {
        description: 'Account not found',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const id = parseInt(data.params.id, 10);

    const row = await c.env.DB.prepare(
      'SELECT * FROM user_accounts WHERE id = ? AND user_email = ?',
    )
      .bind(id, email)
      .first<UserAccount>();
    if (!row) return c.json({ error: 'Not found' }, 404);

    const accountId = row.account_id;

    // Purge everything scoped to this (user, account). Critically this revokes
    // machine credentials — API keys and inbound webhook secrets keep working
    // otherwise, since they authenticate by hash → account_id and never join
    // back to user_accounts. These tables carry a user_email/owner_email column
    // so deletion is safe even when another user shares the same account_id.
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM user_accounts WHERE id = ? AND user_email = ?').bind(id, email),
      c.env.DB.prepare('DELETE FROM api_keys WHERE owner_email = ? AND account_id = ?').bind(email, accountId),
      c.env.DB.prepare('DELETE FROM webhook_endpoints WHERE owner_email = ? AND account_id = ?').bind(email, accountId),
      c.env.DB.prepare('DELETE FROM notification_channels WHERE user_email = ? AND account_id = ?').bind(email, accountId),
      c.env.DB.prepare('DELETE FROM notification_subscriptions WHERE user_email = ? AND account_id = ?').bind(email, accountId),
      c.env.DB.prepare('DELETE FROM notification_log WHERE user_email = ? AND account_id = ?').bind(email, accountId),
      c.env.DB.prepare('DELETE FROM rir_credentials WHERE user_email = ? AND account_id = ?').bind(email, accountId),
      c.env.DB.prepare('DELETE FROM prefix_monitor_cache WHERE user_email = ? AND account_id = ?').bind(email, accountId),
    ]);

    // Account-scoped tables have no user_email column, so only purge them once
    // no other user still has this Cloudflare account configured.
    const others = await c.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM user_accounts WHERE account_id = ?',
    )
      .bind(accountId)
      .first<{ cnt: number }>();
    if ((others?.cnt || 0) === 0) {
      await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM prefix_radar_state WHERE account_id = ?').bind(accountId),
        c.env.DB.prepare('DELETE FROM delegation_descriptions WHERE account_id = ?').bind(accountId),
        c.env.DB.prepare('DELETE FROM webhook_events WHERE account_id = ?').bind(accountId),
        c.env.DB.prepare('DELETE FROM audit_log_events WHERE account_id = ?').bind(accountId),
      ]);
    }

    // Auto-activate next if deleted was default
    if (row.is_default) {
      const next = await c.env.DB.prepare(
        'SELECT id FROM user_accounts WHERE user_email = ? ORDER BY id ASC LIMIT 1',
      )
        .bind(email)
        .first<{ id: number }>();
      if (next) {
        await c.env.DB.prepare(
          'UPDATE user_accounts SET is_default = 1 WHERE id = ? AND user_email = ?',
        )
          .bind(next.id, email)
          .run();
      }
    }

    return c.json({ ok: true });
  }
}

// DELETE /api/settings/:id/token
export class ClearAccountToken extends OpenAPIRoute {
  schema = {
    tags: ['Account Settings'],
    summary: 'Delete account API token',
    description: 'Clear the saved Cloudflare API token for an account without deleting the account itself.',
    request: {
      params: z.object({
        id: z.string().describe('Account row ID'),
      }),
    },
    responses: {
      '200': {
        description: 'Token cleared',
        ...contentJson(OkResponseSchema),
      },
      '404': {
        description: 'Account not found',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const id = parseInt(data.params.id, 10);

    const row = await c.env.DB.prepare(
      'SELECT id FROM user_accounts WHERE id = ? AND user_email = ?',
    )
      .bind(id, email)
      .first<{ id: number }>();
    if (!row) return c.json({ error: 'Not found' }, 404);

    await c.env.DB.prepare(
      "UPDATE user_accounts SET api_token = '', updated_at = datetime('now') WHERE id = ? AND user_email = ?",
    )
      .bind(id, email)
      .run();

    return c.json({ ok: true });
  }
}

// PUT /api/settings/:id/default
export class SetDefaultAccount extends OpenAPIRoute {
  schema = {
    tags: ['Account Settings'],
    summary: 'Set default account',
    description: 'Set a Cloudflare account as the default for the authenticated user.',
    request: {
      params: z.object({
        id: z.string().describe('Account row ID'),
      }),
    },
    responses: {
      '200': {
        description: 'Default account updated',
        ...contentJson(OkResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const id = parseInt(data.params.id, 10);

    await c.env.DB.prepare('UPDATE user_accounts SET is_default = 0 WHERE user_email = ?')
      .bind(email)
      .run();
    await c.env.DB.prepare(
      'UPDATE user_accounts SET is_default = 1 WHERE id = ? AND user_email = ?',
    )
      .bind(id, email)
      .run();

    return c.json({ ok: true });
  }
}

// POST /api/test-token
export class TestToken extends OpenAPIRoute {
  schema = {
    tags: ['Account Settings'],
    summary: 'Test token permissions',
    description: 'Validate a Cloudflare API token by testing its permissions against the account.',
    request: {
      body: contentJson(TokenTestRequestSchema),
    },
    responses: {
      '200': {
        description: 'Token test results',
        ...contentJson(TokenTestResponseSchema),
      },
      '400': {
        description: 'Validation error',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;

    // For a saved account the token is masked in the UI, so resolve the stored
    // token from the DB when the request omits it (or echoes back the mask).
    let token = isRealSecret(body.api_token) ? body.api_token : '';
    if (!token) {
      const stored = await c.env.DB.prepare(
        'SELECT api_token FROM user_accounts WHERE user_email = ? AND account_id = ?',
      )
        .bind(email, body.account_id)
        .first<{ api_token: string }>();
      if (!stored?.api_token) {
        return c.json({ error: 'No saved token found for this account.' }, 400);
      }
      token = stored.api_token;
    }

    const results = await verifyTokenPermissions(body.account_id, token);
    return c.json({ results });
  }
}
