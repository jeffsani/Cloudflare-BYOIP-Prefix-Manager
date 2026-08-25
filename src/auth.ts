import { Context, Next } from 'hono';
import type { Env } from './types';

type AppEnv = { Bindings: Env; Variables: { userEmail: string } };

/**
 * Cloudflare Access authentication middleware.
 *
 * In production the worker sits behind a CF Access Application. Rather than
 * trusting the `Cf-Access-Jwt-Assertion` header blindly, we cryptographically
 * verify it: RS256 signature against the team's JWKS, plus issuer, audience
 * (AUD tag) and expiry. This is defense-in-depth so a request that reaches the
 * worker without passing through Access (e.g. a too-broad bypass policy) can't
 * forge an identity by setting the header.
 */
export async function accessAuthMiddleware(c: Context<AppEnv>, next: Next) {
  if (c.req.path === '/health' || c.req.path === '/favicon.ico' ||
      c.req.path === '/api/openapi.json' || c.req.path === '/api/docs') {
    return next();
  }

  // Machine-facing routes are not protected by CF Access — they carry their own
  // auth (per-account API keys / the cf-webhook-auth secret), enforced by
  // dedicated middleware in machine-auth.ts.
  if (c.req.path.startsWith('/api/public/') || c.req.path.startsWith('/webhooks/')) {
    return next();
  }

  if (c.env.ENVIRONMENT !== 'production') {
    c.set('userEmail', 'dev@localhost');
    return next();
  }

  const teamDomain = c.env.CF_ACCESS_TEAM_DOMAIN;
  const aud = c.env.CF_ACCESS_AUD;
  if (!teamDomain || !aud) {
    // Fail closed: without config we cannot verify the token. Set both
    // CF_ACCESS_TEAM_DOMAIN (var) and CF_ACCESS_AUD (secret) before deploying.
    console.error('CF Access not configured: CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD are required.');
    return c.text('Server auth misconfiguration', 500);
  }

  const jwtAssertion = c.req.header('Cf-Access-Jwt-Assertion');
  if (!jwtAssertion) {
    return c.text('Unauthorized — no CF Access token', 401);
  }

  try {
    const payload = await verifyAccessJwt(jwtAssertion, teamDomain, aud);
    if (!payload) {
      return c.text('Unauthorized — invalid CF Access token', 401);
    }
    if (!payload.email) {
      return c.text('Unauthorized — no email in token', 401);
    }
    c.set('userEmail', payload.email);
    return next();
  } catch (err) {
    console.error('Access auth error:', err);
    return c.text('Auth error', 500);
  }
}

// ─── CF Access JWT verification ─────────────────────────────────────

interface AccessJwtPayload {
  email?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  [k: string]: unknown;
}

// In-memory JWKS cache (per isolate). Keys rarely rotate, so a short TTL keeps
// per-request latency near zero while still picking up rotations promptly.
const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour
const jwksCache = new Map<string, { keys: Map<string, CryptoKey>; fetchedAt: number }>();

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeJson<T>(b64url: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(b64url))) as T;
}

async function getSigningKey(teamDomain: string, kid: string): Promise<CryptoKey | null> {
  const certsUrl = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;
  const cached = jwksCache.get(certsUrl);
  const fresh = cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS;

  if (fresh && cached!.keys.has(kid)) return cached!.keys.get(kid)!;

  // Cache miss, stale, or unknown kid (possible rotation) → refetch.
  const resp = await fetch(certsUrl, { cf: { cacheTtl: 3600, cacheEverything: true } as RequestInitCfProperties });
  if (!resp.ok) {
    // Fall back to any still-cached key so a transient JWKS outage doesn't
    // lock everyone out; otherwise give up.
    return cached?.keys.get(kid) ?? null;
  }
  const jwks = (await resp.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
  const keys = new Map<string, CryptoKey>();
  for (const jwk of jwks.keys || []) {
    if (!jwk.kid || jwk.kty !== 'RSA') continue;
    try {
      const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      keys.set(jwk.kid, key);
    } catch {
      // Skip keys that fail to import.
    }
  }
  jwksCache.set(certsUrl, { keys, fetchedAt: Date.now() });
  return keys.get(kid) ?? null;
}

/**
 * Verify a Cloudflare Access JWT. Returns the payload on success, or null if
 * the token is structurally invalid, unsigned by a known key, expired, or has
 * the wrong issuer/audience.
 */
async function verifyAccessJwt(
  token: string,
  teamDomain: string,
  aud: string,
): Promise<AccessJwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  let header: { alg?: string; kid?: string };
  let payload: AccessJwtPayload;
  try {
    header = decodeJson(headerB64);
    payload = decodeJson<AccessJwtPayload>(payloadB64);
  } catch {
    return null;
  }

  if (header.alg !== 'RS256' || !header.kid) return null;

  const key = await getSigningKey(teamDomain, header.kid);
  if (!key) return null;

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToBytes(sigB64);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data);
  if (!valid) return null;

  // Claim checks (allow small clock skew).
  const now = Math.floor(Date.now() / 1000);
  const skew = 60;
  if (typeof payload.exp === 'number' && payload.exp + skew < now) return null;
  if (typeof payload.nbf === 'number' && payload.nbf - skew > now) return null;

  const expectedIss = `https://${teamDomain}.cloudflareaccess.com`;
  if (payload.iss !== expectedIss) return null;

  const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  if (!audiences.includes(aud)) return null;

  return payload;
}
