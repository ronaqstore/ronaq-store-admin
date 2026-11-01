import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { PaginatedResponse } from '@/lib/api/types';
import type {
  ComputeAccessStatusParams,
  PlatformShop,
  PlatformShopAccessStatus,
  UpdateSubscriptionResult
} from './types';
import { platformKeys } from './queries';

export type PlatformShopsSnapshot = Array<[QueryKey, PaginatedResponse<PlatformShop> | undefined]>;

export function computePlatformShopAccessStatus(
  params: ComputeAccessStatusParams
): PlatformShopAccessStatus {
  if (params.status === 'SUSPENDED') return 'SUSPENDED';
  const nowTime = (params.now ?? new Date()).getTime();
  const endsTime = new Date(params.subscriptionEndsAt).getTime();
  if (!Number.isNaN(endsTime) && endsTime <= nowTime) return 'EXPIRED';
  if (params.subscriptionStatus === 'TRIALING') return 'TRIALING';
  return 'ACTIVE';
}

export function updateShopInCache(
  queryClient: QueryClient,
  shopId: string,
  updater: (shop: PlatformShop) => PlatformShop
): void {
  queryClient.setQueriesData<PaginatedResponse<PlatformShop>>(
    { queryKey: [...platformKeys.all, 'shops'] },
    (old) => {
      if (!old || !Array.isArray(old.items)) return old;
      let changed = false;
      const items = old.items.map((item) => {
        if (item.id !== shopId) return item;
        changed = true;
        return updater(item);
      });
      return changed ? { ...old, items } : old;
    }
  );
}

export function snapshotShopsQueries(queryClient: QueryClient): PlatformShopsSnapshot {
  return queryClient.getQueriesData<PaginatedResponse<PlatformShop>>({
    queryKey: [...platformKeys.all, 'shops']
  });
}

export function restoreShopsQueries(
  queryClient: QueryClient,
  snapshot?: PlatformShopsSnapshot
): void {
  if (!snapshot) return;
  for (const [key, oldData] of snapshot) {
    queryClient.setQueryData(key, oldData);
  }
}

export function syncShopWithResult(queryClient: QueryClient, res: UpdateSubscriptionResult): void {
  updateShopInCache(queryClient, res.shopId, (prev) => {
    const status = res.status;
    const subscriptionEndsAt = res.subscriptionEndsAt;
    const subscriptionStatus = res.subscriptionStatus ?? prev.subscriptionStatus;
    const trialEndsAt = res.trialEndsAt !== undefined ? res.trialEndsAt : prev.trialEndsAt;
    const isAccessible = res.isAccessible;
    const accessStatus = computePlatformShopAccessStatus({
      status,
      subscriptionEndsAt,
      subscriptionStatus
    });

    return {
      ...prev,
      status,
      subscriptionStatus,
      trialEndsAt,
      subscriptionEndsAt,
      isAccessible,
      accessStatus
    };
  });
}
