import type { Icons } from '@/components/icons';

export type PlatformShopAccessStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export interface ShopStatusConfig {
  labelKey: string;
  className: string;
  icon: keyof typeof Icons;
}

export interface ShopStatusBadgeProps {
  status: PlatformShopAccessStatus;
}

export interface CreateShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface CreateShopDialogBodyProps {
  onOpenChange: (open: boolean) => void;
}

export interface RenewSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopName: string;
  currentEndsAt: string;
}
