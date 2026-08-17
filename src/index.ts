import { Hono } from 'hono';
import type { Env, UserAccount } from './types';
import { accessAuthMiddleware } from './auth';
import { renderDashboard } from './ui';
import {
  listPrefixes,
  listBgpPrefixes,
  listServiceBindings,
  listServices,
  createServiceBinding,
  deleteServiceBinding,
  createBgpPrefix,
  deleteBgpPrefix,
  toggleBgpAdvertisement,
  updatePrefixDescription,
  validatePrefix,
  verifyTokenPermissions,
  lookupBgpRoutes,
  lookupRpki,
  lookupRdap,
  lookupRipestatVisibility,
  listDelegations,
  createDelegation,
  deleteDelegation,
  createPrefix,
  uploadLoaDocument,
  lookupIrrRecords,
  lookupIrrExplorer,
  createArinRouteObject,
  createRipeRouteObject,
  updateArinAutnum,
  updateRipeAutnum,
  normalizeRirName,
} from './api';

type AppEnv = { Bindings: Env; Variables: { userEmail: string } };

const app = new Hono<AppEnv>();

// Auth middleware
app.use('*', accessAuthMiddleware);

// Health check
app.get('/health', (c) => c.text('OK'));

// User info
app.get('/api/me', (c) => c.json({ email: c.get('userEmail') }));

// ─── Token Helper ───────────────────────────────────────────────────

// Get the API token for an account
async function getToken(db: D1Database, email: string, accountId: string): Promise<string> {
  const row = await db
    .prepare('SELECT api_token FROM user_accounts WHERE user_email = ? AND account_id = ?')
    .bind(email, accountId)
    .first<{ api_token: string }>();

  if (!row?.api_token) {
    throw new Error('No API token configured for this account');
  }
  return row.api_token;
}

// Helper: log activity
async function logActivity(db: D1Database, email: string, action: string, details: string) {
  try {
    await db
      .prepare('INSERT INTO activity_log (user_email, action, details) VALUES (?, ?, ?)')
      .bind(email, action, details)
      .run();
    // Prune entries older than 180 days
    await db
      .prepare("DELETE FROM activity_log WHERE created_at < datetime('now', '-180 days')")
      .run();
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}

// Helper: resolve account by account_id param or default
async function resolveAccount(
  db: D1Database,
  email: string,
  accountId?: string,
): Promise<UserAccount | null> {
  if (accountId) {
    return db
      .prepare('SELECT * FROM user_accounts WHERE user_email = ? AND account_id = ?')
      .bind(email, accountId)
      .first<UserAccount>();
  }
  const def = await db
    .prepare('SELECT * FROM user_accounts WHERE user_email = ? AND is_default = 1')
    .bind(email)
    .first<UserAccount>();
  if (def) return def;
  return db
    .prepare('SELECT * FROM user_accounts WHERE user_email = ? ORDER BY id ASC LIMIT 1')
    .bind(email)
    .first<UserAccount>();
}

// Mask API token for display
function maskToken(token: string): string {
  if (!token || token.length < 8) return '••••••••';
  return token.slice(0, 4) + '••••' + token.slice(-4);
}

// ─── Account Settings ───────────────────────────────────────────────

// List accounts
app.get('/api/settings', async (c) => {
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
    updated_at: r.updated_at,
  }));
  return c.json({ accounts });
});

// Add / update account
app.post('/api/settings', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{
    account_label: string;
    account_id: string;
    api_token?: string;
  }>();

  if (!body.account_id) {
    return c.json({ error: 'account_id is required' }, 400);
  }

  // Upsert
  const existing = await c.env.DB.prepare(
    'SELECT id FROM user_accounts WHERE user_email = ? AND account_id = ?',
  )
    .bind(email, body.account_id)
    .first<{ id: number }>();

  if (existing) {
    if (body.api_token) {
      await c.env.DB.prepare(
        `UPDATE user_accounts SET account_label = ?, api_token = ?, updated_at = datetime('now')
         WHERE id = ? AND user_email = ?`,
      )
        .bind(body.account_label || '', body.api_token, existing.id, email)
        .run();
    } else {
      await c.env.DB.prepare(
        `UPDATE user_accounts SET account_label = ?, updated_at = datetime('now')
         WHERE id = ? AND user_email = ?`,
      )
        .bind(body.account_label || '', existing.id, email)
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
      `INSERT INTO user_accounts (user_email, account_label, account_id, api_token, is_default)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(email, body.account_label || '', body.account_id, body.api_token || '', isDefault)
      .run();
  }

  return c.json({ ok: true });
});

// Delete account
app.delete('/api/settings/:id', async (c) => {
  const email = c.get('userEmail');
  const id = parseInt(c.req.param('id'), 10);

  const row = await c.env.DB.prepare(
    'SELECT * FROM user_accounts WHERE id = ? AND user_email = ?',
  )
    .bind(id, email)
    .first<UserAccount>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  await c.env.DB.prepare('DELETE FROM user_accounts WHERE id = ? AND user_email = ?')
    .bind(id, email)
    .run();

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
});

// Set default account
app.put('/api/settings/:id/default', async (c) => {
  const email = c.get('userEmail');
  const id = parseInt(c.req.param('id'), 10);

  await c.env.DB.prepare('UPDATE user_accounts SET is_default = 0 WHERE user_email = ?')
    .bind(email)
    .run();
  await c.env.DB.prepare(
    'UPDATE user_accounts SET is_default = 1 WHERE id = ? AND user_email = ?',
  )
    .bind(id, email)
    .run();

  return c.json({ ok: true });
});

// Test token permissions
app.post('/api/test-token', async (c) => {
  const body = await c.req.json<{ account_id: string; api_token: string }>();
  if (!body.account_id || !body.api_token) {
    return c.json({ error: 'account_id and api_token required' }, 400);
  }
  const results = await verifyTokenPermissions(body.account_id, body.api_token);
  return c.json({ results });
});

// ─── Prefix Data ────────────────────────────────────────────────────

// List all BYOIP prefixes for the active account
app.get('/api/prefixes', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id');
  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await listPrefixes(acct.account_id, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }
    return c.json({ prefixes: data.result || [], account_id: acct.account_id });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// Create a new BYOIP prefix
app.post('/api/prefixes', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{
    cidr: string;
    asn: number;
    delegate_loa_creation: boolean;
    description?: string;
    loa_document_id?: string;
    account_id?: string;
  }>();
  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  if (!body.cidr || !body.asn) {
    return c.json({ error: 'cidr and asn are required' }, 400);
  }

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await createPrefix(
      acct.account_id,
      body.cidr,
      body.asn,
      body.delegate_loa_creation ?? true,
      token,
      body.description,
      body.loa_document_id,
    );
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }

    await logActivity(
      c.env.DB,
      email,
      'create_prefix',
      `Created prefix ${body.cidr} (ASN ${body.asn}) in account ${acct.account_id}`,
    );

    return c.json({ ok: true, prefix: data.result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// Upload LOA document
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

// Pre-submission prefix validation (IRR + ROA checks)
app.post('/api/prefixes/validate-new', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{ cidr: string; asn: number; account_id?: string }>();
  if (!body.cidr || !body.asn) {
    return c.json({ error: 'cidr and asn are required' }, 400);
  }

  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);

    // Run all validation checks in parallel
    const [rpkiResult, irrResult, irrExplorerResult] = await Promise.allSettled([
      lookupRpki(body.cidr, token),
      lookupIrrRecords(body.cidr),
      lookupIrrExplorer(body.cidr),
    ]);

    // Process ROA/RPKI results
    const roa = { found: false, matching_asn: false, origins: [] as Array<{ asn: number; rpki_status: string; peer_count: number }> };
    if (rpkiResult.status === 'fulfilled' && rpkiResult.value.prefix_origins.length > 0) {
      roa.found = true;
      roa.origins = rpkiResult.value.prefix_origins.map((po) => ({
        asn: po.origin,
        rpki_status: po.rpki_validation || 'unknown',
        peer_count: po.peer_count,
      }));
      roa.matching_asn = roa.origins.some((o) => o.asn === body.asn);
    }

    // Process IRR results (RIPEstat)
    const irr = { found: false, matching_asn: false, records: [] as Array<{ source: string; prefix: string; origin: string }>, databases: [] as string[] };
    if (irrResult.status === 'fulfilled' && irrResult.value.records.length > 0) {
      irr.found = true;
      irr.records = irrResult.value.records;
      irr.databases = [...new Set(irrResult.value.records.map((r) => r.source).filter(Boolean))];
      irr.matching_asn = irr.records.some((r) => {
        const asnStr = r.origin.replace(/^AS/i, '');
        return parseInt(asnStr, 10) === body.asn;
      });
    }

    // Process IRR Explorer results
    const irrExplorer = { found: false, matching_asn: false, prefixes: [] as typeof irrExplorerParsed, error: undefined as string | undefined };
    let irrExplorerParsed: Array<{ prefix: string; bgp_origins: number[]; irr_origins: number[]; rpki_origins: number[]; irr_sources: string[]; rpki_status: string }> = [];
    if (irrExplorerResult.status === 'fulfilled') {
      irrExplorerParsed = irrExplorerResult.value.prefixes;
      if (irrExplorerParsed.length > 0) {
        irrExplorer.found = true;
        irrExplorer.prefixes = irrExplorerParsed;
        irrExplorer.matching_asn = irrExplorerParsed.some((p) =>
          p.irr_origins.includes(body.asn),
        );
      }
    } else {
      irrExplorer.error = 'IRR Explorer lookup failed';
    }

    // Build summary
    const warnings: string[] = [];
    const errors: string[] = [];
    const isCloudflareAsn = body.asn === 13335;

    if (isCloudflareAsn) {
      if (!roa.found) {
        warnings.push('No ROA records found for this prefix. Cloudflare will manage ROA records for ASN 13335.');
      }
      if (!irr.found && !irrExplorer.found) {
        warnings.push('No IRR records found for this prefix. Cloudflare will manage IRR records for ASN 13335.');
      }
    } else {
      // BYO-ASN — require valid IRR, ROA, and will need ownership + ASN ownership validation post-creation
      if (!roa.found) {
        errors.push('No ROA records found. A valid ROA authorizing your ASN to originate this prefix is required. Create a ROA at your RIR or via the Cloudflare RPKI Portal.');
      } else if (!roa.matching_asn) {
        errors.push(`ROA found but origin ASN does not match ${body.asn}. Update your ROA to include AS${body.asn}.`);
      }

      if (!irr.found && !irrExplorer.found) {
        errors.push('No IRR records found. An exact route/route6 object with your ASN as the origin is required. Create one at your RIR or an IRR database (e.g., RADB).');
      } else if (!irr.matching_asn && !irrExplorer.matching_asn) {
        errors.push(`IRR record found but origin ASN does not match ${body.asn}. Update your IRR route object to reference AS${body.asn}.`);
      }

      // Remind about aut-num requirement
      warnings.push('BYO-ASN: After creating the prefix, you will need to publish the validation token in both the route/route6 object AND your aut-num object at the authoritative RIR.');
    }

    const ready = errors.length === 0;

    return c.json({
      result: {
        roa,
        irr,
        irr_explorer: irrExplorer,
        summary: { ready, warnings, errors },
      },
    });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Validation failed' }, 400);
  }
});

// Aggregated prefix stats (parent + BGP children)
app.get('/api/prefixes/stats', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id');
  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const prefixData = await listPrefixes(acct.account_id, token);
    if (!prefixData.success) {
      return c.json({ error: prefixData.errors?.[0]?.message || 'API error' }, 502);
    }
    const prefixes = prefixData.result || [];

    // Fetch BGP sub-prefixes for all parents in parallel
    const bgpResults = await Promise.all(
      prefixes.map(async (p) => {
        try {
          const bgpData = await listBgpPrefixes(acct.account_id, p.id, token);
          return bgpData.success ? (bgpData.result || []) : [];
        } catch {
          return [];
        }
      }),
    );

    const allBgpPrefixes = bgpResults.flat();

    // Per-prefix child advertisement summary for filtering
    const perPrefix: Record<string, { has_advertised_child: boolean; has_withdrawn_child: boolean }> = {};
    for (let i = 0; i < prefixes.length; i++) {
      const children = bgpResults[i];
      perPrefix[prefixes[i].id] = {
        has_advertised_child: children.some((bp) => bp.on_demand?.advertised === true),
        has_withdrawn_child: children.some((bp) => bp.on_demand?.advertised === false),
      };
    }

    const stats = {
      parent: {
        total: prefixes.length,
        advertised: prefixes.filter((p) => p.advertised === true).length,
        withdrawn: prefixes.filter((p) => p.advertised === false).length,
        locked: prefixes.filter((p) => p.on_demand_locked === true).length,
      },
      bgp: {
        total: allBgpPrefixes.length,
        advertised: allBgpPrefixes.filter((bp) => bp.on_demand?.advertised === true).length,
        withdrawn: allBgpPrefixes.filter((bp) => bp.on_demand?.advertised === false).length,
      },
      irr: {
        valid: prefixes.filter((p) => p.irr_validation_state?.toLowerCase() === 'valid').length,
        invalid: prefixes.filter((p) => ['invalid', 'mismatch_asn', 'missing'].includes(p.irr_validation_state?.toLowerCase())).length,
        pending: prefixes.filter((p) => p.irr_validation_state?.toLowerCase() === 'pending').length,
      },
      rpki: {
        valid: prefixes.filter((p) => p.rpki_validation_state?.toLowerCase() === 'valid').length,
        invalid: prefixes.filter((p) => ['invalid', 'mismatch_asn', 'missing'].includes(p.rpki_validation_state?.toLowerCase())).length,
        pending: prefixes.filter((p) => p.rpki_validation_state?.toLowerCase() === 'pending').length,
      },
      per_prefix: perPrefix,
    };

    return c.json({ stats });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// List BGP sub-prefixes for a specific prefix
app.get('/api/prefixes/:prefixId/bgp', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id');
  const prefixId = c.req.param('prefixId');
  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await listBgpPrefixes(acct.account_id, prefixId, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }
    return c.json({ bgp_prefixes: data.result || [] });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// Create a BGP child prefix
app.post('/api/prefixes/:prefixId/bgp', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{ cidr: string; account_id?: string }>();
  const prefixId = c.req.param('prefixId');
  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  if (!body.cidr) {
    return c.json({ error: 'cidr is required' }, 400);
  }

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await createBgpPrefix(acct.account_id, prefixId, body.cidr, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }

    await logActivity(
      c.env.DB,
      email,
      'create_bgp_prefix',
      `Child prefix ${body.cidr} created on prefix ${prefixId} in account ${acct.account_id}`,
    );

    return c.json({ ok: true, bgp_prefix: data.result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// Delete a BGP child prefix
app.delete('/api/prefixes/:prefixId/bgp/:bgpPrefixId', async (c) => {
  const email = c.get('userEmail');
  const prefixId = c.req.param('prefixId');
  const bgpPrefixId = c.req.param('bgpPrefixId');
  const accountId = c.req.query('account_id');
  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await deleteBgpPrefix(acct.account_id, prefixId, bgpPrefixId, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }

    await logActivity(
      c.env.DB,
      email,
      'delete_bgp_prefix',
      `Deleted BGP child prefix ${bgpPrefixId} on prefix ${prefixId} in account ${acct.account_id}`,
    );

    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// List service bindings for a specific prefix
app.get('/api/prefixes/:prefixId/bindings', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id');
  const prefixId = c.req.param('prefixId');
  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await listServiceBindings(acct.account_id, prefixId, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }
    return c.json({ bindings: data.result || [] });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// Create a service binding for a prefix
app.post('/api/prefixes/:prefixId/bindings', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{ cidr: string; service_id: string; account_id?: string }>();
  const prefixId = c.req.param('prefixId');
  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  if (!body.cidr || !body.service_id) {
    return c.json({ error: 'cidr and service_id are required' }, 400);
  }

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await createServiceBinding(acct.account_id, prefixId, body.cidr, body.service_id, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }

    await logActivity(
      c.env.DB,
      email,
      'create_binding',
      `Service binding ${body.cidr} → ${data.result?.service_name || body.service_id} on prefix ${prefixId} in account ${acct.account_id}`,
    );

    return c.json({ ok: true, binding: data.result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// Delete a service binding for a prefix
app.delete('/api/prefixes/:prefixId/bindings/:bindingId', async (c) => {
  const email = c.get('userEmail');
  const prefixId = c.req.param('prefixId');
  const bindingId = c.req.param('bindingId');
  const accountId = c.req.query('account_id');
  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await deleteServiceBinding(acct.account_id, prefixId, bindingId, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
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
});

// ─── Prefix Delegations ─────────────────────────────────────────────

// List delegations for a specific prefix
app.get('/api/prefixes/:prefixId/delegations', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id');
  const prefixId = c.req.param('prefixId');
  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await listDelegations(acct.account_id, prefixId, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }

    // Enrich delegations with locally stored descriptions
    const delegations = data.result || [];
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
});

// Create a delegation for a prefix
app.post('/api/prefixes/:prefixId/delegations', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{ cidr: string; delegated_account_id: string; description?: string; account_id?: string }>();
  const prefixId = c.req.param('prefixId');
  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  if (!body.cidr || !body.delegated_account_id) {
    return c.json({ error: 'cidr and delegated_account_id are required' }, 400);
  }

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await createDelegation(acct.account_id, prefixId, body.cidr, body.delegated_account_id, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }

    // Store local description if provided
    if (body.description && data.result?.id) {
      await c.env.DB.prepare(
        `INSERT INTO delegation_descriptions (delegation_id, account_id, description) VALUES (?, ?, ?)`,
      )
        .bind(data.result.id, acct.account_id, body.description)
        .run();
    }

    await logActivity(
      c.env.DB,
      email,
      'create_delegation',
      `Delegated ${body.cidr} to account ${body.delegated_account_id} on prefix ${prefixId} in account ${acct.account_id}`,
    );

    return c.json({ ok: true, delegation: data.result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// Delete a delegation for a prefix
app.delete('/api/prefixes/:prefixId/delegations/:delegationId', async (c) => {
  const email = c.get('userEmail');
  const prefixId = c.req.param('prefixId');
  const delegationId = c.req.param('delegationId');
  const accountId = c.req.query('account_id');
  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await deleteDelegation(acct.account_id, prefixId, delegationId, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
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
});

// Update a delegation's local description
app.put('/api/delegations/:delegationId/description', async (c) => {
  const email = c.get('userEmail');
  const delegationId = c.req.param('delegationId');
  const body = await c.req.json<{ description: string; account_id?: string }>();
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
});

// List available services
app.get('/api/services', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id');
  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await listServices(acct.account_id, token);
    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }
    return c.json({ services: data.result || [] });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// ─── Actions ────────────────────────────────────────────────────────

// Toggle BGP prefix advertisement (uses first token for writes)
app.post('/api/prefixes/:prefixId/bgp/:bgpPrefixId/toggle', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{ advertised: boolean; account_id?: string }>();
  const prefixId = c.req.param('prefixId');
  const bgpPrefixId = c.req.param('bgpPrefixId');
  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await toggleBgpAdvertisement(
      acct.account_id,
      prefixId,
      bgpPrefixId,
      body.advertised,
      token,
    );

    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }

    // Verify the advertisement state actually changed
    const actualState = data.result?.on_demand?.advertised;
    if (actualState !== undefined && actualState !== null && actualState !== body.advertised) {
      const reason = data.result?.on_demand?.on_demand_locked
        ? 'Prefix is locked — contact your Cloudflare account team to unlock'
        : 'Advertisement state did not change. This may be caused by auto_advertise_withdraw or insufficient token permissions.';
      return c.json({ error: reason, bgp_prefix: data.result }, 409);
    }

    await logActivity(
      c.env.DB,
      email,
      body.advertised ? 'advertise' : 'withdraw',
      `BGP prefix ${data.result?.cidr || bgpPrefixId} in account ${acct.account_id}`,
    );

    return c.json({ ok: true, bgp_prefix: data.result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// Update prefix description
app.patch('/api/prefixes/:prefixId/description', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{ description: string; account_id?: string }>();
  const prefixId = c.req.param('prefixId');
  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await updatePrefixDescription(acct.account_id, prefixId, body.description ?? '', token);

    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'API error' }, 502);
    }

    await logActivity(
      c.env.DB,
      email,
      'update_description',
      `Updated description for prefix ${data.result?.cidr || prefixId} in account ${acct.account_id}`,
    );

    return c.json({ ok: true, prefix: data.result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// Bulk toggle BGP advertisement for multiple prefixes
app.post('/api/prefixes/bulk-toggle', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{ prefix_ids: string[]; advertised: boolean; account_id?: string }>();
  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  if (!body.prefix_ids || body.prefix_ids.length === 0) {
    return c.json({ error: 'prefix_ids array is required' }, 400);
  }

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const results: Array<{
      prefix_id: string;
      cidr: string;
      toggled: number;
      skipped: number;
      errors: string[];
    }> = [];

    for (const prefixId of body.prefix_ids) {
      const result = { prefix_id: prefixId, cidr: '', toggled: 0, skipped: 0, errors: [] as string[] };

      try {
        // Fetch BGP sub-prefixes for this prefix
        const bgpData = await listBgpPrefixes(acct.account_id, prefixId, token);
        if (!bgpData.success || !bgpData.result) {
          result.errors.push(bgpData.errors?.[0]?.message || 'Failed to fetch BGP prefixes');
          results.push(result);
          continue;
        }

        for (const bp of bgpData.result) {
          if (!result.cidr && bp.cidr) result.cidr = bp.cidr;

          if (bp.on_demand?.on_demand_locked) {
            result.skipped++;
            continue;
          }

          // Skip if already in desired state
          if (bp.on_demand?.advertised === body.advertised) {
            result.skipped++;
            continue;
          }

          try {
            const toggleData = await toggleBgpAdvertisement(
              acct.account_id,
              prefixId,
              bp.id,
              body.advertised,
              token,
            );
            if (toggleData.success) {
              result.toggled++;
            } else {
              result.errors.push(
                `${bp.cidr}: ${toggleData.errors?.[0]?.message || 'Toggle failed'}`,
              );
            }
          } catch (err) {
            result.errors.push(`${bp.cidr}: ${err instanceof Error ? err.message : 'Toggle failed'}`);
          }
        }
      } catch (err) {
        result.errors.push(err instanceof Error ? err.message : 'Failed to process prefix');
      }

      results.push(result);
    }

    // Log activity
    const action = body.advertised ? 'bulk_advertise' : 'bulk_withdraw';
    const totalToggled = results.reduce((sum, r) => sum + r.toggled, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    await logActivity(
      c.env.DB,
      email,
      action,
      `Bulk ${body.advertised ? 'advertise' : 'withdraw'}: ${totalToggled} toggled, ${totalSkipped} skipped across ${body.prefix_ids.length} prefixes in account ${acct.account_id}`,
    );

    return c.json({ ok: true, results });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// ─── Prefix Validation ──────────────────────────────────────────────

// Trigger re-validation of a prefix (RPKI, IRR, ownership)
app.post('/api/prefixes/:prefixId/validate', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{ account_id?: string }>();
  const prefixId = c.req.param('prefixId');
  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const data = await validatePrefix(acct.account_id, prefixId, token);

    if (!data.success) {
      return c.json({ error: data.errors?.[0]?.message || 'Validation API error' }, 502);
    }

    await logActivity(
      c.env.DB,
      email,
      'validate',
      `Re-validated prefix ${data.result?.cidr || prefixId} in account ${acct.account_id}`,
    );

    return c.json({ ok: true, prefix: data.result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
  }
});

// ─── RIR Credentials ────────────────────────────────────────────────

// List saved RIR credentials (masked)
app.get('/api/rir/credentials', async (c) => {
  const email = c.get('userEmail') as string;
  const accountId = c.req.query('account_id');
  if (!accountId) return c.json({ error: 'account_id required' }, 400);

  await c.env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS rir_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      account_id TEXT NOT NULL,
      rir TEXT NOT NULL,
      api_key TEXT NOT NULL DEFAULT '',
      maintainer TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_email, account_id, rir)
    )`,
  ).run();

  const rows = await c.env.DB.prepare(
    'SELECT id, rir, api_key, maintainer, updated_at FROM rir_credentials WHERE user_email = ? AND account_id = ?',
  )
    .bind(email, accountId)
    .all<{ id: number; rir: string; api_key: string; maintainer: string; updated_at: string }>();

  const masked = (rows.results || []).map((r) => ({
    ...r,
    api_key: r.api_key ? '••••' + r.api_key.slice(-4) : '',
  }));

  return c.json({ credentials: masked });
});

// Save/update RIR credentials
app.post('/api/rir/credentials', async (c) => {
  const email = c.get('userEmail') as string;
  const body = await c.req.json<{
    account_id: string;
    rir: string;
    api_key: string;
    maintainer?: string;
  }>();

  if (!body.account_id || !body.rir || !body.api_key) {
    return c.json({ error: 'account_id, rir, and api_key are required' }, 400);
  }

  const rir = body.rir.toLowerCase();
  if (rir !== 'arin' && rir !== 'ripe') {
    return c.json({ error: 'rir must be "arin" or "ripe"' }, 400);
  }

  await c.env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS rir_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      account_id TEXT NOT NULL,
      rir TEXT NOT NULL,
      api_key TEXT NOT NULL DEFAULT '',
      maintainer TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_email, account_id, rir)
    )`,
  ).run();

  await c.env.DB.prepare(
    `INSERT INTO rir_credentials (user_email, account_id, rir, api_key, maintainer)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_email, account_id, rir)
     DO UPDATE SET api_key = excluded.api_key, maintainer = excluded.maintainer, updated_at = datetime('now')`,
  )
    .bind(email, body.account_id, rir, body.api_key, body.maintainer || '')
    .run();

  return c.json({ ok: true });
});

// Delete RIR credentials
app.delete('/api/rir/credentials/:id', async (c) => {
  const email = c.get('userEmail') as string;
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM rir_credentials WHERE id = ? AND user_email = ?')
    .bind(id, email)
    .run();

  return c.json({ ok: true });
});

// ─── RIR Route Object Management ───────────────────────────────────

// Create route/route6 object at ARIN or RIPE
app.post('/api/rir/create-route', async (c) => {
  const email = c.get('userEmail') as string;
  const body = await c.req.json<{
    account_id: string;
    prefix: string;
    origin_asn: number;
    validation_token: string;
    rir: string;
    api_key?: string;
    maintainer?: string;
  }>();

  if (!body.account_id || !body.prefix || !body.origin_asn || !body.validation_token || !body.rir) {
    return c.json({ error: 'account_id, prefix, origin_asn, validation_token, and rir are required' }, 400);
  }

  const rir = body.rir.toLowerCase();
  if (rir !== 'arin' && rir !== 'ripe') {
    return c.json({ error: 'Automated route creation is only supported for ARIN and RIPE' }, 400);
  }

  // Use provided credentials or look up stored ones
  let apiKey = body.api_key || '';
  let maintainer = body.maintainer || '';

  if (!apiKey) {
    const stored = await c.env.DB.prepare(
      'SELECT api_key, maintainer FROM rir_credentials WHERE user_email = ? AND account_id = ? AND rir = ?',
    )
      .bind(email, body.account_id, rir)
      .first<{ api_key: string; maintainer: string }>();

    if (!stored?.api_key) {
      return c.json({ error: `No ${rir.toUpperCase()} credentials found. Provide api_key or save credentials in Settings.` }, 400);
    }
    apiKey = stored.api_key;
    if (!maintainer && stored.maintainer) maintainer = stored.maintainer;
  }

  let result;
  if (rir === 'arin') {
    result = await createArinRouteObject(body.prefix, body.origin_asn, body.validation_token, apiKey);
  } else {
    if (!maintainer) {
      return c.json({ error: 'RIPE requires a maintainer (mnt-by). Provide maintainer or save it in Settings.' }, 400);
    }
    result = await createRipeRouteObject(body.prefix, body.origin_asn, body.validation_token, apiKey, maintainer);
  }

  if (result.ok) {
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_email, action, details) VALUES (?, ?, ?)`,
    )
      .bind(email, 'rir_create_route', `Created ${body.prefix.includes(':') ? 'route6' : 'route'} at ${rir.toUpperCase()} for ${body.prefix} AS${body.origin_asn}`)
      .run();
  }

  return c.json(result);
});

// Update aut-num object at ARIN or RIPE (add validation token)
app.post('/api/rir/update-autnum', async (c) => {
  const email = c.get('userEmail') as string;
  const body = await c.req.json<{
    account_id: string;
    asn: number;
    validation_token: string;
    rir: string;
    api_key?: string;
    maintainer?: string;
  }>();

  if (!body.account_id || !body.asn || !body.validation_token || !body.rir) {
    return c.json({ error: 'account_id, asn, validation_token, and rir are required' }, 400);
  }

  const rir = body.rir.toLowerCase();
  if (rir !== 'arin' && rir !== 'ripe') {
    return c.json({ error: 'Automated aut-num update is only supported for ARIN and RIPE' }, 400);
  }

  let apiKey = body.api_key || '';
  let maintainer = body.maintainer || '';

  if (!apiKey) {
    const stored = await c.env.DB.prepare(
      'SELECT api_key, maintainer FROM rir_credentials WHERE user_email = ? AND account_id = ? AND rir = ?',
    )
      .bind(email, body.account_id, rir)
      .first<{ api_key: string; maintainer: string }>();

    if (!stored?.api_key) {
      return c.json({ error: `No ${rir.toUpperCase()} credentials found. Provide api_key or save credentials in Settings.` }, 400);
    }
    apiKey = stored.api_key;
    if (!maintainer && stored.maintainer) maintainer = stored.maintainer;
  }

  let result;
  if (rir === 'arin') {
    result = await updateArinAutnum(body.asn, body.validation_token, apiKey);
  } else {
    result = await updateRipeAutnum(body.asn, body.validation_token, apiKey, maintainer);
  }

  if (result.ok) {
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_email, action, details) VALUES (?, ?, ?)`,
    )
      .bind(email, 'rir_update_autnum', `Updated aut-num at ${rir.toUpperCase()} for AS${body.asn}`)
      .run();
  }

  return c.json(result);
});

// Detect RIR for a prefix via RDAP
app.get('/api/rir/detect', async (c) => {
  const prefix = c.req.query('prefix');
  if (!prefix) return c.json({ error: 'prefix query param required' }, 400);

  try {
    const rdap = await lookupRdap(prefix);
    const rir = normalizeRirName(rdap.rir);
    return c.json({ rir, rir_name: rdap.rir, supported: rir === 'arin' || rir === 'ripe' });
  } catch {
    return c.json({ rir: null, supported: false, error: 'Could not detect RIR' });
  }
});

// ─── Looking Glass ──────────────────────────────────────────────────

app.post('/api/looking-glass', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{ prefix: string; account_id?: string }>();
  if (!body.prefix) {
    return c.json({ error: 'prefix is required' }, 400);
  }

  const acct = await resolveAccount(c.env.DB, email, body.account_id);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const result = await lookupBgpRoutes(body.prefix, token);
    return c.json({ result });
  } catch (e) {
    console.error('Looking glass error:', e);
    return c.json({ error: 'Failed to fetch BGP routes' }, 502);
  }
});

// ─── RDAP / Whois Lookup ────────────────────────────────────────────

app.get('/api/rdap', async (c) => {
  const prefix = c.req.query('prefix');
  if (!prefix) return c.json({ error: 'prefix is required' }, 400);

  try {
    const result = await lookupRdap(prefix);
    return c.json({ result });
  } catch (e) {
    console.error('RDAP lookup error:', e);
    return c.json({ error: 'RDAP lookup failed' }, 502);
  }
});

// ─── RPKI ROA Lookup ────────────────────────────────────────────────

app.get('/api/rpki', async (c) => {
  const email = c.get('userEmail');
  const prefix = c.req.query('prefix');
  const accountId = c.req.query('account_id');
  if (!prefix) return c.json({ error: 'prefix is required' }, 400);

  const acct = await resolveAccount(c.env.DB, email, accountId);
  if (!acct) return c.json({ error: 'No account configured' }, 400);

  try {
    const token = await getToken(c.env.DB, email, acct.account_id);
    const result = await lookupRpki(prefix, token);
    return c.json({ result });
  } catch (e) {
    console.error('RPKI lookup error:', e);
    return c.json({ error: 'RPKI lookup failed' }, 502);
  }
});

// ─── RIPEstat Visibility ─────────────────────────────────────────────

app.get('/api/ripestat-visibility', async (c) => {
  const prefix = c.req.query('prefix');
  if (!prefix) return c.json({ error: 'prefix is required' }, 400);

  try {
    const result = await lookupRipestatVisibility(prefix);
    return c.json({ result });
  } catch (e) {
    console.error('RIPEstat visibility error:', e);
    return c.json({ error: 'RIPEstat visibility lookup failed' }, 502);
  }
});

// ─── Activity Log ───────────────────────────────────────────────────

app.get('/api/activity', async (c) => {
  const email = c.get('userEmail');
  const rows = await c.env.DB.prepare(
    'SELECT * FROM activity_log WHERE user_email = ? ORDER BY created_at DESC LIMIT 50',
  )
    .bind(email)
    .all();
  return c.json({ activity: rows.results || [] });
});

// ─── Dashboard ──────────────────────────────────────────────────────

app.get('/', (c) => {
  const userEmail = c.get('userEmail');
  return c.html(renderDashboard(userEmail));
});

// ─── Export ─────────────────────────────────────────────────────────

export default {
  fetch: app.fetch,
};
