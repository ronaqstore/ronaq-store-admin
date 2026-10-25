'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';

import { productQueryOptions } from '../api/queries';
import { ProductFormBody } from './product-form-body';
import type { ProductFormPageProps } from '@/types/products';

export function ProductFormPageClient({ productId }: ProductFormPageProps) {
  const isEdit = Boolean(productId);
  const t = useTranslations('dukaan.product');

  const productQuery = useQuery({
    ...productQueryOptions(productId ?? ''),
    enabled: isEdit
  });

  if (isEdit && productQuery.isLoading) {
    return (
      <div className='grid gap-6 py-2 lg:grid-cols-[1fr_280px]' aria-busy='true'>
        <div className='space-y-5'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-10 w-full rounded-md' />
          <Skeleton className='h-10 w-full rounded-md' />
          <div className='grid gap-4 sm:grid-cols-2'>
            <Skeleton className='h-10 w-full rounded-md' />
            <Skeleton className='h-10 w-full rounded-md' />
          </div>
          <Skeleton className='h-28 w-full rounded-md' />
          <div className='grid gap-4 sm:grid-cols-2'>
            <Skeleton className='h-10 w-full rounded-md' />
            <Skeleton className='h-10 w-full rounded-md' />
          </div>
        </div>
        <div className='space-y-4'>
          <Skeleton className='aspect-square w-full rounded-xl' />
          <Skeleton className='h-10 w-full rounded-md' />
          <Skeleton className='h-10 w-full rounded-md' />
        </div>
      </div>
    );
  }

  if (isEdit && (productQuery.isError || !productQuery.data)) {
    return (
      <Alert variant='destructive'>
        <Icons.warning />
        <AlertDescription>
          {productQuery.error instanceof Error
            ? productQuery.error.message
            : t('updateFailed')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ProductFormBody
      key={productId ?? 'new'}
      productId={productId}
      product={productQuery.data ?? null}
    />
  );
}
