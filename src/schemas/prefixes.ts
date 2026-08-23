import { z } from 'zod';

export const CfPrefixSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  cidr: z.string(),
  asn: z.number().nullable(),
  // Parent-level `advertised` / `advertised_modified_at` are deprecated by
  // Cloudflare (prefer the BGP Prefixes API). Omitted intentionally — parent
  // advertisement status is derived from the prefix's BGP sub-prefixes.
  approved: z.string(),
  description: z.string(),
  irr_validation_state: z.string(),
  rpki_validation_state: z.string(),
  ownership_validation_state: z.string(),
  ownership_validation_token: z.string().optional(),
  on_demand_enabled: z.boolean(),
  on_demand_locked: z.boolean(),
  created_at: z.string(),
  modified_at: z.string(),
});

export const CfBgpPrefixSchema = z.object({
  id: z.string(),
  cidr: z.string(),
  asn: z.number().nullable(),
  asn_prepend_count: z.number(),
  auto_advertise_withdraw: z.boolean(),
  bgp_signal_opts: z.object({
    enabled: z.boolean(),
    modified_at: z.string().nullable(),
  }).nullable(),
  on_demand: z.object({
    advertised: z.boolean().nullable(),
    advertised_modified_at: z.string().nullable(),
    on_demand_enabled: z.boolean(),
    on_demand_locked: z.boolean(),
  }).nullable(),
  created_at: z.string(),
  modified_at: z.string(),
});

export const CfServiceBindingSchema = z.object({
  id: z.string(),
  cidr: z.string(),
  service_id: z.string(),
  service_name: z.string(),
  provisioning: z.object({ state: z.string() }),
});

export const CfServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const CfDelegationSchema = z.object({
  id: z.string(),
  cidr: z.string(),
  created_at: z.string(),
  delegated_account_id: z.string(),
  modified_at: z.string(),
  parent_prefix_id: z.string(),
  description: z.string().optional(),
});

export const CreatePrefixRequestSchema = z.object({
  cidr: z.string().min(1, 'cidr is required'),
  asn: z.number({ message: 'asn is required' }),
  delegate_loa_creation: z.boolean().default(true),
  description: z.string().optional(),
  loa_document_id: z.string().optional(),
  account_id: z.string().optional(),
});

export const ValidateNewPrefixRequestSchema = z.object({
  cidr: z.string().min(1, 'cidr is required'),
  asn: z.number({ message: 'asn is required' }),
  account_id: z.string().optional(),
});

export const RoaInfoSchema = z.object({
  found: z.boolean(),
  matching_asn: z.boolean(),
  origins: z.array(z.object({
    asn: z.number(),
    rpki_status: z.string(),
    peer_count: z.number(),
    prefix: z.string().optional(),
  })),
});

export const IrrInfoSchema = z.object({
  found: z.boolean(),
  matching_asn: z.boolean(),
  exact_match: z.boolean(),
  records: z.array(z.object({
    source: z.string(),
    prefix: z.string(),
    origin: z.string(),
  })),
  databases: z.array(z.string()),
});

export const ValidationSummarySchema = z.object({
  ready: z.boolean(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
});

export const ValidateNewPrefixResponseSchema = z.object({
  result: z.object({
    roa: RoaInfoSchema,
    irr: IrrInfoSchema,
    rir_credentials: z.array(z.string()),
    summary: ValidationSummarySchema,
  }),
});

export const PerPrefixStatsSchema = z.object({
  has_advertised_child: z.boolean(),
  has_withdrawn_child: z.boolean(),
});

export const PrefixStatsResponseSchema = z.object({
  stats: z.object({
    parent: z.object({
      total: z.number(),
      advertised: z.number(),
      withdrawn: z.number(),
      partial: z.number(),
      locked: z.number(),
      pending: z.number(),
    }),
    bgp: z.object({
      total: z.number(),
      advertised: z.number(),
      withdrawn: z.number(),
    }),
    irr: z.object({
      valid: z.number(),
      invalid: z.number(),
      pending: z.number(),
    }),
    rpki: z.object({
      valid: z.number(),
      invalid: z.number(),
      pending: z.number(),
    }),
    per_prefix: z.record(z.string(), PerPrefixStatsSchema),
  }),
});

export const CreateBgpPrefixRequestSchema = z.object({
  cidr: z.string().min(1, 'cidr is required'),
  account_id: z.string().optional(),
});

export const ToggleBgpRequestSchema = z.object({
  advertised: z.boolean(),
  account_id: z.string().optional(),
});

export const BulkToggleRequestSchema = z.object({
  prefix_ids: z.array(z.string()).min(1, 'prefix_ids array is required'),
  advertised: z.boolean(),
  account_id: z.string().optional(),
});

export const BulkToggleResultItemSchema = z.object({
  prefix_id: z.string(),
  cidr: z.string(),
  toggled: z.number(),
  skipped: z.number(),
  errors: z.array(z.string()),
});

export const CreateBindingRequestSchema = z.object({
  cidr: z.string().min(1, 'cidr is required'),
  service_id: z.string().min(1, 'service_id is required'),
  account_id: z.string().optional(),
});

export const CreateDelegationRequestSchema = z.object({
  cidr: z.string().min(1, 'cidr is required'),
  delegated_account_id: z.string().min(1, 'delegated_account_id is required'),
  description: z.string().optional(),
  account_id: z.string().optional(),
});

export const UpdateDescriptionRequestSchema = z.object({
  description: z.string(),
  account_id: z.string().optional(),
});

export const ValidatePrefixRequestSchema = z.object({
  account_id: z.string().optional(),
});
