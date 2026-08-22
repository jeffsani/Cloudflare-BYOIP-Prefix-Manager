import type {
  CfApiResponse,
  CfPrefix,
  CfBgpPrefix,
  CfServiceBinding,
  CfService,
  CfDelegation,
  CfLoaDocument,
  LgResult,
  RdapResult,
  RpkiLookupResult,
  RpkiPrefixOrigin,
  RipestatVisibilityResult,
  IrrRecord,
  IrrLookupResult,
  IrrExplorerPrefix,
  IrrExplorerResult,
  RirApiResult,
} from './types';

const CF_API = 'https://api.cloudflare.com/client/v4';
const RADAR_API = 'https://api.cloudflare.com/client/v4';

const MAX_RETRIES = 3;

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Retry wrapper: backs off on HTTP 429 using the retry-after header
async function fetchWithRetry(input: RequestInfo, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const r = await fetch(input, init);
    if (r.status !== 429 || attempt === MAX_RETRIES) return r;

    const retryAfter = r.headers.get('retry-after');
    const waitSec = retryAfter ? Math.min(parseInt(retryAfter, 10) || 5, 30) : 5 * (attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
  }
  // Unreachable, but satisfies TypeScript
  throw new Error('Retry loop exited unexpectedly');
}

// --- Addressing Prefixes ---

export async function listPrefixes(
  accountId: string,
  token: string,
): Promise<CfApiResponse<CfPrefix[]>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes`,
    { headers: authHeaders(token) },
  );
  return r.json();
}

// --- Create Prefix ---

export async function createPrefix(
  accountId: string,
  cidr: string,
  asn: number,
  delegateLoaCreation: boolean,
  token: string,
  description?: string,
  loaDocumentId?: string,
): Promise<CfApiResponse<CfPrefix>> {
  const body: Record<string, unknown> = { cidr, asn, delegate_loa_creation: delegateLoaCreation };
  if (description) body.description = description;
  if (loaDocumentId) body.loa_document_id = loaDocumentId;

  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    },
  );
  return r.json();
}

// --- Upload LOA Document ---

export async function uploadLoaDocument(
  accountId: string,
  fileData: ArrayBuffer,
  filename: string,
  token: string,
): Promise<CfApiResponse<CfLoaDocument>> {
  const formData = new FormData();
  const blob = new Blob([fileData], { type: 'application/pdf' });
  formData.append('loa_document', blob, filename);

  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/loa_documents`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );
  return r.json();
}

// --- IRR Lookup (RIPEstat prefix-routing-consistency) ---
// Uses RIPEstat's prefix-routing-consistency endpoint which checks IRR databases
// across all RIRs (including ARIN). The old whois endpoint returned ARIN WHOIS
// registration data instead of IRR route objects for ARIN-managed prefixes.

interface RipestatRoutingConsistencyResponse {
  status: string;
  data: {
    resource: string;
    routes: Array<{
      in_bgp: boolean;
      in_whois: boolean;
      prefix: string;
      origin: number;
      irr_sources: string[];
      asn_name: string;
    }>;
  };
}

export async function lookupIrrRecords(prefix: string): Promise<IrrLookupResult> {
  const r = await fetchWithRetry(
    `https://stat.ripe.net/data/prefix-routing-consistency/data.json?resource=${encodeURIComponent(prefix)}&sourceapp=prefix-mgr`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'prefix-mgr/1.0 (Cloudflare Worker)',
      },
    },
  );
  if (!r.ok) throw new Error(`RIPEstat prefix-routing-consistency lookup failed: ${r.status}`);
  const data = (await r.json()) as RipestatRoutingConsistencyResponse;
  if (data.status !== 'ok' || !data.data?.routes) {
    return { records: [], data_source: 'ripestat' };
  }

  const records: IrrRecord[] = [];
  for (const route of data.data.routes) {
    // Only include entries that have IRR records (in_whois = true)
    if (route.in_whois && route.origin) {
      records.push({
        source: (route.irr_sources || []).join(', '),
        prefix: route.prefix,
        origin: `AS${route.origin}`,
      });
    }
  }

  return { records, data_source: 'ripestat' };
}

// --- IRR Explorer Lookup ---

export async function lookupIrrExplorer(prefix: string): Promise<IrrExplorerResult> {
  const r = await fetchWithRetry(
    `https://irrexplorer.nlnog.net/api/prefixes/exact/${encodeURIComponent(prefix)}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'prefix-mgr/1.0 (Cloudflare Worker)',
      },
    },
  );
  if (!r.ok) throw new Error(`IRR Explorer lookup failed: ${r.status}`);
  const data = (await r.json()) as Array<{
    prefix: string;
    bgpOrigins: number[];
    irrRoutes: Array<{ origin: number; source: string }>;
    rpkiRoutes: Array<{ origin: number; rpkiStatus: string }>;
  }>;

  const prefixes: IrrExplorerPrefix[] = (data || []).map((entry) => ({
    prefix: entry.prefix,
    bgp_origins: entry.bgpOrigins || [],
    irr_origins: (entry.irrRoutes || []).map((r) => r.origin),
    rpki_origins: (entry.rpkiRoutes || []).map((r) => r.origin),
    irr_sources: (entry.irrRoutes || []).map((r) => r.source),
    rpki_status: (entry.rpkiRoutes || []).length > 0
      ? entry.rpkiRoutes[0].rpkiStatus || 'unknown'
      : 'not_found',
  }));

  return { prefixes, data_source: 'irr_explorer' };
}

export async function listBgpPrefixes(
  accountId: string,
  prefixId: string,
  token: string,
): Promise<CfApiResponse<CfBgpPrefix[]>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/bgp/prefixes`,
    { headers: authHeaders(token) },
  );
  return r.json();
}

export async function createBgpPrefix(
  accountId: string,
  prefixId: string,
  cidr: string,
  token: string,
): Promise<CfApiResponse<CfBgpPrefix>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/bgp/prefixes`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ cidr }),
    },
  );
  return r.json();
}

// --- Delete BGP Child Prefix ---

export async function deleteBgpPrefix(
  accountId: string,
  prefixId: string,
  bgpPrefixId: string,
  token: string,
): Promise<CfApiResponse<null>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/bgp/prefixes/${bgpPrefixId}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );
  return r.json();
}

export async function listServiceBindings(
  accountId: string,
  prefixId: string,
  token: string,
): Promise<CfApiResponse<CfServiceBinding[]>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/bindings`,
    { headers: authHeaders(token) },
  );
  return r.json();
}

export async function listServices(
  accountId: string,
  token: string,
): Promise<CfApiResponse<CfService[]>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/services`,
    { headers: authHeaders(token) },
  );
  return r.json();
}

// --- Create Service Binding ---

export async function createServiceBinding(
  accountId: string,
  prefixId: string,
  cidr: string,
  serviceId: string,
  token: string,
): Promise<CfApiResponse<CfServiceBinding>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/bindings`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ cidr, service_id: serviceId }),
    },
  );
  return r.json();
}

// --- Delete Service Binding ---

export async function deleteServiceBinding(
  accountId: string,
  prefixId: string,
  bindingId: string,
  token: string,
): Promise<CfApiResponse<null>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/bindings/${bindingId}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );
  return r.json();
}

// --- Prefix Delegations ---

export async function listDelegations(
  accountId: string,
  prefixId: string,
  token: string,
): Promise<CfApiResponse<CfDelegation[]>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/delegations`,
    { headers: authHeaders(token) },
  );
  return r.json();
}

export async function createDelegation(
  accountId: string,
  prefixId: string,
  cidr: string,
  delegatedAccountId: string,
  token: string,
): Promise<CfApiResponse<CfDelegation>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/delegations`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ cidr, delegated_account_id: delegatedAccountId }),
    },
  );
  return r.json();
}

export async function deleteDelegation(
  accountId: string,
  prefixId: string,
  delegationId: string,
  token: string,
): Promise<CfApiResponse<{ id: string }>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/delegations/${delegationId}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );
  return r.json();
}

// --- BGP Advertisement Toggle ---

export async function toggleBgpAdvertisement(
  accountId: string,
  prefixId: string,
  bgpPrefixId: string,
  advertised: boolean,
  token: string,
): Promise<CfApiResponse<CfBgpPrefix>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/bgp/prefixes/${bgpPrefixId}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ on_demand: { advertised } }),
    },
  );
  return r.json();
}

// --- Token Verification ---

export async function verifyTokenPermissions(
  accountId: string,
  token: string,
): Promise<Array<{ permission: string; status: 'ok' | 'fail'; detail?: string }>> {
  const results: Array<{ permission: string; status: 'ok' | 'fail'; detail?: string }> = [];

  // Test 1: IP Prefixes Read
  let firstPrefixId: string | null = null;
  try {
    const r = await fetchWithRetry(
      `${CF_API}/accounts/${accountId}/addressing/prefixes`,
      { headers: authHeaders(token) },
    );
    const data = (await r.json()) as CfApiResponse<Array<{ id: string }>>;
    results.push({
      permission: 'IP Prefixes: Read',
      status: data.success ? 'ok' : 'fail',
      detail: data.success ? undefined : data.errors?.[0]?.message,
    });
    if (data.success && data.result && data.result.length > 0) {
      firstPrefixId = data.result[0].id;
    }
  } catch (e) {
    results.push({ permission: 'IP Prefixes: Read', status: 'fail', detail: String(e) });
  }

  // Test 2: BGP On Demand Read (requires a prefix to test against)
  if (firstPrefixId) {
    try {
      const r = await fetchWithRetry(
        `${CF_API}/accounts/${accountId}/addressing/prefixes/${firstPrefixId}/bgp/prefixes`,
        { headers: authHeaders(token) },
      );
      const data = (await r.json()) as CfApiResponse<unknown>;
      results.push({
        permission: 'BGP On Demand: Read',
        status: data.success ? 'ok' : 'fail',
        detail: data.success ? undefined : data.errors?.[0]?.message,
      });
    } catch (e) {
      results.push({ permission: 'BGP On Demand: Read', status: 'fail', detail: String(e) });
    }
  } else {
    results.push({
      permission: 'BGP On Demand: Read',
      status: 'fail',
      detail: 'No prefixes found to test against',
    });
  }

  // Test 3: Services Read (tests addressing scope)
  try {
    const r = await fetchWithRetry(
      `${CF_API}/accounts/${accountId}/addressing/services`,
      { headers: authHeaders(token) },
    );
    const data = (await r.json()) as CfApiResponse<unknown>;
    results.push({
      permission: 'Addressing Services: Read',
      status: data.success ? 'ok' : 'fail',
      detail: data.success ? undefined : data.errors?.[0]?.message,
    });
  } catch (e) {
    results.push({ permission: 'Addressing Services: Read', status: 'fail', detail: String(e) });
  }

  // Test 4: Audit Logs v2 read. NOTE: the v2 endpoint (/logs/audit) requires the
  // "Account Settings: Read" token permission — NOT the legacy "Audit Logs: Read".
  try {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const r = await fetchWithRetry(
      `${CF_API}/accounts/${accountId}/logs/audit?since=${encodeURIComponent(since.toISOString())}` +
        `&before=${encodeURIComponent(now.toISOString())}&limit=1`,
      { headers: authHeaders(token) },
    );
    const data = (await r.json().catch(() => null)) as CfApiResponse<unknown> | null;
    const ok = !!data?.success;
    results.push({
      permission: 'Audit Logs (Account Settings: Read)',
      status: ok ? 'ok' : 'fail',
      detail: ok ? undefined : (data?.errors?.[0]?.message || `HTTP ${r.status}`),
    });
  } catch (e) {
    results.push({ permission: 'Audit Logs (Account Settings: Read)', status: 'fail', detail: String(e) });
  }

  return results;
}

// --- Audit Logs (v2) ---

export interface AuditLogEntry {
  id: string;
  account?: { id?: string; name?: string };
  action?: { description?: string; result?: string; time?: string; type?: string };
  actor?: {
    context?: string;
    email?: string;
    id?: string;
    ip_address?: string;
    type?: string;
  };
  raw?: Record<string, unknown>;
  resource?: {
    id?: string;
    product?: string;
    scope?: string;
    type?: string;
    request?: unknown;
    response?: unknown;
  };
}

interface AuditLogListResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result: AuditLogEntry[];
  result_info?: { cursor?: string };
}

/**
 * List account audit logs (v2) between `since` and `before` (RFC3339), filtered to
 * addressing/prefix entries. Paginates via result_info.cursor up to a small page cap.
 */
export async function listAuditLogs(
  accountId: string,
  token: string,
  since: string,
  before: string,
  maxPages = 5,
): Promise<AuditLogEntry[]> {
  const out: AuditLogEntry[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    let url =
      `${CF_API}/accounts/${accountId}/logs/audit?since=${encodeURIComponent(since)}` +
      `&before=${encodeURIComponent(before)}&limit=100&direction=desc`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

    const r = await fetchWithRetry(url, { headers: authHeaders(token) });
    const data = (await r.json().catch(() => null)) as AuditLogListResponse | null;
    if (!data || !data.success) {
      const msg = data?.errors?.[0]?.message || `Audit log API error (HTTP ${r.status})`;
      throw new Error(msg);
    }

    for (const entry of data.result || []) {
      if (entry.resource?.product === 'addressing') out.push(entry);
    }

    cursor = data.result_info?.cursor;
    if (!cursor || !(data.result || []).length) break;
  }

  return out;
}

// --- Logpush (Audit Logs v2 streaming) ---

const AUDIT_LOGPUSH_DATASET = 'audit_logs_v2';

interface LogpushJobResult {
  id: number;
  dataset: string;
  enabled: boolean;
  name: string;
  destination_conf: string;
  last_complete: string | null;
  last_error: string | null;
  error_message: string | null;
}

/** List existing Logpush jobs for an account. */
export async function listLogpushJobs(
  accountId: string,
  token: string,
): Promise<CfApiResponse<LogpushJobResult[]>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/logpush/jobs`,
    { headers: authHeaders(token) },
  );
  return r.json();
}

/**
 * Create a Logpush job that streams the account's `audit_logs_v2` dataset to our
 * HTTP webhook. Auth is carried via a `header_cf-webhook-auth` URL parameter so
 * the destination reuses the existing webhook secret validation. Cloudflare
 * validates the destination on creation by POSTing a gzipped test payload.
 *
 * NOTE: Logpush for audit logs is an Enterprise feature and the token needs the
 * `Logs Write` permission; failures surface the Cloudflare error message.
 */
export async function createAuditLogpushJob(
  accountId: string,
  token: string,
  webhookUrl: string,
  webhookSecret: string,
  name = 'network-tools-audit-logs',
): Promise<CfApiResponse<LogpushJobResult>> {
  const destination_conf =
    `${webhookUrl}?header_cf-webhook-auth=${encodeURIComponent(webhookSecret)}`;

  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/logpush/jobs`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        name,
        dataset: AUDIT_LOGPUSH_DATASET,
        destination_conf,
        enabled: true,
        output_options: { timestamp_format: 'rfc3339' },
      }),
    },
  );
  return r.json();
}

/**
 * Build a map of prefix id -> CIDR covering both parent prefixes and their BGP
 * sub-prefixes, so audit-log resource IDs (which may be either) can be resolved.
 */
export async function buildPrefixCidrMap(
  accountId: string,
  token: string,
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const prefixResp = await listPrefixes(accountId, token);
  if (!prefixResp.success) return map;
  const prefixes = prefixResp.result || [];

  for (const p of prefixes) {
    if (p.id && p.cidr) map[p.id] = p.cidr;
  }

  const bgpResults = await Promise.all(
    prefixes.map(async (p) => {
      try {
        const bgpData = await listBgpPrefixes(accountId, p.id, token);
        return bgpData.success ? bgpData.result || [] : [];
      } catch {
        return [];
      }
    }),
  );
  for (const children of bgpResults) {
    for (const b of children) {
      if (b.id && b.cidr) map[b.id] = b.cidr;
    }
  }

  return map;
}

// --- Update Prefix Description ---

export async function updatePrefixDescription(
  accountId: string,
  prefixId: string,
  description: string,
  token: string,
): Promise<CfApiResponse<CfPrefix>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ description }),
    },
  );
  return r.json();
}

// --- Prefix Validation ---

export async function validatePrefix(
  accountId: string,
  prefixId: string,
  token: string,
): Promise<CfApiResponse<CfPrefix>> {
  const r = await fetchWithRetry(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/validate`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
  return r.json();
}

// --- Looking Glass (Cloudflare Radar) ---

export async function lookupBgpRoutes(prefix: string, token: string): Promise<LgResult> {
  const r = await fetchWithRetry(
    `${RADAR_API}/radar/bgp/routes/realtime?prefix=${encodeURIComponent(prefix)}`,
    { headers: authHeaders(token) },
  );
  const data = (await r.json()) as { success: boolean; result: LgResult };
  if (!data.success) {
    throw new Error('Radar API lookup failed');
  }
  return data.result;
}

// --- RPKI ROA Validation (RIPEstat) ---
// Uses RIPEstat's RPKI Validation endpoint which checks the actual ROA database
// (via Routinator), not BGP routing tables. This correctly finds ROAs even for
// prefixes that are not yet announced in BGP.

interface RipestatRpkiValidationResponse {
  status: string;
  data: {
    resource: string;
    prefix: string;
    validating_roas: Array<{
      origin: string;
      prefix: string;
      validity: string;
      max_length: number;
    }>;
    status: string; // 'valid', 'invalid_asn', 'invalid_length', 'unknown'
    validator: string;
  };
}

export async function lookupRpki(prefix: string, _token: string, asn?: number): Promise<RpkiLookupResult> {
  // Use the ASN if provided for targeted validation, otherwise just query the prefix
  const asnParam = asn ? `&resource=${asn}` : '&resource=0';
  const r = await fetchWithRetry(
    `https://stat.ripe.net/data/rpki-validation/data.json?prefix=${encodeURIComponent(prefix)}${asnParam}&sourceapp=prefix-mgr`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'prefix-mgr/1.0 (Cloudflare Worker)',
      },
    },
  );
  if (!r.ok) throw new Error(`RIPEstat RPKI validation lookup failed: ${r.status}`);
  const data = (await r.json()) as RipestatRpkiValidationResponse;

  if (data.status !== 'ok' || !data.data) {
    return { prefix_origins: [], data_time: '', total_peers: 0 };
  }

  const roas = data.data.validating_roas || [];
  const prefix_origins: RpkiPrefixOrigin[] = roas.map((roa) => ({
    origin: parseInt(roa.origin, 10) || 0,
    prefix: roa.prefix,
    rpki_validation: roa.validity || data.data.status || 'unknown',
    peer_count: 0, // Not available from this endpoint
  }));

  return {
    prefix_origins,
    data_time: '',
    total_peers: 0,
  };
}

// --- RIPEstat Visibility Lookup ---

interface RipestatVisibilityResponse {
  status: string;
  status_code: number;
  data: {
    visibilities: Array<{
      probe: {
        city: string;
        country: string;
        name: string;
        ipv4_peer_count: number;
        ipv6_peer_count: number;
        ixp: string;
      };
      ipv4_full_table_peer_count: number;
      ipv6_full_table_peer_count: number;
      ipv4_full_table_peers_not_seeing: Array<{ asn: number; ip: string }>;
      ipv6_full_table_peers_not_seeing: Array<{ asn: number; ip: string }>;
    }>;
    query_time: string;
    resource: string;
    related_prefixes: string[];
  };
}

function parseRipestatVisibility(
  data: RipestatVisibilityResponse,
  prefix: string,
): { result: RipestatVisibilityResult; allNotSeeing: boolean } {
  const isIPv6 = prefix.includes(':');
  const rrcs: RipestatVisibilityResult['rrcs'] = [];
  let totalSeeing = 0;
  let totalPeers = 0;

  for (const vis of data.data.visibilities) {
    const peerCount = isIPv6
      ? vis.ipv6_full_table_peer_count
      : vis.ipv4_full_table_peer_count;
    const notSeeing = isIPv6
      ? (vis.ipv6_full_table_peers_not_seeing?.length || 0)
      : (vis.ipv4_full_table_peers_not_seeing?.length || 0);
    const seeing = Math.max(0, peerCount - notSeeing);

    if (peerCount > 0) {
      rrcs.push({
        rrc: vis.probe.name,
        peers_seeing: seeing,
        total_peers: peerCount,
        location: vis.probe.city
          ? `${vis.probe.city}, ${vis.probe.country}`
          : vis.probe.country || '',
      });
      totalSeeing += seeing;
      totalPeers += peerCount;
    }
  }

  return {
    result: {
      rrcs,
      total_seeing: totalSeeing,
      total_peers: totalPeers,
      visibility: totalPeers > 0 ? totalSeeing / totalPeers : 0,
      query_time: data.data.query_time || '',
    },
    allNotSeeing: totalPeers > 0 && totalSeeing === 0,
  };
}

async function fetchRipestatVisibility(resource: string): Promise<RipestatVisibilityResponse> {
  const r = await fetchWithRetry(
    `https://stat.ripe.net/data/visibility/data.json?resource=${encodeURIComponent(resource)}&sourceapp=prefix-mgr`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'prefix-mgr/1.0 (Cloudflare Worker)',
      },
    },
  );
  if (!r.ok) throw new Error(`RIPEstat visibility lookup failed: ${r.status}`);
  const data = (await r.json()) as RipestatVisibilityResponse;
  if (data.status !== 'ok' || !data.data?.visibilities) {
    throw new Error('RIPEstat visibility data unavailable');
  }
  return data;
}

export async function lookupRipestatVisibility(prefix: string): Promise<RipestatVisibilityResult> {
  const data = await fetchRipestatVisibility(prefix);
  const { result, allNotSeeing } = parseRipestatVisibility(data, prefix);

  // If 0% visibility, the exact prefix may not be announced — RIPEstat requires
  // an exact prefix match. Check related_prefixes and retry with the first match.
  if (allNotSeeing && data.data.related_prefixes?.length > 0) {
    const related = data.data.related_prefixes[0];
    const retryData = await fetchRipestatVisibility(related);
    const retry = parseRipestatVisibility(retryData, related);
    // Tag the result so the UI knows we used a related prefix
    retry.result.query_time = (retry.result.query_time || '') +
      ' (using related prefix ' + related + ')';
    return retry.result;
  }

  return result;
}

// --- RDAP / Whois Lookup ---

interface RdapEntity {
  roles?: string[];
  vcardArray?: [string, Array<[string, Record<string, string>, string, string | string[]]>];
  port43?: string;
  links?: Array<{ href?: string }>;
  entities?: RdapEntity[];
}

interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

interface RdapResponse {
  name?: string;
  handle?: string;
  startAddress?: string;
  endAddress?: string;
  port43?: string;
  entities?: RdapEntity[];
  events?: RdapEvent[];
  links?: Array<{ href?: string }>;
}

function extractRir(data: RdapResponse): string {
  // Check port43 (whois server)
  if (data.port43) {
    const p = data.port43.toLowerCase();
    if (p.includes('arin')) return 'ARIN';
    if (p.includes('ripe')) return 'RIPE NCC';
    if (p.includes('apnic')) return 'APNIC';
    if (p.includes('lacnic')) return 'LACNIC';
    if (p.includes('afrinic')) return 'AFRINIC';
  }
  // Check top-level links
  if (data.links) {
    for (const link of data.links) {
      const href = (link.href || '').toLowerCase();
      if (href.includes('arin')) return 'ARIN';
      if (href.includes('ripe')) return 'RIPE NCC';
      if (href.includes('apnic')) return 'APNIC';
      if (href.includes('lacnic')) return 'LACNIC';
      if (href.includes('afrinic')) return 'AFRINIC';
    }
  }
  // Check nested entity links and port43
  if (data.entities) {
    for (const ent of data.entities) {
      if (ent.port43) {
        const p = ent.port43.toLowerCase();
        if (p.includes('arin')) return 'ARIN';
        if (p.includes('ripe')) return 'RIPE NCC';
        if (p.includes('apnic')) return 'APNIC';
        if (p.includes('lacnic')) return 'LACNIC';
        if (p.includes('afrinic')) return 'AFRINIC';
      }
      if (ent.links) {
        for (const link of ent.links) {
          const href = (link.href || '').toLowerCase();
          if (href.includes('arin')) return 'ARIN';
          if (href.includes('ripe')) return 'RIPE NCC';
          if (href.includes('apnic')) return 'APNIC';
          if (href.includes('lacnic')) return 'LACNIC';
          if (href.includes('afrinic')) return 'AFRINIC';
        }
      }
    }
  }
  return 'Unknown';
}

function extractFromVcard(
  entity: RdapEntity,
): { org: string; country: string } {
  const result = { org: '', country: '' };
  if (!entity.vcardArray || entity.vcardArray.length < 2) return result;
  const props = entity.vcardArray[1];
  for (const prop of props) {
    if (prop[0] === 'fn') {
      result.org = Array.isArray(prop[3]) ? prop[3].join(' ') : String(prop[3]);
    }
    if (prop[0] === 'adr') {
      // Try structured array first (index 6 = country)
      const val = prop[3];
      if (Array.isArray(val) && val.length >= 7 && val[6]) {
        result.country = String(val[6]);
      }
      // Fallback: parse from label string (ARIN style: "...\nCountry")
      if (!result.country && prop[1] && typeof prop[1] === 'object') {
        const label = (prop[1] as Record<string, string>).label || '';
        if (label) {
          const lines = label.split('\n').map((l: string) => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            result.country = lines[lines.length - 1];
          }
        }
      }
    }
  }
  return result;
}

function parseRdapResponse(data: RdapResponse): RdapResult {
  let org = '';
  let country = '';
  if (data.entities) {
    for (const ent of data.entities) {
      const info = extractFromVcard(ent);
      if (info.org && !org) org = info.org;
      if (info.country && !country) country = info.country;
    }
  }

  let allocated = '';
  if (data.events) {
    const reg = data.events.find((e) => e.eventAction === 'registration');
    if (reg) allocated = reg.eventDate.split('T')[0];
  }

  const range =
    data.startAddress && data.endAddress
      ? `${data.startAddress} - ${data.endAddress}`
      : '';

  return {
    name: data.name || data.handle || '',
    org,
    country,
    rir: extractRir(data),
    allocated,
    range,
  };
}

// Known RIR RDAP bootstrap endpoints to try if rdap.org fails
const RDAP_BOOTSTRAP_ENDPOINTS = [
  'https://rdap.arin.net/registry',
  'https://rdap.db.ripe.net',
];

export async function lookupRdap(prefix: string): Promise<RdapResult> {
  const ip = prefix.split('/')[0];
  const headers = {
    Accept: 'application/rdap+json',
    'User-Agent': 'prefix-mgr/1.0 (Cloudflare Worker)',
  };

  // Try rdap.org first (follows redirects to the correct RIR)
  try {
    const r = await fetch(`https://rdap.org/ip/${ip}`, { headers, redirect: 'follow' });
    if (r.ok) {
      const data = (await r.json()) as RdapResponse;
      const result = parseRdapResponse(data);
      if (result.rir !== 'Unknown') return result;
    }
  } catch {
    // Fall through to direct RIR queries
  }

  // Fallback: try known RIR RDAP endpoints directly
  for (const endpoint of RDAP_BOOTSTRAP_ENDPOINTS) {
    try {
      const r = await fetch(`${endpoint}/ip/${encodeURIComponent(ip)}`, { headers, redirect: 'follow' });
      if (r.ok) {
        const data = (await r.json()) as RdapResponse;
        const result = parseRdapResponse(data);
        if (result.rir !== 'Unknown') return result;
      }
    } catch {
      continue;
    }
  }

  throw new Error(`RDAP lookup failed for ${prefix}: could not determine RIR`);
}

// ── RIR API functions (ARIN + RIPE) ─────────────────────────────

const ARIN_IRR_API = 'https://reg.arin.net/rest/irr';
const ARIN_WHOIS_API = 'https://whois.arin.net/rest';
const RIPE_DB_API = 'https://rest.db.ripe.net';

/**
 * Look up admin-c and tech-c POC handles from ARIN Whois for a given Org ID.
 * GET https://whois.arin.net/rest/org/ORGID/pocs
 */
export async function lookupArinOrgPocs(orgId: string): Promise<{ adminC: string; techC: string } | null> {
  try {
    const r = await fetch(`${ARIN_WHOIS_API}/org/${encodeURIComponent(orgId)}/pocs`, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) return null;

    const data = await r.json() as { pocs?: { pocLinkRef?: Array<{ '@handle': string; '@function': string; '@description': string }> | { '@handle': string; '@function': string; '@description': string } } };
    let refs = data?.pocs?.pocLinkRef;
    if (!refs) return null;
    if (!Array.isArray(refs)) refs = [refs];

    let adminC = '';
    let techC = '';
    for (const ref of refs) {
      if (ref['@function'] === 'AD' || ref['@description'] === 'Admin') {
        if (!adminC) adminC = ref['@handle'];
      }
      if (ref['@function'] === 'T' || ref['@description'] === 'Tech') {
        if (!techC) techC = ref['@handle'];
      }
    }
    return (adminC || techC) ? { adminC: adminC || techC, techC: techC || adminC } : null;
  } catch {
    return null;
  }
}

/**
 * Validate ARIN credentials: check Org ID resolves to POC handles, and optionally test API key
 * against the IRR API.
 */
export async function validateArinCredentials(
  orgId: string,
  apiKey?: string,
): Promise<{ valid: boolean; orgName?: string; adminC?: string; techC?: string; apiKeyValid?: boolean; error?: string }> {
  // Step 1: Validate Org ID via Whois
  try {
    const orgResp = await fetch(`${ARIN_WHOIS_API}/org/${encodeURIComponent(orgId)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!orgResp.ok) {
      return { valid: false, error: `Org ID '${orgId}' not found at ARIN (HTTP ${orgResp.status}). Check the Org ID is correct (e.g., DC-403).` };
    }
    const orgData = await orgResp.json() as { org?: { orgName?: { $?: string }; handle?: { $?: string } } };
    const orgName = orgData?.org?.orgName?.['$'] || '';

    // Step 2: Look up POC handles
    const pocs = await lookupArinOrgPocs(orgId);
    if (!pocs) {
      return { valid: false, orgName, error: `Org '${orgId}' (${orgName}) found but no Admin/Tech POC handles. Ensure your org has Admin and Tech contacts registered at ARIN.` };
    }

    // Step 3: Optionally test API key against IRR
    let apiKeyValid: boolean | undefined;
    if (apiKey) {
      try {
        const testResp = await fetch(`${ARIN_IRR_API}/route/0.0.0.0/0/AS0`, {
          method: 'GET',
          headers: {
            Authorization: `ApiKey ${apiKey}`,
            Accept: 'application/rpsl',
          },
        });
        // 404 = key is valid (object doesn't exist, but auth succeeded)
        // 401/403 = bad key
        apiKeyValid = testResp.status !== 401 && testResp.status !== 403;
      } catch {
        apiKeyValid = undefined;
      }
    }

    return { valid: true, orgName, adminC: pocs.adminC, techC: pocs.techC, apiKeyValid };
  } catch (e: unknown) {
    return { valid: false, error: `ARIN validation failed: ${(e as Error).message}` };
  }
}

/**
 * Validate RIPE credentials: test API key by checking a known object.
 */
export async function validateRipeCredentials(
  apiKey: string,
  maintainer: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check if the maintainer object exists in RIPE DB (public, no auth needed)
    const r = await fetch(`${RIPE_DB_API}/ripe/mntner/${encodeURIComponent(maintainer)}.json`, {
      headers: { Accept: 'application/json' },
    });
    if (r.status === 404) return { valid: false, error: `Maintainer '${maintainer}' not found in RIPE database.` };
    if (r.ok) return { valid: true };
    return { valid: false, error: `RIPE returned HTTP ${r.status}.` };
  } catch (e: unknown) {
    return { valid: false, error: `RIPE validation failed: ${(e as Error).message}` };
  }
}

type ArinFormat = 'rpsl' | 'xml';
interface ArinFetchResult { resp: Response; format: ArinFormat }

/**
 * Make an ARIN IRR API call with automatic 406 fallback.
 * CF Workers in production return 406 for `Accept: application/rpsl` on sites
 * behind Cloudflare. We try RPSL first then XML, and return which format succeeded
 * so callers can use the matching format for writes.
 */
async function arinGet(url: string, apiKey: string): Promise<ArinFetchResult> {
  // Attempt 1: RPSL
  let resp = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `ApiKey ${apiKey}`, Accept: 'application/rpsl' },
  });
  if (resp.status !== 406) return { resp, format: 'rpsl' };

  // Attempt 2: XML
  resp = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `ApiKey ${apiKey}`, Accept: 'application/xml' },
  });
  return { resp, format: 'xml' };
}

/**
 * Create an ARIN object via POST with NO body (per ARIN docs — the object's primary
 * key is specified entirely in the URL path, and ARIN auto-populates POC/org info
 * from the authenticated API key). Returns the created object and which format worked.
 */
async function arinCreate(url: string, apiKey: string): Promise<ArinFetchResult> {
  // Attempt 1: RPSL accept
  let resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `ApiKey ${apiKey}`, Accept: 'application/rpsl' },
  });
  if (resp.status !== 406) return { resp, format: 'rpsl' };

  // Attempt 2: XML accept
  resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `ApiKey ${apiKey}`, Accept: 'application/xml' },
  });
  return { resp, format: 'xml' };
}

/**
 * Write to ARIN (PUT to modify, or POST to create with a payload) with automatic
 * 406 format fallback. Tries the preferred format first, then the other.
 */
async function arinWriteBody(
  url: string, method: 'PUT' | 'POST', apiKey: string,
  rpslBody: string, xmlBody: string, preferFormat: ArinFormat,
): Promise<Response> {
  const formats: ArinFormat[] = preferFormat === 'xml' ? ['xml', 'rpsl'] : ['rpsl', 'xml'];
  let lastResp: Response | null = null;
  for (const fmt of formats) {
    const ct = fmt === 'rpsl' ? 'application/rpsl' : 'application/xml';
    const body = fmt === 'rpsl' ? rpslBody : xmlBody;
    const resp = await fetch(url, {
      method,
      headers: { Authorization: `ApiKey ${apiKey}`, Accept: ct, 'Content-Type': ct },
      body,
    });
    lastResp = resp;
    if (resp.status !== 406) return resp;
  }
  return lastResp as Response;
}

// ── XML helpers for ARIN IRR payloads ──

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Build an ARIN aut-num XML payload for creation.
 * NOTE: the XML root element is `<autnum>` (lowercase n), per ARIN docs.
 * Unlike route objects, aut-num creation requires a full payload.
 */
function buildAutnumXml(
  asn: number, descriptionLines: string[],
  orgId: string, pocs: { adminC: string; techC: string },
): string {
  const descLines = descriptionLines
    .map((line, i) => `    <line number="${i}">${escapeXml(line)}</line>`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<autnum xmlns="http://www.arin.net/regrws/core/v1">',
    '  <description>',
    descLines,
    '  </description>',
    `  <orgHandle>${escapeXml(orgId)}</orgHandle>`,
    '  <pocLinks>',
    `    <pocLinkRef description="Admin" function="AD" handle="${escapeXml(pocs.adminC)}"/>`,
    `    <pocLinkRef description="Tech" function="T" handle="${escapeXml(pocs.techC)}"/>`,
    '  </pocLinks>',
    '  <source>ARIN</source>',
    `  <asName>AS${asn}</asName>`,
    `  <asNumber>AS${asn}</asNumber>`,
    '</autnum>',
  ].join('\n');
}

/** Check if body contains the validation token (works for both RPSL and XML text). */
function bodyHasToken(body: string, token: string): boolean {
  return body.includes(`cf-validation: ${token}`) || body.includes(`cf-validation:${token}`);
}

/**
 * Add the cf-validation token to an ARIN object body returned by GET or POST(create).
 * Handles both RPSL and XML formats and returns { rpsl, xml, format } so the caller
 * can PUT the object back in whichever format ARIN accepts.
 *
 * For RPSL: inserts a `descr: cf-validation: <token>` line after the object line.
 * For XML: inserts a <line> into the <description> block (creating one if absent).
 */
function addTokenToBody(
  body: string, format: ArinFormat, validationToken: string,
  objectType: string,
): { rpsl: string; xml: string } {
  const tokenText = `cf-validation: ${validationToken}`;

  if (format === 'rpsl') {
    let modified = body.replace(/^descr:\s*cf-validation:.*\n?/gm, '');
    const tokenLine = `descr: ${tokenText}`;
    const lineMatch = modified.match(new RegExp(`^${objectType}:\\s+.*$`, 'm'));
    if (lineMatch) {
      const idx = modified.indexOf(lineMatch[0]) + lineMatch[0].length;
      modified = modified.slice(0, idx) + '\n' + tokenLine + modified.slice(idx);
    } else {
      modified = tokenLine + '\n' + modified;
    }
    return { rpsl: modified, xml: modified };
  }

  // XML format: modify (or create) the <description> block
  let modified = body;
  // Remove any existing cf-validation <line> entries
  modified = modified.replace(/\s*<line\s+number="\d+">\s*cf-validation:[\s\S]*?<\/line>/g, '');

  if (/<description\s*>/.test(modified) && modified.includes('</description>')) {
    // Existing non-empty description block — append a new numbered line
    const lineNumbers = [...modified.matchAll(/<line\s+number="(\d+)">/g)].map(m => parseInt(m[1], 10));
    const nextNum = lineNumbers.length > 0 ? Math.max(...lineNumbers) + 1 : 0;
    const newLine = `    <line number="${nextNum}">${escapeXml(tokenText)}</line>`;
    modified = modified.replace('</description>', `${newLine}\n  </description>`);
  } else {
    // No description block (or self-closing) — create one right after the root open tag
    const descBlock = `\n  <description>\n    <line number="0">${escapeXml(tokenText)}</line>\n  </description>`;
    // Remove any self-closing empty description first
    modified = modified.replace(/<description\s*\/>/g, '');
    // Insert after the first root element opening tag (e.g. <route ...> or <autNum ...>)
    modified = modified.replace(/(<(?:route|route6|autNum)\b[^>]*>)/, `$1${descBlock}`);
  }

  return { rpsl: body, xml: modified };
}

/**
 * Ensure a route/route6 object exists at ARIN IRR with the validation token.
 * Per ARIN docs:
 *   - Create = POST with NO body (object key is fully specified by the URL path;
 *     ARIN auto-populates POC/org info from the authenticated API key).
 *   - Modify = PUT with the RPSL/XML payload.
 * Flow: GET → if present, add token + PUT. If absent, POST(no body) to create,
 * then add token to the returned object + PUT.
 */
export async function ensureArinRouteObject(
  prefix: string,
  originAsn: number,
  validationToken: string,
  apiKey: string,
  _orgId: string,
): Promise<RirApiResult> {
  try {
    const [ip, mask] = prefix.split('/');
    const isV6 = ip.includes(':');
    const objectType = isV6 ? 'route6' : 'route';
    // ARIN IRR API always uses /route/ in the URL path for both IPv4 and IPv6
    const url = `${ARIN_IRR_API}/route/${ip}/${mask}/AS${originAsn}`;

    // Step 1: GET the existing object
    const { resp: getResp, format } = await arinGet(url, apiKey);

    if (getResp.ok) {
      const body = await getResp.text();

      if (bodyHasToken(body, validationToken)) {
        return { ok: true, action: 'already_present', details: 'Validation token already present in route object.' };
      }

      // Add the token and PUT back in the format that worked
      const { rpsl, xml } = addTokenToBody(body, format, validationToken, objectType);
      const putResp = await arinWriteBody(url, 'PUT', apiKey, rpsl, xml, format);
      if (putResp.ok) return { ok: true, action: 'updated', details: 'Updated existing route object with validation token.' };
      const putBody = await putResp.text();
      return { ok: false, error: `ARIN PUT ${objectType} returned ${putResp.status}`, details: putBody };
    }

    // 404/406 = object not found
    if (getResp.status !== 404 && getResp.status !== 406) {
      const respBody = await getResp.text();
      return { ok: false, error: `ARIN GET ${objectType} returned ${getResp.status}`, details: respBody };
    }

    // Step 2: Create the object — POST with NO body (ARIN auto-fills POC/org info)
    const { resp: createResp, format: createFormat } = await arinCreate(url, apiKey);
    if (!createResp.ok) {
      const createBody = await createResp.text();
      return { ok: false, error: `ARIN POST ${objectType} returned ${createResp.status}`, details: createBody };
    }

    // Step 3: Add the validation token to the created object and PUT it back
    const createdBody = await createResp.text();
    const { rpsl, xml } = addTokenToBody(createdBody, createFormat, validationToken, objectType);
    const putResp = await arinWriteBody(url, 'PUT', apiKey, rpsl, xml, createFormat);
    if (putResp.ok) return { ok: true, action: 'created', details: 'Created route object and added validation token.' };
    const putBody = await putResp.text();
    return { ok: true, action: 'created', details: `Created route object but failed to add validation token (PUT ${putResp.status}). Add it manually.` };
  } catch (e: unknown) {
    return { ok: false, error: `ARIN route operation failed: ${(e as Error).message}` };
  }
}

/**
 * Ensure an aut-num object exists at ARIN IRR with the validation token.
 * 1. GET the object — if it exists, add/update the cf-validation descr line via PUT.
 * 2. If it does not exist (404), create it via POST with all required ARIN fields.
 */
export async function ensureArinAutnum(
  asn: number,
  validationToken: string,
  apiKey: string,
  orgId: string,
): Promise<RirApiResult> {
  try {
    const url = `${ARIN_IRR_API}/aut-num/AS${asn}`;

    // Step 1: GET the existing object
    const { resp: getResp, format } = await arinGet(url, apiKey);

    if (getResp.ok) {
      const body = await getResp.text();

      if (bodyHasToken(body, validationToken)) {
        return { ok: true, action: 'already_present', details: 'Token already present in aut-num object.' };
      }

      const { rpsl, xml } = addTokenToBody(body, format, validationToken, 'aut-num');
      const putResp = await arinWriteBody(url, 'PUT', apiKey, rpsl, xml, format);
      if (putResp.ok) return { ok: true, action: 'updated', details: 'Updated existing aut-num object with validation token.' };
      return { ok: false, error: `ARIN PUT aut-num returned ${putResp.status}`, details: await putResp.text() };
    }

    // 400/404/406 = object not found → fall through to create.
    // (ARIN returns 404/406 for missing objects; some deployments behind
    // Cloudflare surface a 400 for the same "does not exist" condition.)
    if (getResp.status !== 400 && getResp.status !== 404 && getResp.status !== 406) {
      return { ok: false, error: `ARIN GET aut-num returned ${getResp.status}`, details: await getResp.text() };
    }

    // Step 2: Create via POST WITH a payload.
    // Unlike route objects, aut-num creation requires a full RPSL/XML payload.
    // Look up the Org's Admin/Tech POC handles; fall back to the fuller
    // credential validation (which also resolves POCs) if the direct lookup
    // fails, so a transient/parse hiccup doesn't block auto-creation.
    let pocs = await lookupArinOrgPocs(orgId);
    if (!pocs) {
      const validation = await validateArinCredentials(orgId, apiKey);
      if (validation.adminC || validation.techC) {
        const adminC = validation.adminC || validation.techC || '';
        const techC = validation.techC || validation.adminC || '';
        pocs = { adminC, techC };
      } else {
        const detail = validation.error || 'No Admin/Tech POC handles found for this Org.';
        return { ok: false, error: `Could not look up POC handles for Org ${orgId}: ${detail}` };
      }
    }

    const tokenText = `cf-validation: ${validationToken}`;
    const rpslBody = [
      `aut-num: AS${asn}`,
      `as-name: AS${asn}`,
      `descr: ${tokenText}`,
      `admin-c: ${pocs.adminC}`,
      `tech-c: ${pocs.techC}`,
      `mnt-by: MNT-${orgId}`,
      `source: ARIN`,
    ].join('\n');
    const xmlBody = buildAutnumXml(asn, [tokenText], orgId, pocs);

    const postResp = await arinWriteBody(url, 'POST', apiKey, rpslBody, xmlBody, format);
    if (postResp.ok) return { ok: true, action: 'created', details: 'Created new aut-num object with validation token.' };
    const postBody = await postResp.text();
    return { ok: false, error: `ARIN POST aut-num returned ${postResp.status}`, details: postBody };
  } catch (e: unknown) {
    return { ok: false, error: `ARIN aut-num operation failed: ${(e as Error).message}` };
  }
}

/**
 * Create a route or route6 object at RIPE DB.
 * POST /ripe/route (or /ripe/route6)
 * Uses JSON payload with the WhoisResource format.
 */
export async function createRipeRouteObject(
  prefix: string,
  originAsn: number,
  validationToken: string,
  apiKey: string,
  maintainer: string,
): Promise<RirApiResult> {
  try {
    const isV6 = prefix.includes(':');
    const objectType = isV6 ? 'route6' : 'route';
    const url = `${RIPE_DB_API}/ripe/${objectType}`;

    const attributes = [
      { name: objectType, value: prefix },
      { name: 'descr', value: `cf-validation: ${validationToken}` },
      { name: 'origin', value: `AS${originAsn}` },
      { name: 'mnt-by', value: maintainer },
      { name: 'source', value: 'RIPE' },
    ];

    const body = {
      objects: {
        object: [
          {
            type: objectType,
            source: { id: 'ripe' },
            attributes: { attribute: attributes },
          },
        ],
      },
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (r.ok) return { ok: true };

    const data = await r.json().catch(() => null);
    const errMsg = extractRipeError(data);
    return {
      ok: false,
      error: `RIPE returned ${r.status}`,
      details: errMsg || (await r.text().catch(() => '')),
    };
  } catch (e: unknown) {
    return { ok: false, error: `RIPE request failed: ${(e as Error).message}` };
  }
}

/**
 * Update an existing route/route6 object at RIPE DB to add the validation token.
 * GET then PUT the WhoisResource JSON.
 */
export async function updateRipeRouteObject(
  prefix: string,
  originAsn: number,
  validationToken: string,
  apiKey: string,
  maintainer: string,
): Promise<RirApiResult> {
  try {
    const isV6 = prefix.includes(':');
    const objectType = isV6 ? 'route6' : 'route';
    const url = `${RIPE_DB_API}/ripe/${objectType}/${encodeURIComponent(prefix)}AS${originAsn}`;

    // Step 1: GET existing object
    const getResp = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!getResp.ok) {
      if (getResp.status === 404) {
        return { ok: false, error: `${objectType} object not found at RIPE.` };
      }
      return { ok: false, error: `RIPE GET ${objectType} returned ${getResp.status}` };
    }

    const data = await getResp.json() as { objects?: { object?: Array<{ attributes?: { attribute?: Array<{ name: string; value: string }> } }> } };
    const obj = data?.objects?.object?.[0];
    if (!obj?.attributes?.attribute) {
      return { ok: false, error: 'Could not parse existing RIPE route object' };
    }

    // Step 2: Check if token already present
    const existing = obj.attributes.attribute;
    const hasToken = existing.some((a: { name: string; value: string }) => a.name === 'descr' && a.value.includes(`cf-validation: ${validationToken}`));
    if (hasToken) {
      return { ok: true, details: 'Validation token already present.' };
    }

    // Step 3: Remove old cf-validation descr lines and add the new one
    const filtered = existing.filter((a: { name: string; value: string }) => !(a.name === 'descr' && a.value.includes('cf-validation:')));
    // Insert after the first descr or after the object type line
    const insertIdx = filtered.findIndex((a: { name: string; value: string }) => a.name === 'descr');
    const tokenAttr = { name: 'descr', value: `cf-validation: ${validationToken}` };
    if (insertIdx >= 0) {
      filtered.splice(insertIdx + 1, 0, tokenAttr);
    } else {
      filtered.splice(1, 0, tokenAttr);
    }

    // Step 4: PUT updated object
    const putBody = {
      objects: {
        object: [
          {
            type: objectType,
            source: { id: 'ripe' },
            attributes: { attribute: filtered },
          },
        ],
      },
    };

    const putResp = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(putBody),
    });

    if (putResp.ok) return { ok: true };

    const errData = await putResp.json().catch(() => null);
    const errMsg = extractRipeError(errData);
    return { ok: false, error: `RIPE PUT ${objectType} returned ${putResp.status}`, details: errMsg || '' };
  } catch (e: unknown) {
    return { ok: false, error: `RIPE route update failed: ${(e as Error).message}` };
  }
}

/**
 * Fetch an existing aut-num object from RIPE and add a descr line with the validation token.
 * GET then PUT /ripe/aut-num/ASN
 */
export async function updateRipeAutnum(
  asn: number,
  validationToken: string,
  apiKey: string,
  maintainer: string,
): Promise<RirApiResult> {
  try {
    const url = `${RIPE_DB_API}/ripe/aut-num/AS${asn}`;

    // Step 1: GET existing aut-num
    const getResp = await fetch(`${url}.json`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!getResp.ok) {
      if (getResp.status === 404) {
        return { ok: false, error: 'aut-num object not found in RIPE DB.' };
      }
      return { ok: false, error: `RIPE GET aut-num returned ${getResp.status}`, details: await getResp.text() };
    }

    const data = (await getResp.json()) as {
      objects?: {
        object?: Array<{
          type?: string;
          source?: { id: string };
          attributes?: { attribute: Array<{ name: string; value: string }> };
        }>;
      };
    };

    const obj = data?.objects?.object?.[0];
    if (!obj?.attributes?.attribute) {
      return { ok: false, error: 'Could not parse RIPE aut-num object.' };
    }

    // Step 2: Check if token already present
    const existingDescrs = obj.attributes.attribute.filter(
      (a) => a.name === 'descr' && a.value.includes(`cf-validation: ${validationToken}`),
    );
    if (existingDescrs.length > 0) {
      return { ok: true, details: 'Token already present in aut-num object.' };
    }

    // Step 3: Add descr line after existing descr lines (or after aut-num line)
    const attrs = [...obj.attributes.attribute];
    let insertIdx = attrs.findIndex((a) => a.name === 'aut-num');
    if (insertIdx === -1) insertIdx = 0;
    // Find the last descr line after aut-num to insert after it
    for (let i = insertIdx + 1; i < attrs.length; i++) {
      if (attrs[i].name === 'descr') insertIdx = i;
      else if (attrs[i].name !== 'descr') break;
    }
    attrs.splice(insertIdx + 1, 0, {
      name: 'descr',
      value: `cf-validation: ${validationToken}`,
    });

    // Step 4: PUT updated object
    const putBody = {
      objects: {
        object: [
          {
            type: obj.type || 'aut-num',
            source: obj.source || { id: 'ripe' },
            attributes: { attribute: attrs },
          },
        ],
      },
    };

    const putResp = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(putBody),
    });

    if (putResp.ok) return { ok: true };

    const errData = await putResp.json().catch(() => null);
    const errMsg = extractRipeError(errData);
    return {
      ok: false,
      error: `RIPE PUT aut-num returned ${putResp.status}`,
      details: errMsg || '',
    };
  } catch (e: unknown) {
    return { ok: false, error: `RIPE aut-num update failed: ${(e as Error).message}` };
  }
}

/**
 * Look up an admin-c/tech-c contact handle (nic-hdl) for a RIPE maintainer by
 * reading the mntner object's `admin-c` attribute. Used to populate the mandatory
 * admin-c/tech-c fields when creating a new aut-num object.
 */
export async function lookupRipeMntnerContact(maintainer: string): Promise<string | null> {
  try {
    const r = await fetch(`${RIPE_DB_API}/ripe/mntner/${encodeURIComponent(maintainer)}.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) return null;
    const data = (await r.json()) as {
      objects?: { object?: Array<{ attributes?: { attribute?: Array<{ name: string; value: string }> } }> };
    };
    const attrs = data?.objects?.object?.[0]?.attributes?.attribute;
    if (!attrs) return null;
    const adminC = attrs.find((a) => a.name === 'admin-c');
    return adminC?.value || null;
  } catch {
    return null;
  }
}

/**
 * Create a new aut-num object at RIPE DB with the validation token.
 * POST /ripe/aut-num — uses the WhoisResource JSON format.
 * admin-c/tech-c are mandatory; they are derived from the maintainer's admin-c.
 */
export async function createRipeAutnum(
  asn: number,
  validationToken: string,
  apiKey: string,
  maintainer: string,
): Promise<RirApiResult> {
  try {
    const contact = await lookupRipeMntnerContact(maintainer);
    if (!contact) {
      return {
        ok: false,
        error: `Could not derive an admin-c/tech-c contact from maintainer '${maintainer}'. Create the aut-num object manually at RIPE, or add an admin-c to the maintainer.`,
      };
    }

    const url = `${RIPE_DB_API}/ripe/aut-num`;
    const attributes = [
      { name: 'aut-num', value: `AS${asn}` },
      { name: 'as-name', value: `AS${asn}` },
      { name: 'descr', value: `cf-validation: ${validationToken}` },
      { name: 'admin-c', value: contact },
      { name: 'tech-c', value: contact },
      { name: 'mnt-by', value: maintainer },
      { name: 'source', value: 'RIPE' },
    ];

    const body = {
      objects: {
        object: [
          {
            type: 'aut-num',
            source: { id: 'ripe' },
            attributes: { attribute: attributes },
          },
        ],
      },
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (r.ok) return { ok: true, action: 'created', details: 'Created new aut-num object with validation token.' };

    const data = await r.json().catch(() => null);
    const errMsg = extractRipeError(data);
    return {
      ok: false,
      error: `RIPE POST aut-num returned ${r.status}`,
      details: errMsg || (await r.text().catch(() => '')),
    };
  } catch (e: unknown) {
    return { ok: false, error: `RIPE aut-num create failed: ${(e as Error).message}` };
  }
}

/** Extract human-readable error from RIPE REST API JSON error response. */
function extractRipeError(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as { errormessages?: { errormessage?: Array<{ text?: string; args?: Array<{ value?: string }> }> } };
  if (!d.errormessages?.errormessage) return '';
  return d.errormessages.errormessage
    .map((em) => {
      let msg = em.text || '';
      if (em.args) {
        em.args.forEach((arg, i) => {
          msg = msg.replace(`%s`, arg.value || '');
        });
      }
      return msg;
    })
    .filter(Boolean)
    .join('; ');
}

/** Normalize RIR name from RDAP extractRir() output to lowercase 'arin' | 'ripe' | other. */
export function normalizeRirName(rir: string): string {
  const lower = rir.toLowerCase();
  if (lower.includes('arin')) return 'arin';
  if (lower.includes('ripe')) return 'ripe';
  if (lower.includes('apnic')) return 'apnic';
  if (lower.includes('afrinic')) return 'afrinic';
  if (lower.includes('lacnic')) return 'lacnic';
  return lower;
}
