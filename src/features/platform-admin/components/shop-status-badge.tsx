import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import type { ShopStatusBadgeProps, ShopStatusConfig } from '@/types';
import { PLATFORM_ACCESS_STATUS_LABEL_KEY } from '../constants/filters';
import type { PlatformShopAccessStatus } from '../api/types';

const STATUS_CONFIG: Record<
  PlatformShopAccessStatus,
  Omit<ShopStatusConfig, 'labelKey'> & { labelKey: string }
> = {
  ACTIVE: {
    labelKey: PLATFORM_ACCESS_STATUS_LABEL_KEY.ACTIVE,
    className:
      'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: 'check'
  },
  EXPIRED: {
    labelKey: PLATFORM_ACCESS_STATUS_LABEL_KEY.EXPIRED,
    className: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    icon: 'circleX'
  },
  SUSPENDED: {
    labelKey: PLATFORM_ACCESS_STATUS_LABEL_KEY.SUSPENDED,
    className:
      'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    icon: 'ban'
  }
};

export function ShopStatusBadge({ status }: ShopStatusBadgeProps) {
  const t = useT();
  const config = STATUS_CONFIG[status];
  const Icon = Icons[config.icon];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      <Icon className='h-3 w-3' />
      {t(config.labelKey)}
    </span>
  );
}
