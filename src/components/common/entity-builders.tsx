'use client';

import type { Icon } from '@/components/icons';
import type { MobileItemConfig, DetailConfig } from '@/components/data-table';
import { StatusBadge } from '@/components/data-table';
import { t } from '@/i18n';
import type { NamedActiveItem } from '@/types/common';

export function buildSimpleEntityMobileItem<T extends NamedActiveItem>(
  leadingIcon: Icon
): MobileItemConfig<T> {
  return {
    leading: 'icon',
    leadingIcon,
    title: (row) => row.name,
    subtitle: (row) => (row.isActive ? t('status.active') : t('status.inactive')),
    ariaLabel: (row) => `${row.name}, ${row.isActive ? t('status.active') : t('status.inactive')}`
  };
}

export function buildSimpleEntityDetail<T extends NamedActiveItem>(
  sectionTitle: string
): DetailConfig<T> {
  return {
    mode: 'sheet',
    title: (row) => row.name,
    badge: (row) => ({
      label: row.isActive ? t('status.active') : t('status.inactive'),
      status: row.isActive ? 'ACTIVE' : 'INACTIVE'
    }),
    sections: (row) => [
      {
        title: sectionTitle,
        fields: [
          { label: t('table.col.name'), value: row.name },
          {
            label: t('table.col.status'),
            value: (
              <StatusBadge
                status={row.isActive ? 'ACTIVE' : 'INACTIVE'}
                label={row.isActive ? t('status.active') : t('status.inactive')}
              />
            )
          }
        ]
      }
    ]
  };
}
