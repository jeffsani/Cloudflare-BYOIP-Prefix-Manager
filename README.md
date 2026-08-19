# Prefix Manager — BYOIP Prefix Manager

A Cloudflare Workers dashboard for viewing, managing, and monitoring BYOIP (Bring Your Own IP) prefixes across multiple Cloudflare accounts. Built with Hono, server-rendered HTML, and vanilla JavaScript.

**Live:** [prefix-mgr.example.com](https://prefix-mgr.example.com) (Cloudflare Access — Google IdP)

![Prefix Manager Dashboard](src/network-tools.png)

## Features

### Prefix Management
- **Add Prefix** — Onboard new BYOIP prefixes with CIDR input, ASN selection (Cloudflare 13335 or custom), LOA upload/auto-generation, pre-submission IRR/ROA validation (via RIPEstat + IRR Explorer + Cloudflare Radar), and ownership validation guidance with automated IRR route/route6 object creation and aut-num updates at ARIN and RIPE (auto-detected via RDAP)
- **Prefix Table** — View all BYOIP prefixes with CIDR, ASN, advertisement status, IRR/RPKI validation state, lock status, and description
- **Expandable Rows** — Click any prefix to drill into its BGP sub-prefixes and service bindings in a tree view
- **Filters** — Filter the table by advertisement status (advertised/withdrawn), lock state, ASN, and tags
- **Tag-Based Filtering** — Add `#tags` to prefix descriptions (e.g. `My prefix #production #us-east`) to organize prefixes. Tags appear as clickable badges in the description column and auto-populate a Tag filter dropdown. Click any tag badge to instantly filter by that tag
- **Advertisement Toggle** — Advertise or withdraw individual BGP sub-prefixes with a toggle switch and confirmation dialog; all changes are logged to an activity feed

### Looking Glass
- **BGP Route Visualization** — Click the search icon on any prefix or sub-prefix to open the looking glass modal
- **AS-Path Graph** — SVG-rendered graph showing BGP routing paths from origin to collectors, with RPKI validation coloring and ASN metadata (org name, country flag)
- **Route Table** — Tabular view of raw BGP routes including collector, AS path, next hop, and peer ASN

![Looking Glass — AS-Path Graph](src/looking-glass.png)

### Multi-Account & Multi-Token
- **Per-User Accounts** — Each user (identified via Cloudflare Access JWT with Google IdP) can configure multiple Cloudflare accounts, each with its own label and account ID
- **Multi-Token Load Balancing** — Add multiple API tokens per account to distribute API requests via round-robin and avoid the Cloudflare API rate limit (1200 requests per endpoint per 5-minute window per token). Write operations (advertisement toggle) always use the first token for consistency.
- **Token Testing** — Test any token's permissions before saving, with inline badge feedback for IP Prefixes Read and Addressing Services Read

### UI
- **Dark/Light Theme** — Toggle between dark and light mode (persisted in localStorage)
- **Responsive** — Works on desktop and mobile; stats row collapses to 2-column grid on small screens
- **User Display** — Logged-in user email displayed in the header toolbar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers |
| Framework | [Hono](https://hono.dev/) v4.6+ with [chanfana](https://chanfana.pages.dev/) OpenAPI |
| Frontend | Server-rendered HTML + vanilla JS |
| CSS | Tailwind CSS (CDN) + CSS custom properties |
| Database | Cloudflare D1 (SQLite) |
| Auth | Cloudflare Access (Zero Trust) with Google IdP |
| Build | Wrangler v4 |
| Language | TypeScript 5.9+ |

## Setup

### Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- A Cloudflare account with BYOIP prefixes

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/prefix-mgr.git
cd prefix-mgr
npm install
```

### 2. Configure Wrangler

```bash
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml:
#   - Set database_id to your D1 database ID
#   - Set CF_ACCESS_TEAM_DOMAIN to your Access team name
#   - Set ENVIRONMENT to "production" for deployment
```

### 3. Create and initialize D1 database

```bash
npm run db:create
# Copy the database_id into wrangler.toml
npm run db:init          # local
npm run db:init:remote   # production
```

If upgrading from an earlier version (before multi-token support):
```bash
npx wrangler d1 execute prefix-mgr-db --remote --file=migrate-multi-token.sql
```

### 4. Local development

```bash
npm run dev
```

Set `ENVIRONMENT = "development"` in `wrangler.toml` to bypass Cloudflare Access auth during local dev (uses `dev@localhost` as the user).

### 5. Deploy

```bash
npm run deploy
```

## API Token Permissions

Each user creates their own Cloudflare API tokens in the Settings panel. Tokens need these permissions:

| Permission | Access | Scope | Required For |
|-----------|--------|-------|-------------|
| **IP Prefixes** | Read | Account | Viewing prefixes, service bindings |
| **IP Prefixes** | Edit | Account | (future: prefix management) |
| **IP Prefixes: BGP On Demand** | Read | Account | Viewing BGP sub-prefixes |
| **IP Prefixes: BGP On Demand** | Edit | Account | Toggling advertisement state |

### Rate Limit & Multi-Token Strategy

The Cloudflare API enforces a rate limit of **1200 requests per endpoint per 5-minute window per API token**. When managing accounts with many prefixes, a single token can be exhausted quickly — especially when expanding rows (which triggers parallel BGP + binding fetches).

To mitigate this, add multiple API tokens per account in the Settings panel (all with the same permissions). The worker distributes read requests across them via round-robin. Write operations (advertisement toggle) always use the first token for consistency.

## Cloudflare Access

The worker is protected by a Cloudflare Access application. In production, the `Cf-Access-Jwt-Assertion` header is decoded to extract the user's email from the JWT payload. All data (accounts, tokens, activity) is scoped to the authenticated user's email.

In development (`ENVIRONMENT != "production"`), auth is bypassed with `dev@localhost`.

## Project Structure

```
prefix-mgr/
├── package.json
├── tsconfig.json
├── wrangler.toml.example
├── schema.sql                  — Full schema (user_accounts + account_tokens + activity_log)
├── migrate-multi-token.sql     — Migration for existing deployments
└── src/
    ├── index.ts                — Hono app, chanfana OpenAPI setup, route registration
    ├── helpers.ts              — Shared helpers (getToken, logActivity, resolveAccount)
    ├── ui.ts                   — Server-rendered HTML dashboard
    ├── auth.ts                 — CF Access JWT middleware
    ├── types.ts                — TypeScript interfaces
    ├── api.ts                  — Cloudflare API helpers
    ├── schemas/                — Zod schemas for request/response validation & OpenAPI generation
    │   ├── common.ts           — Shared schemas (error responses, account_id query)
    │   ├── accounts.ts         — Account & token schemas
    │   ├── prefixes.ts         — Prefix, BGP, binding, delegation schemas
    │   ├── rir.ts              — RIR credential & operation schemas
    │   ├── lookups.ts          — Looking glass, RDAP, RPKI, visibility schemas
    │   └── activity.ts         — Activity log schema
    └── endpoints/              — chanfana OpenAPIRoute classes (one file per domain)
        ├── settings.ts         — Account settings endpoints
        ├── prefixes.ts         — Prefix management endpoints
        ├── bgp.ts              — BGP sub-prefix endpoints
        ├── bindings.ts         — Service binding endpoints
        ├── delegations.ts      — Delegation endpoints
        ├── services.ts         — Services endpoint
        ├── rir.ts              — RIR credentials & operations endpoints
        └── lookups.ts          — Looking glass, RDAP, RPKI, visibility, activity endpoints
```

## Database Schema

### `user_accounts`
Stores Cloudflare account configurations per user. One row per user + account_id combination.

### `account_tokens`
Stores API tokens per account. Multiple tokens per account enable round-robin load balancing. Legacy tokens from `user_accounts.api_token` are auto-migrated on first access.

### `activity_log`
Tracks advertisement toggle actions (advertise/withdraw) with user email, action, details, and timestamp.

## API Documentation

The API is fully documented with an auto-generated **OpenAPI 3.1** specification, powered by [chanfana](https://chanfana.pages.dev/) with [Zod](https://zod.dev/) schemas for request/response validation.

### Interactive Docs (Swagger UI)

Browse and test all API endpoints interactively:

- **Swagger UI:** [`/api/docs`](https://prefix-mgr.example.com/api/docs)
- **OpenAPI JSON:** [`/api/openapi.json`](https://prefix-mgr.example.com/api/openapi.json)

The OpenAPI spec can be imported into tools like Postman, Insomnia, or used for client code generation.

### Exporting the Schema

Download the OpenAPI spec for offline use or CI/CD integration:

```bash
# Download the schema
curl -o openapi.json https://prefix-mgr.example.com/api/openapi.json

# Or during local development
curl -o openapi.json http://localhost:8787/api/openapi.json
```

### API Endpoint Summary

The API is organized into the following groups (see Swagger UI for full request/response schemas):

| Group | Endpoints | Description |
|-------|-----------|-------------|
| **Account Settings** | 5 | Manage Cloudflare accounts, test API tokens |
| **Prefixes** | 7 | BYOIP prefix CRUD, validation, bulk toggle, stats |
| **BGP Prefixes** | 4 | BGP sub-prefix management and advertisement toggle |
| **Service Bindings** | 3 | Bind/unbind Cloudflare services to prefixes |
| **Delegations** | 4 | Delegate prefix CIDRs to other accounts |
| **Services** | 1 | List available Cloudflare services |
| **RIR Credentials** | 5 | Manage ARIN/RIPE credentials for automated IRR |
| **RIR Operations** | 3 | Create/update route objects and aut-num at ARIN/RIPE |
| **Lookups** | 4 | BGP looking glass, RDAP, RPKI, RIPEstat visibility |
| **Activity** | 1 | Activity log (last 50 entries) |

Additional plain routes (not in OpenAPI spec):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Dashboard HTML |
| `GET` | `/health` | Health check |
| `GET` | `/api/me` | Current user email |
| `POST` | `/api/loa-upload` | Upload LOA document (multipart/form-data) |
