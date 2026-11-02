'use client';
import { navGroups } from '@/config/nav-config';
import { KBarAnimator, KBarPortal, KBarPositioner, KBarProvider, KBarSearch, useKBar } from 'kbar';
import { Kbd } from '@/components/ui/kbd';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMemo } from 'react';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useT, translateMaybe } from '@/i18n/use-t';
import type { KBarProps, KBarComponentProps } from '@/types';
export type { KBarProps };

export default function KBar({ children }: KBarProps) {
  const router = useRouter();
  const filteredGroups = useFilteredNavGroups(navGroups);
  const t = useTranslations('kbar');
  const rootT = useT();

  const actions = useMemo(() => {
    const navigateTo = (url: string) => {
      router.push(url);
    };

    const allItems = filteredGroups.flatMap((group) => group.items);

    return allItems.flatMap((navItem) => {
      const translatedTitle = translateMaybe(navItem.title, rootT) || navItem.title;
      const baseAction =
        navItem.url !== '#'
          ? {
              id: `${navItem.url}Action`,
              name: translatedTitle,
              shortcut: navItem.shortcut,
              keywords: `${translatedTitle} ${navItem.title}`.toLowerCase(),
              section: t('section'),
              subtitle: t('goToItem', { item: translatedTitle }),
              perform: () => navigateTo(navItem.url)
            }
          : null;

      const childActions =
        navItem.items?.map((childItem) => {
          const translatedChildTitle = translateMaybe(childItem.title, rootT) || childItem.title;
          return {
            id: `${childItem.url}Action`,
            name: translatedChildTitle,
            shortcut: childItem.shortcut,
            keywords: `${translatedChildTitle} ${childItem.title}`.toLowerCase(),
            section: translatedTitle,
            subtitle: t('goToItem', { item: translatedChildTitle }),
            perform: () => navigateTo(childItem.url)
          };
        }) ?? [];

      return baseAction ? [baseAction, ...childActions] : childActions;
    });
  }, [router, filteredGroups, t, rootT]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}

const KBarComponent = ({ children }: KBarComponentProps) => {
  useThemeSwitching();
  const { query } = useKBar();
  const t = useTranslations('kbar');

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='bg-black/10 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-99999 flex items-start! justify-center px-2! pt-[max(calc(env(safe-area-inset-top)+0.75rem),8dvh)]! sm:px-4! sm:pt-[max(1.5rem,10dvh)]!'>
          <KBarAnimator className='bg-popover text-popover-foreground ring-foreground/10 relative mx-auto flex max-h-[min(85dvh,600px)] w-full max-w-[600px] flex-col overflow-hidden rounded-xl shadow-lg ring-1'>
            <div className='bg-popover sticky top-0 z-10 flex items-center border-b pe-2'>
              <KBarSearch
                defaultPlaceholder={t('searchPlaceholder')}
                className='placeholder:text-muted-foreground/55 min-w-0 flex-1 border-none bg-transparent px-4 py-3.5 text-base outline-hidden focus:ring-0 focus:outline-hidden md:text-sm'
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-8 shrink-0 md:hidden'
                aria-label={t('close')}
                onClick={query.toggle}
              >
                <Icons.close className='size-4' />
              </Button>
            </div>
            <div className='min-h-0 flex-1'>
              <RenderResults />
            </div>
            <div className='text-muted-foreground hidden shrink-0 items-center gap-3 border-t px-3 py-2 text-xs sm:flex'>
              <span className='flex items-center gap-1'>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> {t('navigate')}
              </span>
              <span className='flex items-center gap-1'>
                <Kbd>↵</Kbd> {t('open')}
              </span>
              <span className='flex items-center gap-1'>
                <Kbd>ESC</Kbd> {t('close')}
              </span>
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
