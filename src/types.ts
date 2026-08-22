export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  CF_ACCESS_TEAM_DOMAIN: string;
  NOTIFY_QUEUE: Queue<NotifyMessage>;
  RESEND_API_KEY?: string;
  ALERT_FROM_EMAIL?: string;
}

export interface UserAccount {
  id: number;
  user_email: string;
  account_label: string;
  account_id: string;
  api_token: string;
  is_default: number;
  api_rate_limit_5min: number;
  updated_at: string;
}

// --- Machine integration types (Query API + inbound webhooks) ---

export interface ApiKey {
  id: number;
  account_id: string;
  owner_email: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  enabled: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface WebhookEndpoint {
  id: number;
  account_id: string;
  owner_email: string;
  name: string;
  enabled: boolean;
  last_seen_at: string | null;
  created_at: string;
}

/** A Cloudflare Audit Logs v2 entry ingested via Logpush and stored in D1. */
export interface AuditLogEvent {
  id: number;
  account_id: string;
  audit_log_id: string;
  action_type: string;
  action_description: string;
  action_result: string;
  actor_email: string;
  actor_type: string;
  actor_ip: string;
  actor_context: string;
  resource_id: string;
  resource_product: string;
  resource_type: string;
  action_time: string;
  raw: string;
  created_at: string;
}

/** Resolved auth context for machine-facing routes (set by middleware). */
export interface MachineContext {
  account_id: string;
  owner_email: string;
  scopes: string[];
}

/** Consolidated per-CIDR prefix state returned by the Query API. */
export interface PrefixState {
  cidr: string;
  announced: boolean;
  origin_asn: number | null;
  visible_routes: number;
  cf_advertised: boolean | null;
  source: string;
  last_change_at: string | null;
  last_webhook_at: string | null;
  last_webhook_event: string | null;
  updated_at: string;
}

// --- Notification types ---

export type ChannelType = 'email' | 'pagerduty' | 'webhook';

export interface NotificationChannel {
  id: number;
  user_email: string;
  account_id: string;
  type: ChannelType;
  name: string;
  /** {url, token} for webhook, {routing_key} for pagerduty, {email} for email. */
  config: { url?: string; token?: string; routing_key?: string; email?: string };
  enabled: boolean;
  created_at?: string;
}

export interface NotificationSubscription {
  id?: number;
  user_email: string;
  account_id: string;
  event_type: string;
  channel_ids: number[];
  enabled: boolean;
  updated_at?: string;
}

export type NotificationStatus = 'queued' | 'sent' | 'retrying' | 'failed' | 'dead_letter';

export interface NotificationLog {
  id: number;
  user_email: string;
  account_id: string;
  event_type: string;
  title: string;
  details: string;
  channel_id: number | null;
  channel_type: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  attempts: number;
  error: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
}

/** Payload delivered to a channel and stored on the log row. */
export interface NotificationPayload {
  event_type: string;
  event_label: string;
  account_id: string;
  title: string;
  details: string;
  timestamp: string;
}

/** Body of a Cloudflare Queue message — kept tiny (just the log row id). */
export interface NotifyMessage {
  logId: number;
}

/** Catalog of subscribable events → friendly labels. */
export const NOTIFICATION_EVENTS: Record<string, string> = {
  create_prefix: 'Prefix created',
  delete_prefix: 'Prefix deleted',
  advertise: 'Prefix advertised',
  withdraw: 'Prefix withdrawn',
  bulk_advertise: 'Bulk advertised',
  bulk_withdraw: 'Bulk withdrawn',
  create_bgp_prefix: 'BGP sub-prefix created',
  delete_bgp_prefix: 'BGP sub-prefix deleted',
  create_binding: 'Service binding created',
  delete_binding: 'Service binding deleted',
  create_delegation: 'Delegation created',
  delete_delegation: 'Delegation deleted',
  update_description: 'Description updated',
  validate: 'Prefix validated',
  external_advertise: 'External: prefix advertised (Radar)',
  external_withdraw: 'External: prefix withdrawn (Radar)',
  external_origin_change: 'External: origin ASN changed (Radar)',
  webhook_advertise: 'Webhook: prefix advertised (Cloudflare)',
  webhook_withdraw: 'Webhook: prefix withdrawn (Cloudflare)',
  webhook_event: 'Webhook: Cloudflare notification received',
};

export const NOTIFICATION_EVENT_KEYS = Object.keys(NOTIFICATION_EVENTS);

// --- Cloudflare Addressing API types ---

export interface CfPrefix {
  id: string;
  account_id: string;
  cidr: string;
  asn: number | null;
  advertised: boolean | null;
  advertised_modified_at: string | null;
  approved: string;
  description: string;
  irr_validation_state: string;
  rpki_validation_state: string;
  ownership_validation_state: string;
  ownership_validation_token?: string;
  on_demand_enabled: boolean;
  on_demand_locked: boolean;
  created_at: string;
  modified_at: string;
}

export interface CfBgpPrefix {
  id: string;
  cidr: string;
  asn: number | null;
  asn_prepend_count: number;
  auto_advertise_withdraw: boolean;
  bgp_signal_opts: {
    enabled: boolean;
    modified_at: string | null;
  } | null;
  on_demand: {
    advertised: boolean | null;
    advertised_modified_at: string | null;
    on_demand_enabled: boolean;
    on_demand_locked: boolean;
  } | null;
  created_at: string;
  modified_at: string;
}

export interface CfServiceBinding {
  id: string;
  cidr: string;
  service_id: string;
  service_name: string;
  provisioning: { state: string };
}

export interface CfService {
  id: string;
  name: string;
}

export interface CfDelegation {
  id: string;
  cidr: string;
  created_at: string;
  delegated_account_id: string;
  modified_at: string;
  parent_prefix_id: string;
}

export interface CfApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
}

// --- Cloudflare Radar / Looking Glass types ---

export interface LgRoute {
  as_path: number[];
  collector: string;
  communities: string[];
  next_hop: string;
  prefix: string;
  peer_asn: number;
  peer_ip: string;
  origin: string;
  timestamp: string;
}

export interface LgAsnInfo {
  asn: number;
  as_name: string;
  country_code: string;
  org_id: string;
  org_name: string;
}

export interface LgPrefixOrigin {
  origin: number;
  prefix: string;
  rpki_validation: string;
  total_peers: number;
  total_visible: number;
  visibility: number;
}

export interface LgCollector {
  collector: string;
  latest_realtime_ts: string;
  latest_rib_ts: string;
  latest_updates_ts: string;
  peers_count: number;
  peers_v4_count: number;
  peers_v6_count: number;
}

export interface LgResult {
  meta: {
    asn_info: LgAsnInfo[];
    collectors: LgCollector[];
    prefix_origins: LgPrefixOrigin[];
    data_time: string;
    query_time: string;
  };
  routes: LgRoute[];
}

export interface ActivityLogEntry {
  id: number;
  user_email: string;
  action: string;
  details: string;
  created_at: string;
}

// --- RPKI ROA Lookup types ---

export interface RpkiPrefixOrigin {
  origin: number;
  peer_count: number;
  prefix: string;
  rpki_validation: string;
}

export interface RpkiLookupResult {
  prefix_origins: RpkiPrefixOrigin[];
  data_time: string;
  total_peers: number;
}

// --- RIPEstat Visibility types ---

export interface RipestatVisibilityRrc {
  rrc: string;
  peers_seeing: number;
  total_peers: number;
  location: string;
}

export interface RipestatVisibilityResult {
  rrcs: RipestatVisibilityRrc[];
  total_seeing: number;
  total_peers: number;
  visibility: number;
  query_time: string;
}

// --- LOA Document types ---

export interface CfLoaDocument {
  id: string;
  account_id: string;
  auto_generated: boolean;
  created: string;
  filename: string;
  size_bytes: number;
  verified: boolean;
  verified_at: string | null;
}

// --- IRR Lookup types ---

export interface IrrRecord {
  source: string;
  prefix: string;
  origin: string;
}

export interface IrrLookupResult {
  records: IrrRecord[];
  data_source: string;
}

export interface IrrExplorerPrefix {
  prefix: string;
  bgp_origins: number[];
  irr_origins: number[];
  rpki_origins: number[];
  irr_sources: string[];
  rpki_status: string;
}

export interface IrrExplorerResult {
  prefixes: IrrExplorerPrefix[];
  data_source: string;
}

export interface PrefixValidationResult {
  roa: {
    found: boolean;
    matching_asn: boolean;
    origins: Array<{ asn: number; rpki_status: string; peer_count: number }>;
  };
  irr: {
    found: boolean;
    matching_asn: boolean;
    records: IrrRecord[];
    databases: string[];
  };
  irr_explorer: {
    found: boolean;
    matching_asn: boolean;
    prefixes: IrrExplorerPrefix[];
    error?: string;
  };
  summary: {
    ready: boolean;
    warnings: string[];
    errors: string[];
  };
}

// --- RDAP / Whois types ---

export interface RdapResult {
  name: string;
  org: string;
  country: string;
  rir: string;
  allocated: string;
  range: string;
}

// --- RIR credential types ---

export interface RirCredential {
  id: number;
  user_email: string;
  account_id: string;
  rir: 'arin' | 'ripe';
  api_key: string;
  maintainer: string;
  created_at: string;
  updated_at: string;
}

// --- RIR API response types ---

export interface RirApiResult {
  ok: boolean;
  action?: 'created' | 'updated' | 'already_present';
  error?: string;
  details?: string;
}
