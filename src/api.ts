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

// --- IRR Lookup (RIPEstat whois) ---

interface RipestatWhoisResponse {
  status: string;
  data: {
    records: Array<Array<{ key: string; value: string }>>;
  };
}

export async function lookupIrrRecords(prefix: string): Promise<IrrLookupResult> {
  const r = await fetchWithRetry(
    `https://stat.ripe.net/data/whois/data.json?resource=${encodeURIComponent(prefix)}&sourceapp=network-tools`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'network-tools/1.0 (Cloudflare Worker)',
      },
    },
  );
  if (!r.ok) throw new Error(`RIPEstat whois lookup failed: ${r.status}`);
  const data = (await r.json()) as RipestatWhoisResponse;
  if (data.status !== 'ok' || !data.data?.records) {
    return { records: [], data_source: 'ripestat' };
  }

  const records: IrrRecord[] = [];
  for (const recordGroup of data.data.records) {
    let source = '';
    let recordPrefix = '';
    let origin = '';
    for (const field of recordGroup) {
      if (field.key === 'source') source = field.value;
      if (field.key === 'route' || field.key === 'route6') recordPrefix = field.value;
      if (field.key === 'origin') origin = field.value;
    }
    if (recordPrefix && origin) {
      records.push({ source, prefix: recordPrefix, origin });
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
        'User-Agent': 'network-tools/1.0 (Cloudflare Worker)',
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

  return results;
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

// --- RPKI ROA Lookup (Cloudflare Radar) ---

export async function lookupRpki(prefix: string, token: string): Promise<RpkiLookupResult> {
  const r = await fetchWithRetry(
    `${RADAR_API}/radar/bgp/routes/pfx2as?prefix=${encodeURIComponent(prefix)}`,
    { headers: authHeaders(token) },
  );
  const data = (await r.json()) as {
    success: boolean;
    result: {
      meta: { data_time: string; total_peers: number };
      prefix_origins: RpkiPrefixOrigin[];
    };
  };
  if (!data.success) {
    throw new Error('Radar RPKI lookup failed');
  }
  return {
    prefix_origins: data.result.prefix_origins || [],
    data_time: data.result.meta?.data_time || '',
    total_peers: data.result.meta?.total_peers || 0,
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
    `https://stat.ripe.net/data/visibility/data.json?resource=${encodeURIComponent(resource)}&sourceapp=network-tools`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'network-tools/1.0 (Cloudflare Worker)',
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
  if (data.port43) {
    const p = data.port43.toLowerCase();
    if (p.includes('arin')) return 'ARIN';
    if (p.includes('ripe')) return 'RIPE NCC';
    if (p.includes('apnic')) return 'APNIC';
    if (p.includes('lacnic')) return 'LACNIC';
    if (p.includes('afrinic')) return 'AFRINIC';
  }
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

export async function lookupRdap(prefix: string): Promise<RdapResult> {
  const ip = prefix.split('/')[0];
  const r = await fetch(`https://rdap.org/ip/${ip}`, {
    headers: {
      Accept: 'application/rdap+json',
      'User-Agent': 'network-tools/1.0 (Cloudflare Worker)',
    },
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`RDAP lookup failed: ${r.status}`);
  const data = (await r.json()) as RdapResponse;

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
