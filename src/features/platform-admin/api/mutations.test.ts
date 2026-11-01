import { describe, it } from 'node:test';
import assert from 'node:assert';
import { QueryClient } from '@tanstack/react-query';
import {
  computePlatformShopAccessStatus,
  restoreShopsQueries,
  snapshotShopsQueries,
  syncShopWithResult,
  updateShopInCache
} from './mutations.ts';
import type { PlatformShop, UpdateSubscriptionResult } from './types.ts';
import type { PaginatedResponse } from '@/lib/api/types';
import { platformKeys } from './queries.ts';

const mockShop: PlatformShop = {
  id: 'shop-123',
  name: 'Test Mobile Store',
  phone: '03001234567',
  address: 'Shop 1, Hall Road, Lahore',
  status: 'ACTIVE',
  subscriptionStatus: 'ACTIVE',
  trialEndsAt: null,
  accessStatus: 'ACTIVE',
  isAccessible: true,
  subscriptionEndsAt: '2026-12-31T00:00:00.000Z',
  ownerId: 'owner-1',
  ownerName: 'Ali Khan',
  ownerPhone: '03001234567',
  hasPassword: true,
  storeSlug: 'test-mobile',
  createdAt: '2026-01-01T00:00:00.000Z'
};

describe('computePlatformShopAccessStatus', () => {
  const fixedNow = new Date('2026-10-31T12:00:00.000Z');

  it('returns SUSPENDED when status is SUSPENDED regardless of subscription dates', () => {
    const status = computePlatformShopAccessStatus({
      status: 'SUSPENDED',
      subscriptionEndsAt: '2026-12-31T00:00:00.000Z',
      subscriptionStatus: 'ACTIVE',
      now: fixedNow
    });
    assert.strictEqual(status, 'SUSPENDED');
  });

  it('returns EXPIRED when subscriptionEndsAt is in the past', () => {
    const status = computePlatformShopAccessStatus({
      status: 'ACTIVE',
      subscriptionEndsAt: '2026-10-01T00:00:00.000Z',
      subscriptionStatus: 'ACTIVE',
      now: fixedNow
    });
    assert.strictEqual(status, 'EXPIRED');
  });

  it('returns TRIALING when active, future date, and subscriptionStatus is TRIALING', () => {
    const status = computePlatformShopAccessStatus({
      status: 'ACTIVE',
      subscriptionEndsAt: '2026-11-15T00:00:00.000Z',
      subscriptionStatus: 'TRIALING',
      now: fixedNow
    });
    assert.strictEqual(status, 'TRIALING');
  });

  it('returns ACTIVE when active, future date, and subscriptionStatus is ACTIVE', () => {
    const status = computePlatformShopAccessStatus({
      status: 'ACTIVE',
      subscriptionEndsAt: '2026-12-31T00:00:00.000Z',
      subscriptionStatus: 'ACTIVE',
      now: fixedNow
    });
    assert.strictEqual(status, 'ACTIVE');
  });
});

describe('updateShopInCache and rollback', () => {
  function setupQueryClient() {
    const queryClient = new QueryClient();
    const queryKey = [...platformKeys.all, 'shops', { page: 1, pageSize: 10 }];
    const initialData: PaginatedResponse<PlatformShop> = {
      items: [{ ...mockShop }],
      total: 1,
      page: 1,
      pageSize: 10
    };
    queryClient.setQueryData(queryKey, initialData);
    return { queryClient, queryKey };
  }

  it('optimistically updates shop status and rolls back on failure', () => {
    const { queryClient, queryKey } = setupQueryClient();

    const snapshot = snapshotShopsQueries(queryClient);
    assert.strictEqual(snapshot.length, 1);

    updateShopInCache(queryClient, 'shop-123', (prev) => ({
      ...prev,
      status: 'SUSPENDED',
      accessStatus: 'SUSPENDED',
      isAccessible: false
    }));

    const updatedData = queryClient.getQueryData<PaginatedResponse<PlatformShop>>(queryKey);
    assert.strictEqual(updatedData?.items[0]?.status, 'SUSPENDED');
    assert.strictEqual(updatedData?.items[0]?.accessStatus, 'SUSPENDED');
    assert.strictEqual(updatedData?.items[0]?.isAccessible, false);

    restoreShopsQueries(queryClient, snapshot);
    const restoredData = queryClient.getQueryData<PaginatedResponse<PlatformShop>>(queryKey);
    assert.strictEqual(restoredData?.items[0]?.status, 'ACTIVE');
    assert.strictEqual(restoredData?.items[0]?.accessStatus, 'ACTIVE');
    assert.strictEqual(restoredData?.items[0]?.isAccessible, true);
  });

  it('syncs cache directly with server response via syncShopWithResult', () => {
    const { queryClient, queryKey } = setupQueryClient();

    const serverRes: UpdateSubscriptionResult = {
      shopId: 'shop-123',
      shopName: 'Test Mobile Store',
      status: 'ACTIVE',
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: null,
      subscriptionEndsAt: '2027-10-31T00:00:00.000Z',
      isAccessible: true
    };

    syncShopWithResult(queryClient, serverRes);

    const syncedData = queryClient.getQueryData<PaginatedResponse<PlatformShop>>(queryKey);
    assert.strictEqual(syncedData?.items[0]?.subscriptionEndsAt, '2027-10-31T00:00:00.000Z');
    assert.strictEqual(syncedData?.items[0]?.status, 'ACTIVE');
    assert.strictEqual(syncedData?.items[0]?.accessStatus, 'ACTIVE');
    assert.strictEqual(syncedData?.items[0]?.isAccessible, true);
  });
});
