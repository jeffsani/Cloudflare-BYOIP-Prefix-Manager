import type { Env } from './types';
import { listPrefixes, listBgpPrefixes, toggleBgpAdvertisement, withApiGate } from './api';

export interface BulkToggleResultItem {
  prefix_id: string;
  cidr: string;
  toggled: number;
  skipped: number;
  errors: string[];
}

export interface BulkToggleArgs {
  accountId: string;
  token: string;
  prefixIds: string[];
  advertised: boolean;
  // The account's api_rate_limit_5min, used to size the API-budget gate.
  budget?: number;
}

/**
 * Core bulk advertise/withdraw loop. Shared so it can run either inline in the
 * request handler (legacy path) or inside the per-account BulkToggleDO (which
 * serializes concurrent jobs for the same account). CF API calls run inside an
 * ApiGate so they count against the account's rolling 5-min budget. Pure with
 * respect to local state: activity logging, notifications, and the cap check are
 * left to the caller, exactly as before.
 */
export async function performBulkToggle(env: Env, args: BulkToggleArgs): Promise<BulkToggleResultItem[]> {
  const { accountId, token, prefixIds, advertised } = args;
  return withApiGate({ env, accountId, budget: args.budget }, async () => {
    const results: BulkToggleResultItem[] = [];

    // Fetch all prefixes once to check approval status.
    const allPrefixData = await listPrefixes(accountId, token);
    const prefixApprovalMap = new Map<string, string>();
    if (allPrefixData.success && allPrefixData.result) {
      for (const p of allPrefixData.result) prefixApprovalMap.set(p.id, p.approved);
    }

    for (const prefixId of prefixIds) {
      const result: BulkToggleResultItem = { prefix_id: prefixId, cidr: '', toggled: 0, skipped: 0, errors: [] };

      // Skip prefixes that are still pending approval.
      if (prefixApprovalMap.get(prefixId) === 'P') {
        result.skipped++;
        results.push(result);
        continue;
      }

      try {
        const bgpData = await listBgpPrefixes(accountId, prefixId, token);
        if (!bgpData.success || !bgpData.result) {
          result.errors.push(bgpData.errors?.[0]?.message || 'Failed to fetch BGP prefixes');
          results.push(result);
          continue;
        }

        for (const bp of bgpData.result) {
          if (!result.cidr && bp.cidr) result.cidr = bp.cidr;

          if (bp.on_demand?.on_demand_locked) {
            result.skipped++;
            continue;
          }
          // Skip if already in desired state.
          if (bp.on_demand?.advertised === advertised) {
            result.skipped++;
            continue;
          }

          try {
            const toggleData = await toggleBgpAdvertisement(accountId, prefixId, bp.id, advertised, token);
            if (toggleData.success) {
              result.toggled++;
            } else {
              result.errors.push(`${bp.cidr}: ${toggleData.errors?.[0]?.message || 'Toggle failed'}`);
            }
          } catch (err) {
            result.errors.push(`${bp.cidr}: ${err instanceof Error ? err.message : 'Toggle failed'}`);
          }
        }
      } catch (err) {
        result.errors.push(err instanceof Error ? err.message : 'Failed to process prefix');
      }

      results.push(result);
    }

    return results;
  });
}
