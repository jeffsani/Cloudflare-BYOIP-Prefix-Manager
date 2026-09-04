import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env } from '../types';
import { getToken, logActivity, resolveAccount } from '../helpers';
import { enqueueNotification } from '../queue';
import {
  listBgpPrefixes,
  createBgpPrefix,
  deleteBgpPrefix,
  toggleBgpAdvertisement,
} from '../api';
import { CfBgpPrefixSchema, CreateBgpPrefixRequestSchema, ToggleBgpRequestSchema } from '../schemas/prefixes';
import { ErrorResponseSchema, OkResponseSchema, AccountIdQuerySchema } from '../schemas/common';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// GET /api/prefixes/:prefixId/bgp
export class ListBgpPrefixes extends OpenAPIRoute {
  schema = {
    tags: ['BGP Prefixes'],
    summary: 'List BGP sub-prefixes',
    description: 'List all BGP sub-prefixes for a specific BYOIP prefix.',
    request: {
      params: z.object({ prefixId: z.string() }),
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'List of BGP sub-prefixes',
        ...contentJson(z.object({ bgp_prefixes: z.array(CfBgpPrefixSchema) })),
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
      const result = await listBgpPrefixes(acct.account_id, prefixId, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      return c.json({ bgp_prefixes: result.result || [] });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/prefixes/:prefixId/bgp
export class CreateBgpPrefix extends OpenAPIRoute {
  schema = {
    tags: ['BGP Prefixes'],
    summary: 'Create BGP child prefix',
    description: 'Create a new BGP sub-prefix under a BYOIP parent prefix.',
    request: {
      params: z.object({ prefixId: z.string() }),
      body: contentJson(CreateBgpPrefixRequestSchema),
    },
    responses: {
      '200': {
        description: 'BGP prefix created',
        ...contentJson(z.object({ ok: z.literal(true), bgp_prefix: CfBgpPrefixSchema })),
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
      const result = await createBgpPrefix(acct.account_id, prefixId, body.cidr, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }

      const bgpCreateDetails = `Child prefix ${body.cidr} created on prefix ${prefixId} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'create_bgp_prefix', bgpCreateDetails);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'create_bgp_prefix',
        title: body.cidr, details: bgpCreateDetails,
      });

      return c.json({ ok: true, bgp_prefix: result.result });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// DELETE /api/prefixes/:prefixId/bgp/:bgpPrefixId
export class DeleteBgpPrefix extends OpenAPIRoute {
  schema = {
    tags: ['BGP Prefixes'],
    summary: 'Delete BGP child prefix',
    description: 'Delete a BGP sub-prefix.',
    request: {
      params: z.object({
        prefixId: z.string(),
        bgpPrefixId: z.string(),
      }),
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'BGP prefix deleted',
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
    const { prefixId, bgpPrefixId } = data.params;
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await deleteBgpPrefix(acct.account_id, prefixId, bgpPrefixId, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }

      const bgpDeleteDetails = `Deleted BGP child prefix ${bgpPrefixId} on prefix ${prefixId} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'delete_bgp_prefix', bgpDeleteDetails);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'delete_bgp_prefix',
        title: bgpPrefixId, details: bgpDeleteDetails,
      });

      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/prefixes/:prefixId/bgp/:bgpPrefixId/toggle
export class ToggleBgpAdvertisement extends OpenAPIRoute {
  schema = {
    tags: ['BGP Prefixes'],
    summary: 'Toggle BGP advertisement',
    description: 'Advertise or withdraw a BGP sub-prefix. Uses the first token for write consistency.',
    request: {
      params: z.object({
        prefixId: z.string(),
        bgpPrefixId: z.string(),
      }),
      body: contentJson(ToggleBgpRequestSchema),
    },
    responses: {
      '200': {
        description: 'Advertisement toggled',
        ...contentJson(z.object({ ok: z.literal(true), bgp_prefix: CfBgpPrefixSchema })),
      },
      '400': {
        description: 'No account configured',
        ...contentJson(ErrorResponseSchema),
      },
      '409': {
        description: 'Advertisement state did not change (e.g. prefix is locked)',
        ...contentJson(z.object({ error: z.string(), bgp_prefix: CfBgpPrefixSchema })),
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
    const { prefixId, bgpPrefixId } = data.params;
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await toggleBgpAdvertisement(
        acct.account_id,
        prefixId,
        bgpPrefixId,
        body.advertised,
        token,
      );

      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }

      // Verify the advertisement state actually changed
      const actualState = result.result?.on_demand?.advertised;
      if (actualState !== undefined && actualState !== null && actualState !== body.advertised) {
        const reason = result.result?.on_demand?.on_demand_locked
          ? 'Prefix is locked — contact your Cloudflare account team to unlock'
          : 'Advertisement state did not change. This may be caused by auto_advertise_withdraw or insufficient token permissions.';
        return c.json({ error: reason, bgp_prefix: result.result }, 409);
      }

      const toggleCidr = result.result?.cidr || bgpPrefixId;
      const toggleAction = body.advertised ? 'advertise' : 'withdraw';
      const toggleDetails = `BGP prefix ${toggleCidr} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, toggleAction, toggleDetails);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: toggleAction,
        title: toggleCidr, details: toggleDetails,
      });

      return c.json({ ok: true, bgp_prefix: result.result });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}
