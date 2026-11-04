'use client';

import { Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/i18n/use-t';
import { PurchaseCreateForm } from '@/features/purchases/components/purchase-create-form';
import type { PurchaseCreateDialogProps } from '@/types/purchases';

function PurchaseCreateFormSkeleton() {
  return (
    <div className='space-y-4' aria-busy='true'>
      <Skeleton className='h-10 w-full rounded-md' />
      <Skeleton className='h-10 w-full rounded-md' />
      <div className='space-y-2 rounded-xl border border-border/70 p-3'>
        <Skeleton className='h-12 w-full rounded-md' />
        <Skeleton className='h-12 w-full rounded-md' />
        <Skeleton className='h-12 w-full rounded-md' />
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        <Skeleton className='h-10 w-full rounded-md' />
        <Skeleton className='h-10 w-full rounded-md' />
      </div>
      <Skeleton className='h-10 w-full rounded-md' />
    </div>
  );
}

export function PurchaseCreateDialog({
  open,
  onOpenChange,
  initialProduct
}: PurchaseCreateDialogProps) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl'>
        <DialogHeader className='shrink-0 px-4 pt-4 pe-12'>
          <DialogTitle>{t('dukaan.purchase.newTitle')}</DialogTitle>
          <DialogDescription className='sr-only'>
            {t('dukaan.purchase.newDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto touch-pan-y overscroll-y-contain [webkit-overflow-scrolling:touch] px-4 py-4'>
          <Suspense fallback={<PurchaseCreateFormSkeleton />}>
            <PurchaseCreateForm
              onDone={() => onOpenChange(false)}
              initialProduct={initialProduct}
            />
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
}
