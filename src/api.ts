import type {
  CfApiResponse,
  CfPrefix,
  CfBgpPrefix,
  CfServiceBinding,
  CfService,
  LgResult,
  RdapResult,
} from './types';

const CF_API = 'https://api.cloudflare.com/client/v4';
const RADAR_API = 'https://api.cloudflare.com/client/v4';

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// --- Addressing Prefixes ---

export async function listPrefixes(
  accountId: string,
  token: string,
): Promise<CfApiResponse<CfPrefix[]>> {
  const r = await fetch(
    `${CF_API}/accounts/${accountId}/addressing/prefixes`,
    { headers: authHeaders(token) },
  );
  return r.json();
}

export async function listBgpPrefixes(
  accountId: string,
  prefixId: string,
  token: string,
): Promise<CfApiResponse<CfBgpPrefix[]>> {
  const r = await fetch(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/bgp/prefixes`,
    { headers: authHeaders(token) },
  );
  return r.json();
}

export async function listServiceBindings(
  accountId: string,
  prefixId: string,
  token: string,
): Promise<CfApiResponse<CfServiceBinding[]>> {
  const r = await fetch(
    `${CF_API}/accounts/${accountId}/addressing/prefixes/${prefixId}/bindings`,
    { headers: authHeaders(token) },
  );
  return r.json();
}

export async function listServices(
  accountId: string,
  token: string,
): Promise<CfApiResponse<CfService[]>> {
  const r = await fetch(
    `${CF_API}/accounts/${accountId}/addressing/services`,
    { headers: authHeaders(token) },
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
  const r = await fetch(
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
    const r = await fetch(
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
      const r = await fetch(
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
    const r = await fetch(
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

// --- Prefix Validation ---

export async function validatePrefix(
  accountId: string,
  prefixId: string,
  token: string,
): Promise<CfApiResponse<CfPrefix>> {
  const r = await fetch(
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
  const r = await fetch(
    `${RADAR_API}/radar/bgp/routes/realtime?prefix=${encodeURIComponent(prefix)}`,
    { headers: authHeaders(token) },
  );
  const data = (await r.json()) as { success: boolean; result: LgResult };
  if (!data.success) {
    throw new Error('Radar API lookup failed');
  }
  return data.result;
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
