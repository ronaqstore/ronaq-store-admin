'use client';

import { useState } from 'react';
import { FloatingActionButton } from '@/components/common/floating-action-button';
import { TablePageBody } from '@/components/layout/table-page-body';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/use-t';
import { PlatformShopsTable } from './shops-table';
import { CreateShopDialog } from './create-shop-dialog';

export function CreateShopHeaderAction() {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type='button' onClick={() => setOpen(true)}>
        <Icons.add className='me-2 h-4 w-4' />
        {t('nav.createNewShop')}
      </Button>
      <CreateShopDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function PlatformShopsListClient() {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <TablePageBody>
      <PlatformShopsTable />
      <FloatingActionButton label={t('nav.createNewShop')} onClick={() => setOpen(true)} />
      <CreateShopDialog open={open} onOpenChange={setOpen} />
    </TablePageBody>
  );
}
