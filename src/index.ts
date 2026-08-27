import { Hono } from 'hono';
import { fromHono } from 'chanfana';
import type { Env } from './types';
import { accessAuthMiddleware } from './auth';
import { renderDashboard } from './ui';
import { uploadLoaDocument } from './api';
import { getToken, resolveAccount } from './helpers';

// ─── Endpoint Imports ───────────────────────────────────────────────

import { ListAccounts, CreateAccount, DeleteAccount, ClearAccountToken, SetDefaultAccount, TestToken } from './endpoints/settings';
import { ListPrefixes, CreatePrefix, BatchCreatePrefix, DeletePrefix, GetPrefixStats, ValidateNewPrefix, UpdatePrefixDescription, ValidateExistingPrefix, BulkToggle } from './endpoints/prefixes';
import { ListBgpPrefixes, CreateBgpPrefix, DeleteBgpPrefix, ToggleBgpAdvertisement } from './endpoints/bgp';
import { ListBindings, CreateBinding, DeleteBinding } from './endpoints/bindings';
import { ListDelegations, CreateDelegationEndpoint, DeleteDelegationEndpoint, UpdateDelegationDescription } from './endpoints/delegations';
import { ListServicesEndpoint } from './endpoints/services';
import { ListRirCredentials, SaveRirCredentials, PatchRirCredentials, DeleteRirCredentials, ValidateRirCredentialsEndpoint, EnsureRoute, EnsureAutnum, DetectRir } from './endpoints/rir';
import { LookingGlass, RdapLookup, RpkiLookup, RipestatVisibility, GetActivity } from './endpoints/lookups';
import {
  listChannels, createChannel, updateChannel, deleteChannel, testChannel,
  getSubscriptions, updateSubscription, listLog, retryLog,
} from './endpoints/notifications';
import { handleQueueBatch } from './queue';
import { pollAdvertisementChanges } from './poller';
import { apiKeyAuthMiddleware, webhookAuthMiddleware } from './machine-auth';
import { handleCloudflareWebhook, handleLogpushWebhook } from './webhooks';
import { listPrefixStates, lookupPrefixState, publicHealth } from './endpoints/public';
import {
  listApiKeys, createApiKey, deleteApiKey,
  listWebhookEndpoints, createWebhookEndpoint, deleteWebhookEndpoint,
  enableAuditLogpush, disableAuditLogpush, getAuditLogpushStatus,
} from './endpoints/integrations';
import type { NotifyMessage } from './types';

// ─── App Setup ──────────────────────────────────────────────────────

type AppEnv = { Bindings: Env; Variables: { userEmail: string } };

const app = new Hono<AppEnv>();

// Auth middleware
app.use('*', accessAuthMiddleware);

// Plain Hono routes (not in OpenAPI spec)
app.get('/health', (c) => c.text('OK'));
app.get('/api/me', (c) => c.json({ email: c.get('userEmail') }));

// LOA upload — multipart/form-data, kept as plain Hono route
app.post('/api/loa-upload', async (c) => {
  const email = c.get('userEmail');
  const formData = await c.req.formData();
  const accountId = formData.get('account_id') as string;
  const file = formData.get('loa_document') as File;

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'loa_document file is required' }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: 'File size exceeds 10MB limit' }, 400);
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return c.json({ error: 'Only PDF files are accepted' }, 400);
  }

  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const fileData = await file.arrayBuffer();
    const data = await uploadLoaDocument(acct.account_id, fileData, file.name, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'Upload failed' }, 502);
    }

    return c.json({ ok: true, loa_document: data.result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Upload failed' }, 400);
  }
});

// Dashboard
app.get('/', (c) => {
  const userEmail = c.get('userEmail');
  return c.html(renderDashboard(userEmail));
});

// ─── OpenAPI / Chanfana ─────────────────────────────────────────────

// Scalar API Reference — serves interactive docs with code snippets for 21+ languages
app.get('/api/docs', (c) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Prefix Manager — API Reference</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="https://www.cloudflare.com/favicon.ico" type="image/x-icon">
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.62.5"></script>
  <script>
    Scalar.createApiReference('#app', {
      url: '/api/openapi.json',
      theme: 'kepler',
      defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
    })
  </script>
</body>
</html>`;
  return c.html(html);
});

const openapi = fromHono(app, {
  docs_url: null,
  redoc_url: null,
  openapi_url: '/api/openapi.json',
  schema: {
    info: {
      title: 'Prefix Manager — BYOIP Prefix Manager API',
      version: '1.0.0',
      description: 'API for managing BYOIP (Bring Your Own IP) prefixes across Cloudflare accounts. Provides prefix lifecycle management, BGP advertisement control, service bindings, delegations, IRR/RPKI validation, and looking glass functionality.',
    },
    security: [{ cfAccessJwt: [] }],
  },
});

// Account Settings
openapi.get('/api/settings', ListAccounts);
openapi.post('/api/settings', CreateAccount);
openapi.delete('/api/settings/:id', DeleteAccount);
openapi.delete('/api/settings/:id/token', ClearAccountToken);
openapi.put('/api/settings/:id/default', SetDefaultAccount);
openapi.post('/api/test-token', TestToken);

// Prefixes
openapi.get('/api/prefixes', ListPrefixes);
openapi.post('/api/prefixes', CreatePrefix);
openapi.post('/api/prefixes/batch', BatchCreatePrefix);
openapi.delete('/api/prefixes/:prefixId', DeletePrefix);
openapi.get('/api/prefixes/stats', GetPrefixStats);
openapi.post('/api/prefixes/validate-new', ValidateNewPrefix);
openapi.patch('/api/prefixes/:prefixId/description', UpdatePrefixDescription);
openapi.post('/api/prefixes/:prefixId/validate', ValidateExistingPrefix);
openapi.post('/api/prefixes/bulk-toggle', BulkToggle);

// BGP Prefixes
openapi.get('/api/prefixes/:prefixId/bgp', ListBgpPrefixes);
openapi.post('/api/prefixes/:prefixId/bgp', CreateBgpPrefix);
openapi.delete('/api/prefixes/:prefixId/bgp/:bgpPrefixId', DeleteBgpPrefix);
openapi.post('/api/prefixes/:prefixId/bgp/:bgpPrefixId/toggle', ToggleBgpAdvertisement);

// Service Bindings
openapi.get('/api/prefixes/:prefixId/bindings', ListBindings);
openapi.post('/api/prefixes/:prefixId/bindings', CreateBinding);
openapi.delete('/api/prefixes/:prefixId/bindings/:bindingId', DeleteBinding);

// Delegations
openapi.get('/api/prefixes/:prefixId/delegations', ListDelegations);
openapi.post('/api/prefixes/:prefixId/delegations', CreateDelegationEndpoint);
openapi.delete('/api/prefixes/:prefixId/delegations/:delegationId', DeleteDelegationEndpoint);
openapi.put('/api/delegations/:delegationId/description', UpdateDelegationDescription);

// Services
openapi.get('/api/services', ListServicesEndpoint);

// RIR Credentials
openapi.get('/api/rir/credentials', ListRirCredentials);
openapi.post('/api/rir/credentials', SaveRirCredentials);
openapi.patch('/api/rir/credentials/:id', PatchRirCredentials);
openapi.delete('/api/rir/credentials/:id', DeleteRirCredentials);
openapi.post('/api/rir/credentials/validate', ValidateRirCredentialsEndpoint);

// RIR Operations
openapi.post('/api/rir/ensure-route', EnsureRoute);
openapi.post('/api/rir/ensure-autnum', EnsureAutnum);
openapi.get('/api/rir/detect', DetectRir);

// Lookups
openapi.post('/api/looking-glass', LookingGlass);
openapi.get('/api/rdap', RdapLookup);
openapi.get('/api/rpki', RpkiLookup);
openapi.get('/api/ripestat-visibility', RipestatVisibility);

// Activity
openapi.get('/api/activity', GetActivity);

// ─── Notifications (plain Hono routes) ──────────────────────────────

// Channels (per account)
app.get('/api/notifications/channels', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id') || '';
  if (!accountId) return c.json({ error: 'account_id is required' }, 400);
  return c.json({ channels: await listChannels(c.env, email, accountId) });
});
app.post('/api/notifications/channels', async (c) => {
  const email = c.get('userEmail');
  const res = await createChannel(c.env, email, await c.req.json());
  return c.json(res, res.ok ? 200 : 400);
});
app.put('/api/notifications/channels/:id', async (c) => {
  const email = c.get('userEmail');
  const res = await updateChannel(c.env, email, parseInt(c.req.param('id'), 10), await c.req.json());
  return c.json(res, res.ok ? 200 : 400);
});
app.delete('/api/notifications/channels/:id', async (c) => {
  const email = c.get('userEmail');
  return c.json(await deleteChannel(c.env, email, parseInt(c.req.param('id'), 10)));
});
app.post('/api/notifications/channels/:id/test', async (c) => {
  const email = c.get('userEmail');
  const res = await testChannel(c.env, email, parseInt(c.req.param('id'), 10));
  return c.json(res, res.ok ? 200 : 400);
});

// Subscriptions (event → channels, per account)
app.get('/api/notifications/subscriptions', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id') || '';
  if (!accountId) return c.json({ error: 'account_id is required' }, 400);
  return c.json(await getSubscriptions(c.env, email, accountId));
});
app.put('/api/notifications/subscriptions', async (c) => {
  const email = c.get('userEmail');
  const res = await updateSubscription(c.env, email, await c.req.json());
  return c.json(res, res.ok ? 200 : 400);
});

// Queue status log + retry
app.get('/api/notifications/log', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id') || undefined;
  return c.json({ log: await listLog(c.env, email, accountId) });
});
app.post('/api/notifications/log/:id/retry', async (c) => {
  const email = c.get('userEmail');
  const res = await retryLog(c.env, email, parseInt(c.req.param('id'), 10));
  return c.json(res, res.ok ? 200 : 400);
});

// ─── Integrations: API keys & inbound webhook endpoints (CF Access) ──

app.get('/api/integrations/api-keys', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id') || '';
  if (!accountId) return c.json({ error: 'account_id is required' }, 400);
  return c.json({ keys: await listApiKeys(c.env, email, accountId) });
});
app.post('/api/integrations/api-keys', async (c) => {
  const email = c.get('userEmail');
  const res = await createApiKey(c.env, email, await c.req.json());
  return c.json(res, res.ok ? 200 : 400);
});
app.delete('/api/integrations/api-keys/:id', async (c) => {
  const email = c.get('userEmail');
  return c.json(await deleteApiKey(c.env, email, parseInt(c.req.param('id'), 10)));
});

app.get('/api/integrations/webhooks', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id') || '';
  if (!accountId) return c.json({ error: 'account_id is required' }, 400);
  return c.json({ webhooks: await listWebhookEndpoints(c.env, email, accountId) });
});
app.post('/api/integrations/webhooks', async (c) => {
  const email = c.get('userEmail');
  const res = await createWebhookEndpoint(c.env, email, await c.req.json());
  return c.json(res, res.ok ? 200 : 400);
});
app.delete('/api/integrations/webhooks/:id', async (c) => {
  const email = c.get('userEmail');
  return c.json(await deleteWebhookEndpoint(c.env, email, parseInt(c.req.param('id'), 10)));
});

app.get('/api/integrations/logpush', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id') || '';
  const res = await getAuditLogpushStatus(c.env, email, accountId);
  return c.json(res, res.ok ? 200 : 400);
});
app.post('/api/integrations/logpush', async (c) => {
  const email = c.get('userEmail');
  const origin = new URL(c.req.url).origin;
  const res = await enableAuditLogpush(c.env, email, await c.req.json(), origin);
  return c.json(res, res.ok ? 200 : 400);
});
app.delete('/api/integrations/logpush', async (c) => {
  const email = c.get('userEmail');
  const res = await disableAuditLogpush(c.env, email, await c.req.json());
  return c.json(res, res.ok ? 200 : 400);
});

// ─── Machine-facing routes (own auth, CF Access bypassed in auth.ts) ──

type MachineEnv = {
  Bindings: Env;
  Variables: { account_id: string; owner_email: string; scopes: string[] };
};

// Prefix-state Query API — per-account API-key (Bearer) auth.
const publicApi = new Hono<MachineEnv>();
publicApi.use('*', apiKeyAuthMiddleware);
publicApi.get('/health', publicHealth);
publicApi.get('/prefixes', listPrefixStates);
publicApi.get('/prefixes/lookup', lookupPrefixState);
app.route('/api/public/v1', publicApi);

// Inbound Cloudflare notification webhooks — cf-webhook-auth secret validation.
const webhooksApi = new Hono<MachineEnv>();
webhooksApi.use('*', webhookAuthMiddleware);
webhooksApi.post('/cloudflare', handleCloudflareWebhook);
webhooksApi.post('/logpush', handleLogpushWebhook);
app.route('/webhooks', webhooksApi);

// ─── Export ─────────────────────────────────────────────────────────

export default {
  fetch: app.fetch,

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      try {
        const res = await pollAdvertisementChanges(env);
        console.log(`Radar poll: ${res.checked} checked, ${res.errors.length} errors`);
        if (res.errors.length) console.error('Poll errors:', res.errors.slice(0, 10).join('; '));
      } catch (err) {
        console.error('pollAdvertisementChanges failed:', err);
      }
    })());
  },

  async queue(batch: MessageBatch<NotifyMessage>, env: Env) {
    await handleQueueBatch(batch, env);
  },
};
