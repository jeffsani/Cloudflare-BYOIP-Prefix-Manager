import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env } from '../types';
import { getToken, logActivity, resolveAccount } from '../helpers';
import { enqueueNotification } from '../queue';
import {
  listServiceBindings,
  listServices,
  createServiceBinding,
  deleteServiceBinding,
} from '../api';
import { CfServiceBindingSchema, CreateBindingRequestSchema } from '../schemas/prefixes';
import { ErrorResponseSchema, OkResponseSchema, AccountIdQuerySchema } from '../schemas/common';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// Magic Transit service bindings are gated per-account. When the binding is not
// ungated, Cloudflare rejects creation with an `unsupported_binding_configuration`
// error. Surface actionable guidance instead of the opaque API message.
const UNSUPPORTED_BINDING_MESSAGE =
  'Magic Transit service bindings are gated on your account. Please raise this with ' +
  'your Cloudflare account team to have the binding ungated, or ask your CSM, FDE, PS, ' +
  'or IM to create the binding for you.';

// Detect the gating error robustly: the `unsupported_binding_configuration` slug may
// appear in an error `message`, a string `code`, or a nested `error_chain`, so match
// against the stringified errors array.
function isUnsupportedBindingError(errors: unknown): boolean {
  if (!errors) return false;
  const haystack = JSON.stringify(errors).toLowerCase();
  return (
    haystack.includes('unsupported_binding_configuration') ||
    haystack.includes('unsupported binding configuration')
  );
}

function isMagicTransitService(name: string | undefined): boolean {
  return !!name && name.toLowerCase().includes('magic');
}

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
        const cfMessage = result.errors?.[0]?.message || 'API error';
        if (isUnsupportedBindingError(result.errors)) {
          // Only Magic Transit bindings are gated. Resolve the service name to
          // confirm before swapping in the friendly message; if the lookup fails
          // we still show it since Magic Transit is the only gated service.
          let isMagicTransit = true;
          try {
            const services = await listServices(acct.account_id, token);
            if (services.success) {
              const svc = services.result?.find((s) => s.id === body.service_id);
              if (svc) isMagicTransit = isMagicTransitService(svc.name);
            }
          } catch {
            // Keep the default (treat as Magic Transit) on lookup failure.
          }
          if (isMagicTransit) {
            return c.json({ error: UNSUPPORTED_BINDING_MESSAGE }, 502);
          }
        }
        return c.json({ error: cfMessage }, 502);
      }

      const bindCreateDetails = `Service binding ${body.cidr} → ${result.result?.service_name || body.service_id} on prefix ${prefixId} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'create_binding', bindCreateDetails);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'create_binding',
        title: body.cidr, details: bindCreateDetails,
      });

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

      const bindDeleteDetails = `Deleted service binding ${bindingId} on prefix ${prefixId} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'delete_binding', bindDeleteDetails);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'delete_binding',
        title: bindingId, details: bindDeleteDetails,
      });

      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}
