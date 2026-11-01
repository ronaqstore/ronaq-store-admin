'use client';

import { PreviewableImage } from '@/components/media/previewable-image';
import { SimpleEntityCellAction } from '@/components/common/simple-entity-cell-action';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/constants/placeholders';
import { formatEmpty } from '@/lib/format-empty';
import { productsQueryKeys } from '../api/queries';
import { deactivateProduct, reactivateProduct } from '../api/service';
import type { ProductCellActionProps, ProductImagesFieldProps } from '@/types/products';

export function ProductCellAction({ data, onSell }: ProductCellActionProps) {
  const t = useT();

  return (
    <SimpleEntityCellAction
      id={data.id}
      isActive={data.isActive}
      editHref={`/dashboard/products/${data.id}/edit`}
      deactivateTitle={t('dukaan.product.deactivateTitle')}
      deactivateDescription={t('dukaan.product.deactivateDescription')}
      deactivateSuccess={t('dukaan.product.productDeactivated')}
      activateTitle={t('dukaan.product.activateTitle')}
      activateDescription={t('dukaan.product.activateDescription')}
      activateSuccess={t('dukaan.product.productActivated')}
      onDeactivate={deactivateProduct}
      onActivate={reactivateProduct}
      invalidateQueryKey={productsQueryKeys.all}
      extraActions={
        data.isActive && onSell
          ? [
              {
                label: t('dukaan.product.sell'),
                icon: Icons.receipt,
                className: 'text-emerald-600 focus:text-emerald-700 dark:text-emerald-400',
                onClick: () => onSell(data)
              }
            ]
          : undefined
      }
    />
  );
}

export function ProductImagesField({ row }: ProductImagesFieldProps) {
  const t = useT();
  const urls = row.imageUrls?.length ? row.imageUrls : row.imageUrl ? [row.imageUrl] : [];

  if (urls.length === 0) {
    return <span className='text-muted-foreground'>{t('dukaan.product.noImages')}</span>;
  }

  return (
    <div className='grid grid-cols-3 gap-2'>
      {urls.map((url, index) => (
        <PreviewableImage
          key={`${url}-${index}`}
          src={url}
          alt={`${formatEmpty(row.name)} ${index + 1}`}
          className='relative aspect-square overflow-hidden rounded-lg border bg-muted'
          imageClassName='object-contain p-1'
          sizes='120px'
          fallbackSrc={PLACEHOLDER_PRODUCT_IMAGE}
        />
      ))}
    </div>
  );
}
