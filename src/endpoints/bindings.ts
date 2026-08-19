import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env } from '../types';
import { getToken, logActivity, resolveAccount } from '../helpers';
import {
  listServiceBindings,
  createServiceBinding,
  deleteServiceBinding,
} from '../api';
import { CfServiceBindingSchema, CreateBindingRequestSchema } from '../schemas/prefixes';
import { ErrorResponseSchema, OkResponseSchema, AccountIdQuerySchema } from '../schemas/common';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// GET /api/prefixes/:prefixId/bindings
export class ListBindings extends OpenAPIRoute {
  schema = {
    tags: ['Service Bindings'],
    summary: 'List service bindings',
    description: 'List all service bindings for a specific prefix.',
    request: {
      params: z.object({ prefixId: z.string() }),
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'List of bindings',
        ...contentJson(z.object({ bindings: z.array(CfServiceBindingSchema) })),
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
      const result = await listServiceBindings(acct.account_id, prefixId, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      return c.json({ bindings: result.result || [] });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/prefixes/:prefixId/bindings
export class CreateBinding extends OpenAPIRoute {
  schema = {
    tags: ['Service Bindings'],
    summary: 'Create service binding',
    description: 'Bind a Cloudflare service (e.g. Magic Transit, Spectrum) to a prefix CIDR.',
    request: {
      params: z.object({ prefixId: z.string() }),
      body: contentJson(CreateBindingRequestSchema),
    },
    responses: {
      '200': {
        description: 'Binding created',
        ...contentJson(z.object({ ok: z.literal(true), binding: CfServiceBindingSchema })),
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
      const result = await createServiceBinding(acct.account_id, prefixId, body.cidr, body.service_id, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }

      await logActivity(
        c.env.DB,
        email,
        'create_binding',
        `Service binding ${body.cidr} → ${result.result?.service_name || body.service_id} on prefix ${prefixId} in account ${acct.account_id}`,
      );

      return c.json({ ok: true, binding: result.result });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// DELETE /api/prefixes/:prefixId/bindings/:bindingId
export class DeleteBinding extends OpenAPIRoute {
  schema = {
    tags: ['Service Bindings'],
    summary: 'Delete service binding',
    description: 'Remove a service binding from a prefix.',
    request: {
      params: z.object({
        prefixId: z.string(),
        bindingId: z.string(),
      }),
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'Binding deleted',
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
    const { prefixId, bindingId } = data.params;
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await deleteServiceBinding(acct.account_id, prefixId, bindingId, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }

      await logActivity(
        c.env.DB,
        email,
        'delete_binding',
        `Deleted service binding ${bindingId} on prefix ${prefixId} in account ${acct.account_id}`,
      );

      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}
