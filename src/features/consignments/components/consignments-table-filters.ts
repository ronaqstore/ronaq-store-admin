import type { QuickFilterChip } from '@/components/data-table';
import type { useTranslations } from 'next-intl';

type Translator = ReturnType<typeof useTranslations>;

export function getConsignmentQuickFilters(t: Translator): QuickFilterChip[] {
  return [
    { id: 'all', label: t('common.all') },
    {
      id: 'in_custody',
      label: t('consignments.statusInCustody'),
      columnId: 'status',
      value: 'IN_CUSTODY'
    },
    {
      id: 'sold',
      label: t('consignments.statusSold'),
      columnId: 'status',
      value: 'SOLD'
    },
    {
      id: 'settled',
      label: t('consignments.statusSettled'),
      columnId: 'status',
      value: 'SETTLED'
    },
    {
      id: 'returned',
      label: t('consignments.statusReturned'),
      columnId: 'status',
      value: 'RETURNED_TO_OWNER'
    },
    {
      id: 'cancelled',
      label: t('consignments.statusCancelled'),
      columnId: 'status',
      value: 'CANCELLED'
    }
  ];
}
