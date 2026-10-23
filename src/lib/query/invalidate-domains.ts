import { resolveDomainQueryKeys } from '@/lib/query/domain-query-keys';
import { publishQuerySyncInvalidate } from '@/lib/query/query-sync-channel';
import type { InvalidateDomainsOptions, QuerySyncDomain } from '@/types/query-sync';

export function invalidateDomains(options: InvalidateDomainsOptions): void {
  const { queryClient, domains, broadcast = true } = options;
  if (domains.length === 0) return;

  const keys = resolveDomainQueryKeys(domains);
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey });
  }

  if (broadcast) {
    publishQuerySyncInvalidate(domains);
  }
}

export function invalidateDomainsQuiet(
  queryClient: InvalidateDomainsOptions['queryClient'],
  domains: readonly QuerySyncDomain[]
): void {
  invalidateDomains({ queryClient, domains, broadcast: false });
}
