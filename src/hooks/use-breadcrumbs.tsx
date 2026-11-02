'use client';

import { usePathname } from '@/i18n/navigation';
import { useMemo } from 'react';
import { useT } from '@/i18n/use-t';
import { pageTitleKeyFromPath } from '@/lib/i18n/path-titles';
import type { BreadcrumbItem } from '@/types/layout';

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const t = useT();

  const breadcrumbs = useMemo(() => {
    const rawSegments = pathname.split('/').filter(Boolean);
    const segments =
      rawSegments.length === 2 && rawSegments[0] === 'dashboard' && rawSegments[1] === 'overview'
        ? ['dashboard']
        : rawSegments;

    const customKey = pageTitleKeyFromPath(pathname);
    const lastTitle = customKey
      ? (() => {
          try {
            return t(customKey);
          } catch {
            return null;
          }
        })()
      : null;

    const items = segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const isLast = index === segments.length - 1;

      if (isLast && lastTitle) {
        return { title: lastTitle, link: path };
      }

      const segKey = pageTitleKeyFromPath(`/${segments.slice(0, index + 1).join('/')}`);
      if (segKey) {
        try {
          return { title: t(segKey), link: path };
        } catch {
          return {
            title: segment.charAt(0).toUpperCase() + segment.slice(1),
            link: path
          };
        }
      }

      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });

    return items.filter((item, idx, arr) => {
      if (idx === 0) return true;
      return item.title.trim().toLowerCase() !== arr[idx - 1].title.trim().toLowerCase();
    });
  }, [pathname, t]);

  return breadcrumbs;
}
