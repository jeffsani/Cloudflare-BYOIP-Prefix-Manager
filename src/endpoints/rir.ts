import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env } from '../types';
import { logActivity, resolveRirCreds } from '../helpers';
import {
  ensureArinRouteObject,
  createRipeRouteObject,
  updateRipeRouteObject,
  ensureArinAutnum,
  updateRipeAutnum,
  createRipeAutnum,
  normalizeRirName,
  validateArinCredentials,
  validateRipeCredentials,
  lookupRdap,
} from '../api';
import {
  RirCredentialMaskedSchema,
  SaveRirCredentialRequestSchema,
  PatchRirCredentialRequestSchema,
  ValidateRirCredentialRequestSchema,
  ValidateRirCredentialResponseSchema,
  EnsureRouteRequestSchema,
  EnsureAutnumRequestSchema,
  RirApiResultSchema,
  DetectRirResponseSchema,
} from '../schemas/rir';
import { ErrorResponseSchema, OkResponseSchema } from '../schemas/common';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// GET /api/rir/credentials
export class ListRirCredentials extends OpenAPIRoute {
  schema = {
    tags: ['RIR Credentials'],
    summary: 'List RIR credentials',
    description: 'List saved RIR credentials (API keys are masked) for the specified account.',
    request: {
      query: z.object({
        account_id: z.string().describe('Cloudflare account ID'),
      }),
    },
    responses: {
      '200': {
        description: 'List of credentials',
        ...contentJson(z.object({ credentials: z.array(RirCredentialMaskedSchema) })),
      },
      '400': {
        description: 'Missing account_id',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail') as string;
    const data = await this.getValidatedData<typeof this.schema>();
    const accountId = data.query.account_id;

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
  }
}

// POST /api/rir/credentials
export class SaveRirCredentials extends OpenAPIRoute {
  schema = {
    tags: ['RIR Credentials'],
    summary: 'Save RIR credentials',
    description: 'Save or update RIR credentials (ARIN or RIPE) for automated IRR record management.',
    request: {
      body: contentJson(SaveRirCredentialRequestSchema),
    },
    responses: {
      '200': {
        description: 'Credentials saved',
        ...contentJson(OkResponseSchema),
      },
      '400': {
        description: 'Validation error',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail') as string;
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;

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
  }
}

// PATCH /api/rir/credentials/:id
export class PatchRirCredentials extends OpenAPIRoute {
  schema = {
    tags: ['RIR Credentials'],
    summary: 'Patch RIR credentials',
    description: 'Partially update RIR credentials (API key and/or maintainer).',
    request: {
      params: z.object({ id: z.string() }),
      body: contentJson(PatchRirCredentialRequestSchema),
    },
    responses: {
      '200': {
        description: 'Credentials updated',
        ...contentJson(OkResponseSchema),
      },
      '400': {
        description: 'Nothing to update',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail') as string;
    const data = await this.getValidatedData<typeof this.schema>();
    const id = data.params.id;
    const body = data.body;

    const sets: string[] = [];
    const vals: string[] = [];
    if (body.api_key !== undefined && body.api_key !== '') {
      sets.push('api_key = ?');
      vals.push(body.api_key);
    }
    if (body.maintainer !== undefined) {
      sets.push('maintainer = ?');
      vals.push(body.maintainer);
    }
    if (sets.length === 0) {
      return c.json({ error: 'Nothing to update' }, 400);
    }
    sets.push("updated_at = datetime('now')");

    await c.env.DB.prepare(
      `UPDATE rir_credentials SET ${sets.join(', ')} WHERE id = ? AND user_email = ?`,
    )
      .bind(...vals, id, email)
      .run();

    return c.json({ ok: true });
  }
}

// DELETE /api/rir/credentials/:id
export class DeleteRirCredentials extends OpenAPIRoute {
  schema = {
    tags: ['RIR Credentials'],
    summary: 'Delete RIR credentials',
    description: 'Delete saved RIR credentials.',
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      '200': {
        description: 'Credentials deleted',
        ...contentJson(OkResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail') as string;
    const data = await this.getValidatedData<typeof this.schema>();
    const id = data.params.id;

    await c.env.DB.prepare('DELETE FROM rir_credentials WHERE id = ? AND user_email = ?')
      .bind(id, email)
      .run();

    return c.json({ ok: true });
  }
}

// POST /api/rir/credentials/validate
export class ValidateRirCredentialsEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['RIR Credentials'],
    summary: 'Validate RIR credentials',
    description: 'Test RIR credentials (Org ID for ARIN, API key + maintainer for RIPE) before saving.',
    request: {
      body: contentJson(ValidateRirCredentialRequestSchema),
    },
    responses: {
      '200': {
        description: 'Validation result',
        ...contentJson(ValidateRirCredentialResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail') as string;
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;
    const rir = (body.rir || '').toLowerCase();

    // For saved credentials the API key is masked in the UI, so resolve the
    // stored key (and maintainer) from the DB when they aren't supplied.
    let apiKey = body.api_key;
    let maintainer = body.maintainer;
    if (body.account_id && (!apiKey || !maintainer)) {
      const stored = await resolveRirCreds(c.env.DB, email, body.account_id, rir);
      if (stored) {
        if (!apiKey) apiKey = stored.apiKey;
        if (!maintainer) maintainer = stored.maintainer;
      }
    }

    if (rir === 'arin') {
      if (!maintainer) {
        return c.json({ valid: false, error: 'Org ID is required for ARIN.' });
      }
      const result = await validateArinCredentials(maintainer, apiKey);
      return c.json(result);
    } else if (rir === 'ripe') {
      if (!apiKey || !maintainer) {
        return c.json({ valid: false, error: 'API key and maintainer are required for RIPE.' });
      }
      const result = await validateRipeCredentials(apiKey, maintainer);
      return c.json(result);
    } else {
      return c.json({ valid: false, error: 'RIR must be "arin" or "ripe".' });
    }
  }
}

// POST /api/rir/ensure-route
export class EnsureRoute extends OpenAPIRoute {
  schema = {
    tags: ['RIR Operations'],
    summary: 'Ensure route object',
    description: 'Create or update a route/route6 object at ARIN or RIPE IRR with the Cloudflare validation token.',
    request: {
      body: contentJson(EnsureRouteRequestSchema),
    },
    responses: {
      '200': {
        description: 'Route object result',
        ...contentJson(RirApiResultSchema),
      },
      '400': {
        description: 'Validation error or missing credentials',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail') as string;
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;

    const rir = body.rir.toLowerCase();
    if (rir !== 'arin' && rir !== 'ripe') {
      return c.json({ error: 'Automated route management is only supported for ARIN and RIPE' }, 400);
    }

    const creds = await resolveRirCreds(c.env.DB, email, body.account_id, rir, body.api_key, body.maintainer);
    if (!creds) {
      return c.json({ error: `No ${rir.toUpperCase()} credentials found. Save credentials in Settings first.` }, 400);
    }

    let result;
    if (rir === 'arin') {
      if (!creds.maintainer) {
        return c.json({ error: 'ARIN requires an Org ID. Save your ARIN Org ID (e.g., DC-403) in Settings.' }, 400);
      }
      result = await ensureArinRouteObject(body.prefix, body.origin_asn, body.validation_token, creds.apiKey, creds.maintainer);
    } else {
      if (!creds.maintainer) {
        return c.json({ error: 'RIPE requires a maintainer (mnt-by). Save it in Settings.' }, 400);
      }
      // For RIPE: try update first, fall back to create
      result = await updateRipeRouteObject(body.prefix, body.origin_asn, body.validation_token, creds.apiKey, creds.maintainer);
      if (!result.ok && result.error?.includes('not found')) {
        result = await createRipeRouteObject(body.prefix, body.origin_asn, body.validation_token, creds.apiKey, creds.maintainer);
      }
    }

    if (result.ok) {
      await c.env.DB.prepare(
        `INSERT INTO activity_log (user_email, account_id, action, details) VALUES (?, ?, ?, ?)`,
      )
        .bind(email, body.account_id, 'rir_ensure_route', `Validated ${body.prefix.includes(':') ? 'route6' : 'route'} token at ${rir.toUpperCase()} for ${body.prefix} AS${body.origin_asn} onboarding`)
        .run();
    }

    return c.json(result);
  }
}

// POST /api/rir/ensure-autnum
export class EnsureAutnum extends OpenAPIRoute {
  schema = {
    tags: ['RIR Operations'],
    summary: 'Ensure aut-num object',
    description: 'Create or update an aut-num object at ARIN or RIPE IRR with the Cloudflare validation token.',
    request: {
      body: contentJson(EnsureAutnumRequestSchema),
    },
    responses: {
      '200': {
        description: 'Aut-num object result',
        ...contentJson(RirApiResultSchema),
      },
      '400': {
        description: 'Validation error or missing credentials',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail') as string;
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;

    const rir = body.rir.toLowerCase();
    if (rir !== 'arin' && rir !== 'ripe') {
      return c.json({ error: 'Automated aut-num management is only supported for ARIN and RIPE' }, 400);
    }

    const creds = await resolveRirCreds(c.env.DB, email, body.account_id, rir, body.api_key, body.maintainer);
    if (!creds) {
      return c.json({ error: `No ${rir.toUpperCase()} credentials found. Save credentials in Settings first.` }, 400);
    }

    let result;
    if (rir === 'arin') {
      if (!creds.maintainer) {
        return c.json({ error: 'ARIN requires an Org ID. Save your ARIN Org ID (e.g., DC-403) in Settings.' }, 400);
      }
      result = await ensureArinAutnum(body.asn, body.validation_token, creds.apiKey, creds.maintainer);
    } else {
      if (!creds.maintainer) {
        return c.json({ error: 'RIPE requires a maintainer (mnt-by). Save it in Settings.' }, 400);
      }
      // For RIPE: try update first, fall back to create if the aut-num doesn't exist
      result = await updateRipeAutnum(body.asn, body.validation_token, creds.apiKey, creds.maintainer);
      if (!result.ok && result.error?.includes('not found')) {
        result = await createRipeAutnum(body.asn, body.validation_token, creds.apiKey, creds.maintainer);
      }
    }

    if (result.ok) {
      await c.env.DB.prepare(
        `INSERT INTO activity_log (user_email, account_id, action, details) VALUES (?, ?, ?, ?)`,
      )
        .bind(email, body.account_id, 'rir_ensure_autnum', `Validated aut-num token at ${rir.toUpperCase()} for ${body.prefix ? `${body.prefix} ` : ''}AS${body.asn} onboarding`)
        .run();
    }

    return c.json(result);
  }
}

// GET /api/rir/detect
export class DetectRir extends OpenAPIRoute {
  schema = {
    tags: ['RIR Operations'],
    summary: 'Detect RIR for prefix',
    description: 'Auto-detect the Regional Internet Registry (RIR) responsible for a prefix via RDAP.',
    request: {
      query: z.object({
        prefix: z.string().describe('IP prefix (e.g. 192.0.2.0/24)'),
      }),
    },
    responses: {
      '200': {
        description: 'RIR detection result',
        ...contentJson(DetectRirResponseSchema),
      },
      '400': {
        description: 'Missing prefix',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const prefix = data.query.prefix;

    try {
      const rdap = await lookupRdap(prefix);
      const rir = normalizeRirName(rdap.rir);
      return c.json({ rir, rir_name: rdap.rir, supported: rir === 'arin' || rir === 'ripe' });
    } catch {
      return c.json({ rir: null, supported: false, error: 'Could not detect RIR' });
    }
  }
}
