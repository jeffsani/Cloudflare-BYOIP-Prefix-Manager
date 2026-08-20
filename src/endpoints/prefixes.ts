import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env } from '../types';
import { getToken, logActivity, resolveAccount } from '../helpers';
import { enqueueNotification } from '../queue';
import {
  listPrefixes,
  listBgpPrefixes,
  createPrefix,
  uploadLoaDocument,
  updatePrefixDescription,
  validatePrefix,
  lookupRpki,
  lookupIrrRecords,
} from '../api';
import {
  CfPrefixSchema,
  CreatePrefixRequestSchema,
  ValidateNewPrefixRequestSchema,
  ValidateNewPrefixResponseSchema,
  PrefixStatsResponseSchema,
  UpdateDescriptionRequestSchema,
  ValidatePrefixRequestSchema,
  BulkToggleRequestSchema,
  BulkToggleResultItemSchema,
} from '../schemas/prefixes';
import { ErrorResponseSchema, OkResponseSchema, AccountIdQuerySchema } from '../schemas/common';
import { toggleBgpAdvertisement } from '../api';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// GET /api/prefixes
export class ListPrefixes extends OpenAPIRoute {
  schema = {
    tags: ['Prefixes'],
    summary: 'List BYOIP prefixes',
    description: 'List all BYOIP prefixes for the active or specified account.',
    request: {
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'List of prefixes',
        ...contentJson(z.object({
          prefixes: z.array(CfPrefixSchema),
          account_id: z.string(),
        })),
      },
      '400': {
        description: 'No account configured or token error',
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
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await listPrefixes(acct.account_id, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      return c.json({ prefixes: result.result || [], account_id: acct.account_id });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/prefixes
export class CreatePrefix extends OpenAPIRoute {
  schema = {
    tags: ['Prefixes'],
    summary: 'Create BYOIP prefix',
    description: 'Onboard a new BYOIP prefix with CIDR, ASN, and optional LOA document.',
    request: {
      body: contentJson(CreatePrefixRequestSchema),
    },
    responses: {
      '200': {
        description: 'Prefix created',
        ...contentJson(z.object({ ok: z.literal(true), prefix: CfPrefixSchema })),
      },
      '400': {
        description: 'Validation error or missing token',
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
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await createPrefix(
        acct.account_id,
        body.cidr,
        body.asn,
        body.delegate_loa_creation ?? true,
        token,
        body.description,
        body.loa_document_id,
      );
      if (!result.success) {
        const errCode = result.errors?.[0]?.message || 'API error';
        const errDetail = result.errors?.map((e: { code?: number; message?: string }) => `[${e.code || ''}] ${e.message || ''}`).join('; ') || '';
        console.error('Cloudflare prefix creation failed:', JSON.stringify(result.errors), 'cidr:', body.cidr, 'asn:', body.asn);
        const friendlyErrors: Record<string, string> = {
          prefix_exists_for_cidr: `Cloudflare reports this prefix (${body.cidr}) already exists. This could mean it exists in another account, or a parent/overlapping prefix covers it. Check all accounts or contact Cloudflare support.`,
          invalid_cidr: `Invalid CIDR notation: ${body.cidr}`,
          prefix_too_small: `The prefix ${body.cidr} is too small. Minimum prefix length is /24 for IPv4 and /48 for IPv6.`,
          prefix_too_large: `The prefix ${body.cidr} is too large.`,
        };
        return c.json({ error: friendlyErrors[errCode] || errCode, details: errDetail }, 502);
      }

      const createPrefixDetails = `Created prefix ${body.cidr} (ASN ${body.asn}) in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, 'create_prefix', createPrefixDetails);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'create_prefix',
        title: body.cidr, details: createPrefixDetails,
      });

      return c.json({ ok: true, prefix: result.result });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// GET /api/prefixes/stats
export class GetPrefixStats extends OpenAPIRoute {
  schema = {
    tags: ['Prefixes'],
    summary: 'Get prefix stats',
    description: 'Aggregated statistics for all prefixes including parent and BGP child counts, IRR/RPKI validation state.',
    request: {
      query: AccountIdQuerySchema,
    },
    responses: {
      '200': {
        description: 'Prefix statistics',
        ...contentJson(PrefixStatsResponseSchema),
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
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
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
          pending: prefixes.filter((p) => p.approved === 'P').length,
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
  }
}

// POST /api/prefixes/validate-new
export class ValidateNewPrefix extends OpenAPIRoute {
  schema = {
    tags: ['Prefixes'],
    summary: 'Pre-submission validation',
    description: 'Validate a prefix before submission by checking IRR records and ROA/RPKI state.',
    request: {
      body: contentJson(ValidateNewPrefixRequestSchema),
    },
    responses: {
      '200': {
        description: 'Validation results',
        ...contentJson(ValidateNewPrefixResponseSchema),
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

    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);

      // Run validation checks in parallel
      const [rpkiResult, irrResult] = await Promise.allSettled([
        lookupRpki(body.cidr, token, body.asn),
        lookupIrrRecords(body.cidr),
      ]);

      // Process ROA/RPKI results
      const roa = { found: false, matching_asn: false, origins: [] as Array<{ asn: number; rpki_status: string; peer_count: number; prefix?: string }> };
      if (rpkiResult.status === 'fulfilled' && rpkiResult.value.prefix_origins.length > 0) {
        roa.found = true;
        roa.origins = rpkiResult.value.prefix_origins.map((po) => ({
          asn: po.origin,
          rpki_status: po.rpki_validation || 'unknown',
          peer_count: po.peer_count,
          prefix: po.prefix,
        }));
        roa.matching_asn = roa.origins.some((o) => o.asn === body.asn);
      }

      // Process IRR results (RIPEstat)
      const irr = {
        found: false,
        matching_asn: false,
        exact_match: false,
        records: [] as Array<{ source: string; prefix: string; origin: string }>,
        databases: [] as string[],
      };
      if (irrResult.status === 'fulfilled' && irrResult.value.records.length > 0) {
        irr.found = true;
        irr.records = irrResult.value.records;
        irr.databases = [...new Set(irrResult.value.records.map((r) => r.source).filter(Boolean))];
        irr.matching_asn = irr.records.some((r) => {
          const asnStr = r.origin.replace(/^AS/i, '');
          return parseInt(asnStr, 10) === body.asn;
        });
        // Check if any record is an exact prefix match (not just parent coverage)
        const normalizedCidr = body.cidr.toLowerCase().replace(/::+/g, '::');
        irr.exact_match = irr.records.some((r) => {
          const normalizedRecord = r.prefix.toLowerCase().replace(/::+/g, '::');
          return normalizedRecord === normalizedCidr;
        });
      }

      // Fetch saved RIR credential types for this account
      const rirCredResult = await c.env.DB.prepare(
        'SELECT rir FROM rir_credentials WHERE user_email = ? AND account_id = ?',
      )
        .bind(email, acct.account_id)
        .all();
      const rirCredentials = (rirCredResult.results || []).map((r: Record<string, unknown>) => r.rir as string);

      // Build summary
      const warnings: string[] = [];
      const errors: string[] = [];
      const isCloudflareAsn = body.asn === 13335;

      if (isCloudflareAsn) {
        if (!roa.found) {
          warnings.push('No ROA records found for this prefix. Cloudflare will manage ROA records for ASN 13335.');
        }
        if (!irr.found) {
          warnings.push('No IRR records found for this prefix. Cloudflare will manage IRR records for ASN 13335.');
        }
      } else {
        // BYO-ASN — require valid IRR, ROA, and will need ownership + ASN ownership validation post-creation
        if (!roa.found) {
          errors.push('No ROA records found. A valid ROA authorizing your ASN to originate this prefix is required. Create a ROA at your RIR or via the Cloudflare RPKI Portal.');
        } else if (!roa.matching_asn) {
          errors.push(`ROA found but origin ASN does not match ${body.asn}. Update your ROA to include AS${body.asn}.`);
        }

        if (!irr.found) {
          errors.push('No IRR records found. An exact route/route6 object with your ASN as the origin is required. Create one at your RIR or an IRR database (e.g., RADB).');
        } else if (!irr.matching_asn) {
          errors.push(`IRR record found but origin ASN does not match ${body.asn}. Update your IRR route object to reference AS${body.asn}.`);
        } else if (!irr.exact_match) {
          const parentPrefixes = irr.records.map((r) => r.prefix).join(', ');
          warnings.push(`No exact IRR record for ${body.cidr}. Found parent/covering record (${parentPrefixes}). An exact route object for this prefix will be auto-created if RIR credentials are saved, or you can create it manually.`);
        }

        if (rirCredentials.length === 0) {
          warnings.push('BYO-ASN: Add RIR credentials in Account Settings to enable automatic IRR route object and aut-num creation after prefix onboarding.');
        }
      }

      const ready = errors.length === 0;

      return c.json({
        result: {
          roa,
          irr,
          rir_credentials: rirCredentials,
          summary: { ready, warnings, errors },
        },
      });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'Validation failed' }, 400);
    }
  }
}

// PATCH /api/prefixes/:prefixId/description
export class UpdatePrefixDescription extends OpenAPIRoute {
  schema = {
    tags: ['Prefixes'],
    summary: 'Update prefix description',
    description: 'Update the description of a BYOIP prefix. Supports #tags for categorization.',
    request: {
      params: z.object({ prefixId: z.string() }),
      body: contentJson(UpdateDescriptionRequestSchema),
    },
    responses: {
      '200': {
        description: 'Description updated',
        ...contentJson(z.object({ ok: z.literal(true), prefix: CfPrefixSchema })),
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
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await updatePrefixDescription(acct.account_id, prefixId, body.description ?? '', token);

      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }

      const updateDescCidr = result.result?.cidr || prefixId;
      const updateDescDetails = `Updated description for prefix ${updateDescCidr} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, 'update_description', updateDescDetails);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'update_description',
        title: updateDescCidr, details: updateDescDetails,
      });

      return c.json({ ok: true, prefix: result.result });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/prefixes/:prefixId/validate
export class ValidateExistingPrefix extends OpenAPIRoute {
  schema = {
    tags: ['Prefixes'],
    summary: 'Re-validate prefix',
    description: 'Trigger re-validation of a prefix (RPKI, IRR, ownership).',
    request: {
      params: z.object({ prefixId: z.string() }),
      body: contentJson(ValidatePrefixRequestSchema),
    },
    responses: {
      '200': {
        description: 'Validation triggered',
        ...contentJson(z.object({ ok: z.literal(true), prefix: CfPrefixSchema })),
      },
      '400': {
        description: 'No account configured',
        ...contentJson(ErrorResponseSchema),
      },
      '502': {
        description: 'Validation API error',
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
      const result = await validatePrefix(acct.account_id, prefixId, token);

      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'Validation API error' }, 502);
      }

      const validateCidr = result.result?.cidr || prefixId;
      const validateDetails = `Re-validated prefix ${validateCidr} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, 'validate', validateDetails);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'validate',
        title: validateCidr, details: validateDetails,
      });

      return c.json({ ok: true, prefix: result.result });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/prefixes/bulk-toggle
export class BulkToggle extends OpenAPIRoute {
  schema = {
    tags: ['Prefixes'],
    summary: 'Bulk toggle advertisement',
    description: 'Advertise or withdraw multiple prefixes at once. Skips locked prefixes and those already in the desired state.',
    request: {
      body: contentJson(BulkToggleRequestSchema),
    },
    responses: {
      '200': {
        description: 'Bulk toggle results',
        ...contentJson(z.object({
          ok: z.literal(true),
          results: z.array(BulkToggleResultItemSchema),
        })),
      },
      '400': {
        description: 'No account configured or missing data',
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const results: Array<{
        prefix_id: string;
        cidr: string;
        toggled: number;
        skipped: number;
        errors: string[];
      }> = [];

      // Fetch all prefixes once to check approval status
      const allPrefixData = await listPrefixes(acct.account_id, token);
      const prefixApprovalMap = new Map<string, string>();
      if (allPrefixData.success && allPrefixData.result) {
        for (const p of allPrefixData.result) {
          prefixApprovalMap.set(p.id, p.approved);
        }
      }

      for (const prefixId of body.prefix_ids) {
        const result = { prefix_id: prefixId, cidr: '', toggled: 0, skipped: 0, errors: [] as string[] };

        // Skip prefixes that are still pending approval
        if (prefixApprovalMap.get(prefixId) === 'P') {
          result.skipped++;
          results.push(result);
          continue;
        }

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
      const bulkDetails = `Bulk ${body.advertised ? 'advertise' : 'withdraw'}: ${totalToggled} toggled, ${totalSkipped} skipped across ${body.prefix_ids.length} prefixes in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, action, bulkDetails);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: action,
        title: `${totalToggled} prefix(es)`, details: bulkDetails,
      });

      return c.json({ ok: true, results });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}
