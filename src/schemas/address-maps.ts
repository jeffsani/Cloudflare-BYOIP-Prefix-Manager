import { z } from 'zod';

// A normalized address map as returned to the UI. `name` is the Cloudflare
// `description` field; memberships are split into resolved domains (zone-scoped)
// and member account ids (account-scoped).
export const AddressMapViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  can_delete: z.boolean(),
  can_modify_ips: z.boolean(),
  default_sni: z.string().nullable(),
  scope: z.enum(['account', 'zone', 'empty']),
  ips: z.array(z.string()),
  domains: z.array(z.object({ zone_id: z.string(), name: z.string(), can_delete: z.boolean() })),
  account_members: z.array(z.object({ account_id: z.string(), can_delete: z.boolean() })),
  created_at: z.string(),
  modified_at: z.string(),
  account_id: z.string(),
  account_label: z.string().optional(),
});

export const AddressMapsListResponseSchema = z.object({
  maps: z.array(AddressMapViewSchema),
  // True when at least one in-scope account's zone lookup failed (Zone: Read
  // missing). The UI uses this to warn that domain names may be unresolved.
  zones_unavailable: z.boolean(),
});

export const AddressMapEligibilitySchema = z.object({
  cdn: z.boolean(),
  spectrum: z.boolean(),
  entitlements_available: z.boolean(),
  has_cdn_binding: z.boolean(),
  has_spectrum_binding: z.boolean(),
  // Convenience flag the UI uses to show/hide the icon.
  show: z.boolean(),
});

export const AvailableIpSchema = z.object({
  ip: z.string(),
  prefix_cidr: z.string(),
  service_name: z.string(),
});

export const AvailableIpsResponseSchema = z.object({
  ips: z.array(AvailableIpSchema),
  used_ips: z.array(z.string()),
  // True when one or more bindings were too large to fully enumerate.
  truncated: z.boolean(),
  // True when some binding IPs were excluded because their BGP prefix is not
  // advertised (Cloudflare only maps advertised IPs).
  skipped_not_advertised: z.boolean(),
});

export const ZonesListResponseSchema = z.object({
  zones: z.array(z.object({ id: z.string(), name: z.string() })),
});

export const CreateAddressMapRequestSchema = z.object({
  // Required by the UI even though the Cloudflare API treats it as optional.
  name: z.string().min(1, 'name is required'),
  scope: z.enum(['account', 'zone']),
  // Zone ids for zone-scoped maps (ignored for account scope).
  zone_ids: z.array(z.string()).optional().default([]),
  ips: z.array(z.string()).optional().default([]),
  enabled: z.boolean().optional().default(true),
  account_id: z.string().optional(),
});

export const UpdateAddressMapRequestSchema = z.object({
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  default_sni: z.string().nullable().optional(),
  account_id: z.string().optional(),
});

export const AddIpRequestSchema = z.object({
  ip: z.string().min(1, 'ip is required'),
  account_id: z.string().optional(),
});

export const AddZoneRequestSchema = z.object({
  zone_id: z.string().min(1, 'zone_id is required'),
  account_id: z.string().optional(),
});
