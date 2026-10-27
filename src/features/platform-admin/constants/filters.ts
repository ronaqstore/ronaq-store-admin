import type { PlatformShopAccessStatus } from '@/types';

export const PLATFORM_ACCESS_STATUS_VALUES: PlatformShopAccessStatus[] = [
  'ACTIVE',
  'TRIALING',
  'EXPIRED',
  'SUSPENDED'
];

export const PLATFORM_ACCESS_STATUS_LABEL_KEY: Record<PlatformShopAccessStatus, string> = {
  ACTIVE: 'status.active',
  TRIALING: 'status.trial',
  EXPIRED: 'status.expired',
  SUSPENDED: 'status.suspended'
};

export function platformAccessStatusOptions(translate: (key: string) => string) {
  return PLATFORM_ACCESS_STATUS_VALUES.map((value) => ({
    label: translate(PLATFORM_ACCESS_STATUS_LABEL_KEY[value]),
    value
  }));
}
