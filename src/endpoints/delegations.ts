import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env } from '../types';
import { getToken, logActivity, resolveAccount } from '../helpers';
import {
  listDelegations,
  createDelegation,
  deleteDelegation,
} from '../api';
import { CfDelegationSchema, CreateDelegationRequestSchema, UpdateDescriptionRequestSchema } from '../schemas/prefixes';
import { ErrorResponseSchema, OkResponseSchema, AccountIdQuerySchema } from '../schemas/common';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// GET /api/prefixes/:prefixId/delegations
export class ListDelegations extends OpenAPIRoute {
  schema = {
    tags: ['Delegations'],
    summary: 'List delegations',
    description: 'List all prefix delegations. Includes locally stored descriptions.',
    request: {
      params: z.object({ prefixId: z.string() }),
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'List of delegations',
        ...contentJson(z.object({ delegations: z.array(CfDelegationSchema) })),
      },
      '400': {
        description: 'No account configured',
        ...contentJson(ErrorResponseSchema),
      },
      '502': {
        description: 'Cloudflare API error',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const prefixId = data.params.prefixId;
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await listDelegations(acct.account_id, prefixId, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }

      // Enrich delegations with locally stored descriptions
      const delegations = result.result || [];
      if (delegations.length > 0) {
        const ids = delegations.map((d) => d.id);
        const placeholders = ids.map(() => '?').join(',');
        const rows = await c.env.DB.prepare(
          `SELECT delegation_id, description FROM delegation_descriptions WHERE account_id = ? AND delegation_id IN (${placeholders})`,
        )
          .bind(acct.account_id, ...ids)
          .all<{ delegation_id: string; description: string }>();
        const descMap = new Map((rows.results || []).map((r) => [r.delegation_id, r.description]));
        for (const d of delegations) {
          (d as any).description = descMap.get(d.id) || '';
        }
      }

      return c.json({ delegations });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/prefixes/:prefixId/delegations
export class CreateDelegationEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Delegations'],
    summary: 'Create delegation',
    description: 'Delegate a CIDR range from a prefix to another Cloudflare account.',
    request: {
      params: z.object({ prefixId: z.string() }),
      body: contentJson(CreateDelegationRequestSchema),
    },
    responses: {
      '200': {
        description: 'Delegation created',
        ...contentJson(z.object({ ok: z.literal(true), delegation: CfDelegationSchema })),
      },
      '400': {
        description: 'Validation error',
        ...contentJson(ErrorResponseSchema),
      },
      '502': {
        description: 'Cloudflare API error',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const prefixId = data.params.prefixId;
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await createDelegation(acct.account_id, prefixId, body.cidr, body.delegated_account_id, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }

      // Store local description if provided
      if (body.description && result.result?.id) {
        await c.env.DB.prepare(
          `INSERT INTO delegation_descriptions (delegation_id, account_id, description) VALUES (?, ?, ?)`,
        )
          .bind(result.result.id, acct.account_id, body.description)
          .run();
      }

      await logActivity(
        c.env.DB,
        email,
        'create_delegation',
        `Delegated ${body.cidr} to account ${body.delegated_account_id} on prefix ${prefixId} in account ${acct.account_id}`,
      );

      return c.json({ ok: true, delegation: result.result });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// DELETE /api/prefixes/:prefixId/delegations/:delegationId
export class DeleteDelegationEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Delegations'],
    summary: 'Delete delegation',
    description: 'Remove a prefix delegation. Also cleans up any local description.',
    request: {
      params: z.object({
        prefixId: z.string(),
        delegationId: z.string(),
      }),
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'Delegation deleted',
        ...contentJson(OkResponseSchema),
      },
      '400': {
        description: 'No account configured',
        ...contentJson(ErrorResponseSchema),
      },
      '502': {
        description: 'Cloudflare API error',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const { prefixId, delegationId } = data.params;
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await deleteDelegation(acct.account_id, prefixId, delegationId, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }

      // Clean up local description
      await c.env.DB.prepare(
        `DELETE FROM delegation_descriptions WHERE delegation_id = ? AND account_id = ?`,
      )
        .bind(delegationId, acct.account_id)
        .run();

      await logActivity(
        c.env.DB,
        email,
        'delete_delegation',
        `Deleted delegation ${delegationId} on prefix ${prefixId} in account ${acct.account_id}`,
      );

      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// PUT /api/delegations/:delegationId/description
export class UpdateDelegationDescription extends OpenAPIRoute {
  schema = {
    tags: ['Delegations'],
    summary: 'Update delegation description',
    description: 'Set or update the local description for a delegation.',
    request: {
      params: z.object({ delegationId: z.string() }),
      body: contentJson(UpdateDescriptionRequestSchema),
    },
    responses: {
      '200': {
        description: 'Description updated',
        ...contentJson(OkResponseSchema),
      },
      '400': {
        description: 'No account configured',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const delegationId = data.params.delegationId;
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    const description = (body.description || '').trim();

    await c.env.DB.prepare(
      `INSERT INTO delegation_descriptions (delegation_id, account_id, description)
       VALUES (?, ?, ?)
       ON CONFLICT(delegation_id, account_id)
       DO UPDATE SET description = excluded.description, updated_at = datetime('now')`,
    )
      .bind(delegationId, acct.account_id, description)
      .run();

    return c.json({ ok: true });
  }
}
