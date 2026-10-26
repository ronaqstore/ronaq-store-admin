import type { PlatformShopAccessStatus } from '@/types';

export type { PlatformShopAccessStatus };

export interface PlatformShop {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
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

export interface PlatformOverview {
  totalShops: number;
  activeShops: number;
  trialShops: number;
  expiredShops: number;
  suspendedShops: number;
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
  isActive?: boolean;
}

export interface PasswordSetupLinkResult {
  shopId: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  setupUrl: string;
  setupLinkExpiresAt: string;
}

export interface SetupLinkCopyRowProps {
  setupUrl: string;
}

export interface IssueSetupLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopName: string;
  hasPassword: boolean;
}

export interface UpdateSubscriptionResult {
  shopId: string;
  shopName: string;
  status: 'ACTIVE' | 'SUSPENDED';
  subscriptionEndsAt: string;
  isAccessible: boolean;
}
