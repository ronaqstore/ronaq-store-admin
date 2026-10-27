import type { PlatformShopAccessStatus } from '@/types';

export type { PlatformShopAccessStatus };

export interface PlatformShop {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  subscriptionStatus?: 'TRIALING' | 'ACTIVE' | 'EXPIRED';
  trialEndsAt?: string | null;
  accessStatus: PlatformShopAccessStatus;
  isAccessible: boolean;
  subscriptionEndsAt: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  hasPassword: boolean;
  storeSlug: string | null;
  createdAt: string;
}

export interface PlatformDashboardKpis {
  totalShops: number;
  activeShops: number;
  expiredShops: number;
  suspendedShops: number;
  newThisMonth: number;
  expiringIn7Days: number;
  shopsWithSaleLast7Days: number;
  onlineStoreEnabledCount: number;
  onlineStoreEnabledPercent: number;
}

export interface ShopGrowthPoint {
  month: string;
  newShops: number;
  cumulative: number;
}

export interface ShopGrowthResponse {
  series: ShopGrowthPoint[];
  totalShops: number;
}

export interface RenewalWeekBucket {
  weekStart: string;
  expiringCount: number;
}

export interface ExpiringShop {
  id: string;
  name: string;
  ownerPhone: string | null;
  city: string | null;
  endsAt: string;
}

export interface RenewalsResponse {
  series: RenewalWeekBucket[];
  nextExpiring: ExpiringShop[];
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  dropOffPct: number;
}

export interface OnboardingFunnelResponse {
  stages: FunnelStage[];
}

export interface CityBucket {
  city: string;
  shopCount: number;
}

export interface ShopsByCityResponse {
  buckets: CityBucket[];
}

export interface ActivityPoint {
  date: string;
  salesCount: number;
  activeShops: number;
}

export interface ActivityResponse {
  series: ActivityPoint[];
}

export interface AtRiskShop {
  id: string;
  name: string;
  city: string | null;
  lastSaleAt: string | null;
  subscriptionEndsAt: string;
  ownerPhone: string | null;
}

export interface AtRiskResponse {
  items: AtRiskShop[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ShopRowActionsProps {
  shop: PlatformShop;
}

export interface PlatformShopFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  accessStatus?: PlatformShopAccessStatus | string;
  subscriptionFrom?: string;
  subscriptionTo?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'name' | 'createdAt' | 'subscriptionEndsAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePlatformShopInput {
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  city: string;
  subscriptionEndsAt: string;
  ownerName: string;
  ownerPhone: string;
}

export interface CreatePlatformShopResult {
  shopId: string;
  shopName: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  setupUrl: string;
  setupLinkExpiresAt: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface UpdateSubscriptionInput {
  subscriptionEndsAt?: string;
  subscriptionStatus?: 'TRIALING' | 'ACTIVE' | 'EXPIRED';
  isActive?: boolean;
}

export interface UpdateSubscriptionResult {
  shopId: string;
  shopName: string;
  status: 'ACTIVE' | 'SUSPENDED';
  subscriptionStatus?: 'TRIALING' | 'ACTIVE' | 'EXPIRED';
  trialEndsAt?: string | null;
  subscriptionEndsAt: string;
  isAccessible: boolean;
}
