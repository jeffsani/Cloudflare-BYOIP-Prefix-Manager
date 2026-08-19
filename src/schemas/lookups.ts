import { z } from 'zod';

export const LookingGlassRequestSchema = z.object({
  prefix: z.string().min(1, 'prefix is required'),
  account_id: z.string().optional(),
});

export const LgRouteSchema = z.object({
  as_path: z.array(z.number()),
  collector: z.string(),
  communities: z.array(z.string()),
  next_hop: z.string(),
  prefix: z.string(),
  peer_asn: z.number(),
  peer_ip: z.string(),
  origin: z.string(),
  timestamp: z.string(),
});

export const LgAsnInfoSchema = z.object({
  asn: z.number(),
  as_name: z.string(),
  country_code: z.string(),
  org_id: z.string(),
  org_name: z.string(),
});

export const LgPrefixOriginSchema = z.object({
  origin: z.number(),
  prefix: z.string(),
  rpki_validation: z.string(),
  total_peers: z.number(),
  total_visible: z.number(),
  visibility: z.number(),
});

export const LgCollectorSchema = z.object({
  collector: z.string(),
  latest_realtime_ts: z.string(),
  latest_rib_ts: z.string(),
  latest_updates_ts: z.string(),
  peers_count: z.number(),
  peers_v4_count: z.number(),
  peers_v6_count: z.number(),
});

export const LgResultSchema = z.object({
  meta: z.object({
    asn_info: z.array(LgAsnInfoSchema),
    collectors: z.array(LgCollectorSchema),
    prefix_origins: z.array(LgPrefixOriginSchema),
    data_time: z.string(),
    query_time: z.string(),
  }),
  routes: z.array(LgRouteSchema),
});

export const RdapResultSchema = z.object({
  name: z.string(),
  org: z.string(),
  country: z.string(),
  rir: z.string(),
  allocated: z.string(),
  range: z.string(),
});

export const RpkiPrefixOriginSchema = z.object({
  origin: z.number(),
  peer_count: z.number(),
  prefix: z.string(),
  rpki_validation: z.string(),
});

export const RpkiLookupResultSchema = z.object({
  prefix_origins: z.array(RpkiPrefixOriginSchema),
  data_time: z.string(),
  total_peers: z.number(),
});

export const RipestatVisibilityRrcSchema = z.object({
  rrc: z.string(),
  peers_seeing: z.number(),
  total_peers: z.number(),
  location: z.string(),
});

export const RipestatVisibilityResultSchema = z.object({
  rrcs: z.array(RipestatVisibilityRrcSchema),
  total_seeing: z.number(),
  total_peers: z.number(),
  visibility: z.number(),
  query_time: z.string(),
});
