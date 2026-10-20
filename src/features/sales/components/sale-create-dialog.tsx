'use client';

import { useRouter } from '@/i18n/navigation';
import { Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useT } from '@/i18n/use-t';
import { SaleCreateForm } from './sale-create-form';
import type { SaleCreateDialogProps } from '@/types/sales';

export function SaleCreateDialog({ open, onOpenChange, clearDefaultQuery }: SaleCreateDialogProps) {
  const router = useRouter();
  const t = useT();

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next && clearDefaultQuery) router.replace('/dashboard/sales');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'>
        <DialogHeader className='shrink-0 px-4 pt-4 pe-12'>
          <DialogTitle>{t('dukaan.sale.newTitle')}</DialogTitle>
          <DialogDescription className='sr-only'>
            {t('dukaan.sale.newDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4'>
          <Suspense
            fallback={<p className='text-muted-foreground text-sm'>{t('dukaan.sale.loading')}</p>}
          >
            <SaleCreateForm onDone={() => onOpenChange(false)} />
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
}
