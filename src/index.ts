import { Hono } from 'hono';
import { fromHono } from 'chanfana';
import type { Env } from './types';
import { accessAuthMiddleware } from './auth';
import { renderDashboard } from './ui';
import { uploadLoaDocument } from './api';
import { getToken, resolveAccount } from './helpers';

// ─── Endpoint Imports ───────────────────────────────────────────────

import { ListAccounts, CreateAccount, DeleteAccount, SetDefaultAccount, TestToken } from './endpoints/settings';
import { ListPrefixes, CreatePrefix, GetPrefixStats, ValidateNewPrefix, UpdatePrefixDescription, ValidateExistingPrefix, BulkToggle } from './endpoints/prefixes';
import { ListBgpPrefixes, CreateBgpPrefix, DeleteBgpPrefix, ToggleBgpAdvertisement } from './endpoints/bgp';
import { ListBindings, CreateBinding, DeleteBinding } from './endpoints/bindings';
import { ListDelegations, CreateDelegationEndpoint, DeleteDelegationEndpoint, UpdateDelegationDescription } from './endpoints/delegations';
import { ListServicesEndpoint } from './endpoints/services';
import { ListRirCredentials, SaveRirCredentials, PatchRirCredentials, DeleteRirCredentials, ValidateRirCredentialsEndpoint, EnsureRoute, EnsureAutnum, DetectRir } from './endpoints/rir';
import { LookingGlass, RdapLookup, RpkiLookup, RipestatVisibility, GetActivity } from './endpoints/lookups';

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

const openapi = fromHono(app, {
  docs_url: '/api/docs',
  openapi_url: '/api/openapi.json',
  schema: {
    info: {
      title: 'Network Tools — BYOIP Prefix Manager API',
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
openapi.put('/api/settings/:id/default', SetDefaultAccount);
openapi.post('/api/test-token', TestToken);

// Prefixes
openapi.get('/api/prefixes', ListPrefixes);
openapi.post('/api/prefixes', CreatePrefix);
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

// ─── Export ─────────────────────────────────────────────────────────

export default {
  fetch: app.fetch,
};
