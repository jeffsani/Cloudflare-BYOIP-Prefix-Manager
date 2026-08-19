import { z } from 'zod';

export const RirCredentialMaskedSchema = z.object({
  id: z.number(),
  rir: z.string(),
  api_key: z.string().describe('Masked API key'),
  maintainer: z.string(),
  updated_at: z.string(),
});

export const SaveRirCredentialRequestSchema = z.object({
  account_id: z.string().min(1, 'account_id is required'),
  rir: z.string().min(1, 'rir is required'),
  api_key: z.string().min(1, 'api_key is required'),
  maintainer: z.string().optional(),
});

export const PatchRirCredentialRequestSchema = z.object({
  api_key: z.string().optional(),
  maintainer: z.string().optional(),
});

export const ValidateRirCredentialRequestSchema = z.object({
  rir: z.string().min(1, 'rir is required'),
  api_key: z.string().optional(),
  maintainer: z.string().optional(),
});

export const ValidateRirCredentialResponseSchema = z.object({
  valid: z.boolean(),
  orgName: z.string().optional(),
  adminC: z.string().optional(),
  techC: z.string().optional(),
  apiKeyValid: z.boolean().optional(),
  error: z.string().optional(),
});

export const EnsureRouteRequestSchema = z.object({
  account_id: z.string().min(1, 'account_id is required'),
  prefix: z.string().min(1, 'prefix is required'),
  origin_asn: z.number({ message: 'origin_asn is required' }),
  validation_token: z.string().min(1, 'validation_token is required'),
  rir: z.string().min(1, 'rir is required'),
  api_key: z.string().optional(),
  maintainer: z.string().optional(),
});

export const EnsureAutnumRequestSchema = z.object({
  account_id: z.string().min(1, 'account_id is required'),
  asn: z.number({ message: 'asn is required' }),
  validation_token: z.string().min(1, 'validation_token is required'),
  rir: z.string().min(1, 'rir is required'),
  prefix: z.string().optional(),
  api_key: z.string().optional(),
  maintainer: z.string().optional(),
});

export const RirApiResultSchema = z.object({
  ok: z.boolean(),
  action: z.enum(['created', 'updated', 'already_present']).optional(),
  error: z.string().optional(),
  details: z.string().optional(),
});

export const DetectRirResponseSchema = z.object({
  rir: z.string().nullable(),
  rir_name: z.string().optional(),
  supported: z.boolean(),
  error: z.string().optional(),
});
