import { Hono } from 'hono';
import type { Env, UserAccount, AccountToken } from './types';
import { accessAuthMiddleware } from './auth';
import { renderDashboard } from './ui';
import {
  listPrefixes,
  listBgpPrefixes,
  listServiceBindings,
  listServices,
  createServiceBinding,
  createBgpPrefix,
  toggleBgpAdvertisement,
  updatePrefixDescription,
  validatePrefix,
  verifyTokenPermissions,
  lookupBgpRoutes,
  lookupRpki,
  lookupRdap,
} from './api';

type AppEnv = { Bindings: Env; Variables: { userEmail: string } };

const app = new Hono<AppEnv>();

// Module-level round-robin counter for token load balancing
let tokenCounter = 0;

// Auth middleware
app.use('*', accessAuthMiddleware);

// Health check
app.get('/health', (c) => c.text('OK'));

// User info
app.get('/api/me', (c) => c.json({ email: c.get('userEmail') }));

// ─── Token Pool Helpers ─────────────────────────────────────────────

// Auto-migrate legacy api_token from user_accounts into account_tokens
async function migrateTokenIfNeeded(db: D1Database, email: string, accountId: string) {
  const hasNew = await db
    .prepare('SELECT COUNT(*) as cnt FROM account_tokens WHERE user_email = ? AND account_id = ?')
    .bind(email, accountId)
    .first<{ cnt: number }>();
  if (hasNew && hasNew.cnt > 0) return;

  const legacy = await db
    .prepare('SELECT api_token FROM user_accounts WHERE user_email = ? AND account_id = ?')
    .bind(email, accountId)
    .first<{ api_token: string }>();
  if (legacy?.api_token) {
    await db
      .prepare(
        'INSERT OR IGNORE INTO account_tokens (user_email, account_id, token_label, api_token) VALUES (?, ?, ?, ?)',
      )
      .bind(email, accountId, 'Default', legacy.api_token)
      .run();
  }
}

// Get a token via round-robin for read operations
async function getToken(db: D1Database, email: string, accountId: string): Promise<string> {
  await migrateTokenIfNeeded(db, email, accountId);

  const rows = await db
    .prepare(
      'SELECT api_token FROM account_tokens WHERE user_email = ? AND account_id = ? ORDER BY id ASC',
    )
    .bind(email, accountId)
    .all<{ api_token: string }>();

  const tokens = (rows.results || []).map((r) => r.api_token).filter(Boolean);
  if (tokens.length === 0) {
    throw new Error('No API tokens configured for this account');
  }

  const idx = tokenCounter++ % tokens.length;
  return tokens[idx];
}

// Get the first token for write operations (consistent, predictable)
async function getFirstToken(db: D1Database, email: string, accountId: string): Promise<string> {
  await migrateTokenIfNeeded(db, email, accountId);

  const row = await db
    .prepare(
      'SELECT api_token FROM account_tokens WHERE user_email = ? AND account_id = ? ORDER BY id ASC LIMIT 1',
    )
    .bind(email, accountId)
    .first<{ api_token: string }>();

  if (!row?.api_token) {
    throw new Error('No API tokens configured for this account');
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

// List accounts (with token counts)
app.get('/api/settings', async (c) => {
  const email = c.get('userEmail');
  const rows = await c.env.DB.prepare(
    'SELECT * FROM user_accounts WHERE user_email = ? ORDER BY is_default DESC, id ASC',
  )
    .bind(email)
    .all<UserAccount>();

  const accounts = await Promise.all(
    (rows.results || []).map(async (r) => {
      await migrateTokenIfNeeded(c.env.DB, email, r.account_id);
      const tokenCount = await c.env.DB.prepare(
        'SELECT COUNT(*) as cnt FROM account_tokens WHERE user_email = ? AND account_id = ?',
      )
        .bind(email, r.account_id)
        .first<{ cnt: number }>();

      return {
        id: r.id,
        account_label: r.account_label,
        account_id: r.account_id,
        is_default: r.is_default,
        token_count: tokenCount?.cnt || 0,
        updated_at: r.updated_at,
      };
    }),
  );
  return c.json({ accounts });
});

// Add / update account (label + account_id only, tokens managed separately)
app.post('/api/settings', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{
    account_label: string;
    account_id: string;
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
    await c.env.DB.prepare(
      `UPDATE user_accounts SET account_label = ?, updated_at = datetime('now')
       WHERE id = ? AND user_email = ?`,
    )
      .bind(body.account_label || '', existing.id, email)
      .run();
  } else {
    // Auto-set default if first account
    const count = await c.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM user_accounts WHERE user_email = ?',
    )
      .bind(email)
      .first<{ cnt: number }>();
    const isDefault = (count?.cnt || 0) === 0 ? 1 : 0;

    await c.env.DB.prepare(
      `INSERT INTO user_accounts (user_email, account_label, account_id, is_default)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(email, body.account_label || '', body.account_id, isDefault)
      .run();
  }

  return c.json({ ok: true });
});

// Delete account (and its tokens)
app.delete('/api/settings/:id', async (c) => {
  const email = c.get('userEmail');
  const id = parseInt(c.req.param('id'), 10);

  const row = await c.env.DB.prepare(
    'SELECT * FROM user_accounts WHERE id = ? AND user_email = ?',
  )
    .bind(id, email)
    .first<UserAccount>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  // Delete account and all associated tokens
  await c.env.DB.prepare('DELETE FROM account_tokens WHERE user_email = ? AND account_id = ?')
    .bind(email, row.account_id)
    .run();
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

// ─── Token Management ───────────────────────────────────────────────

// List tokens for an account
app.get('/api/tokens', async (c) => {
  const email = c.get('userEmail');
  const accountId = c.req.query('account_id');
  if (!accountId) return c.json({ error: 'account_id required' }, 400);

  await migrateTokenIfNeeded(c.env.DB, email, accountId);

  const rows = await c.env.DB.prepare(
    'SELECT * FROM account_tokens WHERE user_email = ? AND account_id = ? ORDER BY id ASC',
  )
    .bind(email, accountId)
    .all<AccountToken>();

  const tokens = (rows.results || []).map((r) => ({
    id: r.id,
    token_label: r.token_label,
    api_token: maskToken(r.api_token),
    created_at: r.created_at,
  }));
  return c.json({ tokens });
});

// Add a token to an account
app.post('/api/tokens', async (c) => {
  const email = c.get('userEmail');
  const body = await c.req.json<{
    account_id: string;
    api_token: string;
    token_label?: string;
  }>();

  if (!body.account_id || !body.api_token) {
    return c.json({ error: 'account_id and api_token are required' }, 400);
  }

  // Verify the account belongs to this user
  const acct = await c.env.DB.prepare(
    'SELECT id FROM user_accounts WHERE user_email = ? AND account_id = ?',
  )
    .bind(email, body.account_id)
    .first<{ id: number }>();
  if (!acct) return c.json({ error: 'Account not found' }, 404);

  try {
    await c.env.DB.prepare(
      'INSERT INTO account_tokens (user_email, account_id, token_label, api_token) VALUES (?, ?, ?, ?)',
    )
      .bind(email, body.account_id, body.token_label || '', body.api_token)
      .run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE')) {
      return c.json({ error: 'This token already exists for this account' }, 409);
    }
    throw e;
  }

  return c.json({ ok: true });
});

// Delete a token
app.delete('/api/tokens/:id', async (c) => {
  const email = c.get('userEmail');
  const id = parseInt(c.req.param('id'), 10);

  await c.env.DB.prepare('DELETE FROM account_tokens WHERE id = ? AND user_email = ?')
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
    const token = await getFirstToken(c.env.DB, email, acct.account_id);
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
    const token = await getFirstToken(c.env.DB, email, acct.account_id);
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
    const token = await getFirstToken(c.env.DB, email, acct.account_id);
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
    const token = await getFirstToken(c.env.DB, email, acct.account_id);
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
    const token = await getFirstToken(c.env.DB, email, acct.account_id);
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
    const token = await getFirstToken(c.env.DB, email, acct.account_id);
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
