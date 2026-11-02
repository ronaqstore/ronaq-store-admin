'use client';

import * as React from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getNavGroupsForRole } from '@/config/nav-config';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { useIsMobile } from '@/hooks/use-mobile';

import type { NavItem, MobileBottomNavProps, BottomNavItemConfig } from '@/types';
import { useT, translateMaybe } from '@/i18n/use-t';
import { cn } from '@/lib/utils';
import { isNavUrlActive } from '@/lib/nav-active';

const SHOP_BOTTOM_NAV: BottomNavItemConfig[] = [
  { url: '/dashboard/overview' },
  { url: '/dashboard/sales' },
  { url: '/dashboard/purchases' },
  { url: '/dashboard/products', tabletOnly: true },
  { url: '/dashboard/inventory', tabletOnly: true },
  { url: '/dashboard/customers' },
  { url: '/dashboard/expenses', tabletOnly: true }
];

const PLATFORM_BOTTOM_NAV: BottomNavItemConfig[] = [
  { url: '/dashboard/platform' },
  { url: '/dashboard/platform/shops' },
  { url: '/dashboard/platform/subscriptions' },
  { url: '/dashboard/settings/appearance' },
  { url: '/dashboard/settings', tabletOnly: true }
];

function flattenNav(groups: ReturnType<typeof getNavGroupsForRole>): NavItem[] {
  return groups.flatMap((g) =>
    g.items.flatMap((item) => {
      if (item.items && item.items.length > 0) return item.items;
      return [item];
    })
  );
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const t = useT();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const groups = useFilteredNavGroups(getNavGroupsForRole(role), role);
  const allItems = React.useMemo(() => flattenNav(groups), [groups]);
  const allUrls = React.useMemo(() => allItems.map((item) => item.url), [allItems]);

  const navConfig = role === 'SUPER_ADMIN' ? PLATFORM_BOTTOM_NAV : SHOP_BOTTOM_NAV;
  const primary = React.useMemo(
    () =>
      navConfig
        .map((cfg) => {
          const item = allItems.find((i) => i.url === cfg.url);
          if (!item) return null;
          return { item, tabletOnly: Boolean(cfg.tabletOnly) };
        })
        .filter((entry): entry is { item: NavItem; tabletOnly: boolean } => entry !== null),
    [allItems, navConfig]
  );

  const phonePrimaryUrls = React.useMemo(
    () => new Set(navConfig.filter((c) => !c.tabletOnly).map((c) => c.url)),
    [navConfig]
  );
  const tabletOnlyUrls = React.useMemo(
    () => new Set(navConfig.filter((c) => c.tabletOnly).map((c) => c.url)),
    [navConfig]
  );
  const moreItems = React.useMemo(
    () => allItems.filter((item) => item.url && !phonePrimaryUrls.has(item.url)),
    [allItems, phonePrimaryUrls]
  );

  if (!isMobile) return null;

  return (
    <>
      <nav
        aria-label={t('nav.menu')}
        className={cn(
          'bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t border-border backdrop-blur-md',
          'pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden'
        )}
      >
        <ul className='mx-auto flex h-14 max-w-lg items-stretch justify-around px-1 md:max-w-4xl md:px-3'>
          {primary.map(({ item, tabletOnly }) => {
            const Icon = item.icon ? Icons[item.icon] : Icons.circle;
            const active = isNavUrlActive(pathname, item.url, allUrls);
            return (
              <li key={item.url} className={cn('flex-1', tabletOnly ? 'hidden md:flex' : 'flex')}>
                <Link
                  href={item.url}
                  className={cn(
                    'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium md:text-xs',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className='size-5' />
                  <span className='max-w-full truncate'>{translateMaybe(item.title, t)}</span>
                </Link>
              </li>
            );
          })}
          <li className='flex flex-1'>
            <button
              type='button'
              className={cn(
                'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium md:text-xs',
                moreOpen ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-label={t('nav.more')}
              onClick={() => setMoreOpen(true)}
            >
              <Icons.dots className='size-5' />
              <span>{t('nav.more')}</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side='bottom'
          className='max-h-[75dvh] rounded-t-[var(--radius)] pb-[max(1rem,env(safe-area-inset-bottom))]'
        >
          <div className='bg-muted mx-auto mt-1 mb-2 h-1 w-10 shrink-0 rounded-full' aria-hidden />
          <SheetHeader>
            <SheetTitle>{t('nav.more')}</SheetTitle>
          </SheetHeader>
          <ul className='no-scrollbar grid gap-1 overflow-y-auto px-2 pb-4'>
            {moreItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.circle;
              const active = isNavUrlActive(pathname, item.url, allUrls);
              const isTabletOnly = tabletOnlyUrls.has(item.url);
              return (
                <li key={item.url} className={isTabletOnly ? 'md:hidden' : undefined}>
                  <Link
                    href={item.url}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm',
                      active ? 'bg-muted font-medium' : 'hover:bg-muted/60'
                    )}
                  >
                    <Icon className='size-5 shrink-0' />
                    {translateMaybe(item.title, t)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
