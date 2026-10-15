import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import type { Context } from 'hono';
import type { Env, AddressMapView, CfZone } from '../types';
import { getToken, logActivity, resolveAccount } from '../helpers';
import { enqueueNotification } from '../queue';
import {
  listAddressMaps,
  getAddressMap,
  createAddressMap,
  updateAddressMap,
  deleteAddressMap,
  addAddressMapIp,
  removeAddressMapIp,
  addAddressMapZone,
  removeAddressMapZone,
  listPrefixes,
  listServiceBindings,
  listBgpPrefixes,
  listZones,
  getAccountEntitlements,
} from '../api';
import {
  AddressMapsListResponseSchema,
  AddressMapEligibilitySchema,
  AvailableIpsResponseSchema,
  ZonesListResponseSchema,
  CreateAddressMapRequestSchema,
  UpdateAddressMapRequestSchema,
  AddIpRequestSchema,
  AddZoneRequestSchema,
} from '../schemas/address-maps';
import { ErrorResponseSchema, OkResponseSchema, AccountIdQuerySchema } from '../schemas/common';

type AppContext = Context<{ Bindings: Env; Variables: { userEmail: string } }>;

// Caps to keep IP enumeration bounded for large bindings (e.g. a /16 would be
// 65k hosts, an IPv6 /64 is astronomically large). Oversized bindings are
// skipped and flagged via `truncated` so the UI can advise using the API.
const MAX_IPS_PER_BINDING = 1024;
const MAX_TOTAL_IPS = 4096;

// Cloudflare rejects adding an IP whose covering BGP prefix is not currently
// advertised. Translate the opaque `is_not_advertised` slug into guidance.
const NOT_ADVERTISED_MESSAGE =
  'One or more selected IPs belong to a BGP prefix that is not currently advertised. ' +
  'Advertise the prefix (or its covering BGP sub-prefix) before adding its IPs to an address map.';

function friendlyAddressMapError(errors: unknown, fallback: string): string {
  const haystack = JSON.stringify(errors || '').toLowerCase();
  if (haystack.includes('is_not_advertised') || haystack.includes('not advertised')) {
    return NOT_ADVERTISED_MESSAGE;
  }
  return fallback;
}

// A binding counts toward address-map eligibility / IP enumeration when its
// service is CDN or Spectrum (Magic Transit IPs are not address-mappable here).
function classifyService(name: string | undefined): 'cdn' | 'spectrum' | null {
  const n = (name || '').toLowerCase();
  if (n.includes('cdn')) return 'cdn';
  if (n.includes('spectrum')) return 'spectrum';
  return null;
}

// ── IP helpers ──────────────────────────────────────────────────────

function ipToBigInt(ip: string): bigint | null {
  if (ip.includes(':')) return ipv6ToBigInt(ip);
  return ipv4ToBigInt(ip);
}

function ipv4ToBigInt(ip: string): bigint | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let v = BigInt(0);
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    v = (v << BigInt(8)) | BigInt(n);
  }
  return v;
}

function ipv6ToBigInt(ip: string): bigint | null {
  // Strip zone id if present.
  const addr = ip.split('%')[0];
  const halves = addr.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - (head.length + tail.length);
  if (halves.length === 1 && head.length !== 8) return null;
  if (halves.length === 2 && missing < 0) return null;
  const groups = halves.length === 2
    ? [...head, ...Array(missing).fill('0'), ...tail]
    : head;
  if (groups.length !== 8) return null;
  let v = BigInt(0);
  for (const g of groups) {
    if (g === '') return null;
    const n = parseInt(g, 16);
    if (Number.isNaN(n) || n < 0 || n > 0xffff) return null;
    v = (v << BigInt(16)) | BigInt(n);
  }
  return v;
}

function bigIntToIpv4(v: bigint): string {
  return [
    Number((v >> BigInt(24)) & BigInt(255)),
    Number((v >> BigInt(16)) & BigInt(255)),
    Number((v >> BigInt(8)) & BigInt(255)),
    Number(v & BigInt(255)),
  ].join('.');
}

function bigIntToIpv6(v: bigint): string {
  const groups: string[] = [];
  for (let i = 7; i >= 0; i--) {
    groups.push(Number((v >> BigInt(i * 16)) & BigInt(0xffff)).toString(16));
  }
  // Compress the longest run of consecutive zero groups.
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] === '0') {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }
  if (bestLen < 2) return groups.join(':');
  const before = groups.slice(0, bestStart).join(':');
  const after = groups.slice(bestStart + bestLen).join(':');
  return `${before}::${after}`;
}

function normalizeIp(ip: string): string | null {
  const v = ipToBigInt(ip);
  if (v === null) return null;
  return ip.includes(':') ? bigIntToIpv6(v) : bigIntToIpv4(v);
}

// Expand a CIDR into individual host IP strings, bounded by `limit`. Returns
// { ips, truncated } where truncated is true if the block exceeds `limit`.
function expandCidr(cidr: string, limit: number): { ips: string[]; truncated: boolean } {
  const [addr, maskStr] = cidr.split('/');
  if (maskStr === undefined) {
    const norm = normalizeIp(addr);
    return norm ? { ips: [norm], truncated: false } : { ips: [], truncated: false };
  }
  const v6 = addr.includes(':');
  const totalBits = v6 ? 128 : 32;
  const maskLen = Number(maskStr);
  if (!Number.isInteger(maskLen) || maskLen < 0 || maskLen > totalBits) return { ips: [], truncated: false };
  const base = ipToBigInt(addr);
  if (base === null) return { ips: [], truncated: false };
  const hostBits = totalBits - maskLen;
  // Guard against overflow before computing 2^hostBits.
  if (hostBits > 20) return { ips: [], truncated: true };
  const count = BigInt(1) << BigInt(hostBits);
  const mask = count - BigInt(1);
  const network = base & ~mask & ((BigInt(1) << BigInt(totalBits)) - BigInt(1));
  const total = Number(count);
  const take = Math.min(total, limit);
  const ips: string[] = [];
  for (let i = 0; i < take; i++) {
    const val = network + BigInt(i);
    ips.push(v6 ? bigIntToIpv6(val) : bigIntToIpv4(val));
  }
  return { ips, truncated: total > limit };
}

// A [start, end) IP range (end exclusive) used to test advertisement coverage.
interface IpRange { start: bigint; end: bigint; v6: boolean; }

// Build an IP range from a CIDR string.
function cidrToRange(cidr: string): IpRange | null {
  const [addr, maskStr] = cidr.split('/');
  const v6 = addr.includes(':');
  const totalBits = v6 ? 128 : 32;
  const base = ipToBigInt(addr);
  if (base === null) return null;
  const maskLen = maskStr === undefined ? totalBits : Number(maskStr);
  if (!Number.isInteger(maskLen) || maskLen < 0 || maskLen > totalBits) return null;
  const hostBits = totalBits - maskLen;
  const size = BigInt(1) << BigInt(hostBits);
  const network = base & ~(size - BigInt(1)) & ((BigInt(1) << BigInt(totalBits)) - BigInt(1));
  return { start: network, end: network + size, v6 };
}

function ipInRanges(ip: string, ranges: IpRange[]): boolean {
  const v6 = ip.includes(':');
  const v = ipToBigInt(ip);
  if (v === null) return false;
  for (const r of ranges) {
    if (r.v6 !== v6) continue;
    if (v >= r.start && v < r.end) return true;
  }
  return false;
}

// ── Shared binding scan ─────────────────────────────────────────────

interface BindingScan {
  hasCdn: boolean;
  hasSpectrum: boolean;
  // Eligible host IPs with provenance, deduped by normalized IP.
  ips: Array<{ ip: string; prefix_cidr: string; service_name: string }>;
  truncated: boolean;
  // True when some binding IPs were excluded because their BGP prefix is not
  // advertised (Cloudflare rejects mapping non-advertised IPs: is_not_advertised).
  skippedNotAdvertised: boolean;
}

// Walk all onboarded prefixes and their CDN/Spectrum bindings. When
// `enumerate` is false we stop at the first qualifying binding of each kind
// (cheap, for eligibility gating).
async function scanBindings(
  accountId: string,
  token: string,
  enumerate: boolean,
): Promise<BindingScan> {
  const scan: BindingScan = { hasCdn: false, hasSpectrum: false, ips: [], truncated: false, skippedNotAdvertised: false };
  const prefixesResp = await listPrefixes(accountId, token);
  if (!prefixesResp.success || !Array.isArray(prefixesResp.result)) return scan;

  const seen = new Set<string>();
  for (const prefix of prefixesResp.result) {
    if (!enumerate && scan.hasCdn && scan.hasSpectrum) break;
    let bindingsResp;
    try {
      bindingsResp = await listServiceBindings(accountId, prefix.id, token);
    } catch {
      continue;
    }
    if (!bindingsResp.success || !Array.isArray(bindingsResp.result)) continue;

    // Determine which CIDRs under this prefix are currently advertised. An IP
    // can only be added to an address map if a BGP prefix covering it is
    // advertised, otherwise Cloudflare returns `is_not_advertised`.
    let advertisedRanges: IpRange[] | null = null;
    const ensureAdvertisedRanges = async (): Promise<IpRange[]> => {
      if (advertisedRanges) return advertisedRanges;
      advertisedRanges = [];
      try {
        const bgpResp = await listBgpPrefixes(accountId, prefix.id, token);
        if (bgpResp.success && Array.isArray(bgpResp.result)) {
          for (const bgp of bgpResp.result) {
            if (bgp.on_demand && bgp.on_demand.advertised === true) {
              const r = cidrToRange(bgp.cidr);
              if (r) advertisedRanges.push(r);
            }
          }
        }
      } catch {
        // Leave advertisedRanges empty on failure (treated as "none advertised").
      }
      return advertisedRanges;
    };

    for (const b of bindingsResp.result) {
      const kind = classifyService(b.service_name);
      if (!kind) continue;
      if (kind === 'cdn') scan.hasCdn = true;
      if (kind === 'spectrum') scan.hasSpectrum = true;
      if (!enumerate) continue;
      if (scan.ips.length >= MAX_TOTAL_IPS) { scan.truncated = true; continue; }
      const ranges = await ensureAdvertisedRanges();
      const { ips, truncated } = expandCidr(b.cidr, MAX_IPS_PER_BINDING);
      if (truncated) scan.truncated = true;
      for (const ip of ips) {
        const norm = normalizeIp(ip) || ip;
        if (seen.has(norm)) continue;
        if (!ipInRanges(norm, ranges)) { scan.skippedNotAdvertised = true; continue; }
        if (scan.ips.length >= MAX_TOTAL_IPS) { scan.truncated = true; break; }
        seen.add(norm);
        scan.ips.push({ ip: norm, prefix_cidr: prefix.cidr, service_name: b.service_name });
      }
    }
  }
  return scan;
}

// Collect the set of normalized IPs already present on any address map in the
// account (used to exclude them from the available list).
async function collectUsedIps(accountId: string, token: string): Promise<Set<string>> {
  const used = new Set<string>();
  const listResp = await listAddressMaps(accountId, token);
  if (!listResp.success || !Array.isArray(listResp.result)) return used;
  for (const m of listResp.result) {
    try {
      const detail = await getAddressMap(accountId, m.id, token);
      if (detail.success && Array.isArray(detail.result?.ips)) {
        for (const entry of detail.result.ips) {
          const norm = normalizeIp(entry.ip) || entry.ip;
          used.add(norm);
        }
      }
    } catch {
      // Best-effort; skip maps we can't read.
    }
  }
  return used;
}

// ── Endpoints ───────────────────────────────────────────────────────

// GET /api/address-maps
export class ListAddressMapsEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'List address maps',
    description: 'List address maps for an account (or all configured accounts when account_id=all), with resolved domains and bound IPs.',
    request: { query: AccountIdQuerySchema },
    responses: {
      '200': { description: 'Address maps', ...contentJson(AddressMapsListResponseSchema) },
      '400': { description: 'No account configured', ...contentJson(ErrorResponseSchema) },
      '502': { description: 'Cloudflare API error', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const requested = data.query.account_id;

    // Resolve the account list: a single account, or every configured account
    // for the aggregate ("all") view.
    let accounts: Array<{ account_id: string; account_label: string }>;
    if (requested === 'all') {
      const rows = await c.env.DB.prepare(
        'SELECT account_id, account_label FROM user_accounts WHERE user_email = ? ORDER BY is_default DESC, id ASC',
      ).bind(email).all<{ account_id: string; account_label: string }>();
      accounts = rows.results || [];
    } else {
      const acct = await resolveAccount(c.env.DB, email, requested);
      if (!acct) return c.json({ error: 'No account configured' }, 400);
      accounts = [{ account_id: acct.account_id, account_label: acct.account_label }];
    }

    const maps: AddressMapView[] = [];
    let zonesUnavailable = false;

    for (const acct of accounts) {
      let token: string;
      try {
        token = await getToken(c.env.DB, email, acct.account_id);
      } catch {
        continue;
      }
      const listResp = await listAddressMaps(acct.account_id, token);
      if (!listResp.success || !Array.isArray(listResp.result)) {
        if (accounts.length === 1) {
          return c.json({ error: listResp.errors?.[0]?.message || 'API error' }, 502);
        }
        continue;
      }

      // Resolve zone id → name once per account (best-effort; needs Zone: Read).
      let zoneMap: Map<string, string> | null = null;
      const zonesResp = await listZones(acct.account_id, token).catch(() => null);
      if (zonesResp && zonesResp.success && Array.isArray(zonesResp.result)) {
        zoneMap = new Map(zonesResp.result.map((z: CfZone) => [z.id, z.name]));
      } else {
        zonesUnavailable = true;
      }

      for (const summary of listResp.result) {
        const detail = await getAddressMap(acct.account_id, summary.id, token).catch(() => null);
        const d = detail && detail.success ? detail.result : summary;
        const memberships = (d as { memberships?: unknown }).memberships;
        const ips = (d as { ips?: Array<{ ip: string }> }).ips || [];
        const domains: AddressMapView['domains'] = [];
        const accountMembers: AddressMapView['account_members'] = [];
        if (Array.isArray(memberships)) {
          for (const m of memberships as Array<{ identifier?: string; kind?: string; can_delete?: boolean }>) {
            if (m.kind === 'zone' && m.identifier) {
              domains.push({
                zone_id: m.identifier,
                name: (zoneMap && zoneMap.get(m.identifier)) || m.identifier,
                can_delete: m.can_delete !== false,
              });
            } else if (m.kind === 'account' && m.identifier) {
              accountMembers.push({ account_id: m.identifier, can_delete: m.can_delete !== false });
            }
          }
        }
        const scope: AddressMapView['scope'] = domains.length > 0 ? 'zone' : accountMembers.length > 0 ? 'account' : 'empty';
        maps.push({
          id: d.id,
          name: d.description || '',
          enabled: d.enabled !== false,
          can_delete: d.can_delete !== false,
          can_modify_ips: d.can_modify_ips !== false,
          default_sni: d.default_sni ?? null,
          scope,
          ips: ips.map((x) => x.ip),
          domains,
          account_members: accountMembers,
          created_at: d.created_at || '',
          modified_at: d.modified_at || '',
          account_id: acct.account_id,
          account_label: acct.account_label,
        });
      }
    }

    return c.json({ maps, zones_unavailable: zonesUnavailable });
  }
}

// GET /api/address-maps/eligibility
export class AddressMapEligibilityEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'Address map eligibility',
    description: 'Report whether the Address Maps UI should be shown: CDN/Spectrum entitlement and the presence of a CDN or Spectrum binding.',
    request: { query: AccountIdQuerySchema },
    responses: {
      '200': { description: 'Eligibility', ...contentJson(AddressMapEligibilitySchema) },
      '400': { description: 'No account configured', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const requested = data.query.account_id;

    // In the aggregate view, scan each account until a qualifying binding is found.
    let accountIds: string[];
    if (requested === 'all') {
      const rows = await c.env.DB.prepare(
        'SELECT account_id FROM user_accounts WHERE user_email = ? ORDER BY is_default DESC, id ASC',
      ).bind(email).all<{ account_id: string }>();
      accountIds = (rows.results || []).map((r) => r.account_id);
    } else {
      const acct = await resolveAccount(c.env.DB, email, requested);
      if (!acct) return c.json({ error: 'No account configured' }, 400);
      accountIds = [acct.account_id];
    }

    let cdn = false, spectrum = false, entAvailable = false, hasCdn = false, hasSpectrum = false;
    for (const accountId of accountIds) {
      let token: string;
      try {
        token = await getToken(c.env.DB, email, accountId);
      } catch {
        continue;
      }
      const ent = await getAccountEntitlements(accountId, token);
      if (ent.available) entAvailable = true;
      cdn = cdn || ent.cdn;
      spectrum = spectrum || ent.spectrum;
      const scan = await scanBindings(accountId, token, false);
      hasCdn = hasCdn || scan.hasCdn;
      hasSpectrum = hasSpectrum || scan.hasSpectrum;
      if (hasCdn && hasSpectrum) break;
    }

    // Permissive gating: show when a CDN or Spectrum binding exists. When the
    // entitlement signal is available it must also be positive for that kind.
    const show =
      (hasCdn && (!entAvailable || cdn)) ||
      (hasSpectrum && (!entAvailable || spectrum));

    return c.json({
      cdn, spectrum, entitlements_available: entAvailable,
      has_cdn_binding: hasCdn, has_spectrum_binding: hasSpectrum, show,
    });
  }
}

// GET /api/address-maps/available-ips
export class AvailableIpsEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'Available IPs for address maps',
    description: 'Enumerate individual IPs from CDN/Spectrum bindings on onboarded prefixes, excluding IPs already bound to another address map.',
    request: { query: AccountIdQuerySchema },
    responses: {
      '200': { description: 'Available IPs', ...contentJson(AvailableIpsResponseSchema) },
      '400': { description: 'No account configured', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const scan = await scanBindings(acct.account_id, token, true);
      const used = await collectUsedIps(acct.account_id, token);
      const available = scan.ips.filter((entry) => !used.has(entry.ip));
      return c.json({
        ips: available,
        used_ips: Array.from(used),
        truncated: scan.truncated,
        skipped_not_advertised: scan.skippedNotAdvertised,
      });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// GET /api/zones
export class ListZonesEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'List account zones',
    description: 'List zones (domains) for an account, used by the zone-scoped address map domain picker. Requires Zone: Read.',
    request: { query: AccountIdQuerySchema },
    responses: {
      '200': { description: 'Zones', ...contentJson(ZonesListResponseSchema) },
      '400': { description: 'No account configured', ...contentJson(ErrorResponseSchema) },
      '502': { description: 'Cloudflare API error', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const resp = await listZones(acct.account_id, token);
      if (!resp.success) {
        return c.json({ error: resp.errors?.[0]?.message || 'API error' }, 502);
      }
      return c.json({ zones: (resp.result || []).map((z) => ({ id: z.id, name: z.name })) });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/address-maps
export class CreateAddressMapEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'Create address map',
    description: 'Create a new address map with a name (stored as description), scope, optional domains, and IPs.',
    request: { body: contentJson(CreateAddressMapRequestSchema) },
    responses: {
      '200': { description: 'Created', ...contentJson(z.object({ ok: z.literal(true), id: z.string() })) },
      '400': { description: 'Validation error', ...contentJson(ErrorResponseSchema) },
      '502': { description: 'Cloudflare API error', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);
    if (body.scope === 'zone' && (!body.zone_ids || body.zone_ids.length === 0)) {
      return c.json({ error: 'At least one domain is required for a zone-scoped map' }, 400);
    }

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const memberships = body.scope === 'account'
        ? [{ identifier: acct.account_id, kind: 'account' as const }]
        : (body.zone_ids || []).map((id) => ({ identifier: id, kind: 'zone' as const }));
      const result = await createAddressMap(
        acct.account_id,
        { description: body.name, enabled: body.enabled, ips: body.ips, memberships },
        token,
      );
      if (!result.success) {
        return c.json({ error: friendlyAddressMapError(result.errors, result.errors?.[0]?.message || 'API error') }, 502);
      }
      const mapId = result.result?.id || '';
      const details = `Address map "${body.name}" (${body.scope}) created with ${body.ips?.length || 0} IP(s) in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'create_address_map', details);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'create_address_map',
        title: body.name, details,
      });
      return c.json({ ok: true, id: mapId });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// PATCH /api/address-maps/:mapId
export class UpdateAddressMapEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'Update address map',
    description: 'Update an address map name (description), enabled state, or default SNI.',
    request: {
      params: z.object({ mapId: z.string() }),
      body: contentJson(UpdateAddressMapRequestSchema),
    },
    responses: {
      '200': { description: 'Updated', ...contentJson(OkResponseSchema) },
      '400': { description: 'Validation error', ...contentJson(ErrorResponseSchema) },
      '502': { description: 'Cloudflare API error', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const { mapId } = data.params;
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const patch: { description?: string; enabled?: boolean; default_sni?: string | null } = {};
      if (body.name !== undefined) patch.description = body.name;
      if (body.enabled !== undefined) patch.enabled = body.enabled;
      if (body.default_sni !== undefined) patch.default_sni = body.default_sni;
      const result = await updateAddressMap(acct.account_id, mapId, patch, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      const details = `Address map ${mapId} updated in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'update_address_map', details);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'update_address_map',
        title: body.name || mapId, details,
      });
      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// DELETE /api/address-maps/:mapId
export class DeleteAddressMapEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'Delete address map',
    description: 'Delete an address map.',
    request: { params: z.object({ mapId: z.string() }), query: AccountIdQuerySchema },
    responses: {
      '200': { description: 'Deleted', ...contentJson(OkResponseSchema) },
      '400': { description: 'No account configured', ...contentJson(ErrorResponseSchema) },
      '502': { description: 'Cloudflare API error', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const { mapId } = data.params;
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await deleteAddressMap(acct.account_id, mapId, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      const details = `Address map ${mapId} deleted in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'delete_address_map', details);
      await enqueueNotification(c.env, {
        user_email: email, account_id: acct.account_id, event_type: 'delete_address_map',
        title: mapId, details,
      });
      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/address-maps/:mapId/ips
export class AddAddressMapIpEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'Add IP to address map',
    request: { params: z.object({ mapId: z.string() }), body: contentJson(AddIpRequestSchema) },
    responses: {
      '200': { description: 'Added', ...contentJson(OkResponseSchema) },
      '400': { description: 'Validation error', ...contentJson(ErrorResponseSchema) },
      '502': { description: 'Cloudflare API error', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const { mapId } = data.params;
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await addAddressMapIp(acct.account_id, mapId, body.ip, token);
      if (!result.success) {
        return c.json({ error: friendlyAddressMapError(result.errors, result.errors?.[0]?.message || 'API error') }, 502);
      }
      const details = `IP ${body.ip} added to address map ${mapId} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'update_address_map', details);
      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// DELETE /api/address-maps/:mapId/ips/:ip
export class RemoveAddressMapIpEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'Remove IP from address map',
    request: { params: z.object({ mapId: z.string(), ip: z.string() }), query: AccountIdQuerySchema },
    responses: {
      '200': { description: 'Removed', ...contentJson(OkResponseSchema) },
      '400': { description: 'No account configured', ...contentJson(ErrorResponseSchema) },
      '502': { description: 'Cloudflare API error', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const { mapId, ip } = data.params;
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await removeAddressMapIp(acct.account_id, mapId, ip, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      const details = `IP ${ip} removed from address map ${mapId} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'update_address_map', details);
      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// POST /api/address-maps/:mapId/zones
export class AddAddressMapZoneEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'Add zone (domain) to address map',
    request: { params: z.object({ mapId: z.string() }), body: contentJson(AddZoneRequestSchema) },
    responses: {
      '200': { description: 'Added', ...contentJson(OkResponseSchema) },
      '400': { description: 'Validation error', ...contentJson(ErrorResponseSchema) },
      '502': { description: 'Cloudflare API error', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const { mapId } = data.params;
    const body = data.body;
    const acct = await resolveAccount(c.env.DB, email, body.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await addAddressMapZone(acct.account_id, mapId, body.zone_id, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      const details = `Zone ${body.zone_id} added to address map ${mapId} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'update_address_map', details);
      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}

// DELETE /api/address-maps/:mapId/zones/:zoneId
export class RemoveAddressMapZoneEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Address Maps'],
    summary: 'Remove zone (domain) from address map',
    request: { params: z.object({ mapId: z.string(), zoneId: z.string() }), query: AccountIdQuerySchema },
    responses: {
      '200': { description: 'Removed', ...contentJson(OkResponseSchema) },
      '400': { description: 'No account configured', ...contentJson(ErrorResponseSchema) },
      '502': { description: 'Cloudflare API error', ...contentJson(ErrorResponseSchema) },
    },
  };

  async handle(c: AppContext) {
    const email = c.get('userEmail');
    const data = await this.getValidatedData<typeof this.schema>();
    const { mapId, zoneId } = data.params;
    const acct = await resolveAccount(c.env.DB, email, data.query.account_id);
    if (!acct) return c.json({ error: 'No account configured' }, 400);

    try {
      const token = await getToken(c.env.DB, email, acct.account_id);
      const result = await removeAddressMapZone(acct.account_id, mapId, zoneId, token);
      if (!result.success) {
        return c.json({ error: result.errors?.[0]?.message || 'API error' }, 502);
      }
      const details = `Zone ${zoneId} removed from address map ${mapId} in account ${acct.account_id}`;
      await logActivity(c.env.DB, email, acct.account_id, 'update_address_map', details);
      return c.json({ ok: true });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'No API tokens configured' }, 400);
    }
  }
}
