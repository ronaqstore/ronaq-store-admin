'use client';

import { FloatingActionButton } from '@/components/common/floating-action-button';
import { TablePageBody } from '@/components/layout/table-page-body';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/use-t';
import { useRouter } from '@/i18n/navigation';
import { ProductsTable } from './products-table';
import type { ProductsHeaderActionProps } from '@/types/products';

export function ProductsHeaderAction({ onAdd }: ProductsHeaderActionProps) {
  const t = useT();
  const router = useRouter();

  const handleOpen = () => {
    if (onAdd) onAdd();
    else router.push('/dashboard/products/new');
  };

  return (
    <Button type='button' size='sm' onClick={handleOpen}>
      <Icons.add className='me-2 h-4 w-4' />
      {t('dukaan.product.add')}
    </Button>
  );
}

export function ProductsPageClient() {
  const t = useT();
  const router = useRouter();

  const handleAdd = () => {
    router.push('/dashboard/products/new');
  };

  return (
    <TablePageBody>
      <ProductsTable toolbarAction={<ProductsHeaderAction onAdd={handleAdd} />} />
      <FloatingActionButton label={t('dukaan.product.add')} onClick={handleAdd} />
    </TablePageBody>
  );
}
