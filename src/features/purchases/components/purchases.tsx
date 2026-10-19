'use client';

import { FloatingActionButton } from '@/components/common/floating-action-button';
import { TablePageBody } from '@/components/layout/table-page-body';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/use-t';
import { useRouter } from '@/i18n/navigation';
import type { PurchasesHeaderActionProps, PurchasesListClientProps } from '@/types/purchases';
import { PurchasesTable } from './purchases-table';

export { PurchaseDetailClient } from './purchase-detail-client';

export function PurchasesHeaderAction({ className, onAdd }: PurchasesHeaderActionProps) {
  const t = useT();
  return (
    <Button type='button' className={className ?? 'h-8'} onClick={onAdd}>
      <Icons.add className='me-2 h-4 w-4' />
      {t('common.newPurchase')}
    </Button>
  );
}

export function PurchasesListClient(_props: PurchasesListClientProps = {}) {
  const t = useT();
  const router = useRouter();

  const goNew = () => {
    router.push('/dashboard/purchases/new');
  };

  return (
    <TablePageBody>
      <PurchasesTable toolbarAction={<PurchasesHeaderAction className='h-8' onAdd={goNew} />} />
      <FloatingActionButton label={t('common.newPurchase')} onClick={goNew} />
    </TablePageBody>
  );
}
