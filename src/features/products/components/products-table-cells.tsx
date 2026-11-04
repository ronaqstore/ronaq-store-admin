'use client';

import { toast } from 'sonner';
import { PreviewableImage } from '@/components/media/previewable-image';
import { SimpleEntityCellAction } from '@/components/common/simple-entity-cell-action';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/constants/placeholders';
import { formatEmpty } from '@/lib/format-empty';
import { formatPkr } from '@/lib/dukaan/numbers';
import {
  formatAuthenticity,
  formatPtaStatus,
  getProductSpecBadges
} from '@/lib/products/product-specs';
import { StatusBadge, type DetailConfig, type MobileItemConfig } from '@/components/data-table';
import { t as staticT } from '@/i18n/static-t';
import { productsQueryKeys } from '../api/queries';
import { deactivateProduct, reactivateProduct } from '../api/service';
import type { ProductDTO } from '@/lib/api/types';
import type {
  BuildProductDetailOptions,
  ProductCellActionProps,
  ProductImagesFieldProps
} from '@/types/products';

export function productCoverUrl(row: ProductDTO): string | null {
  return row.imageUrl || row.imageUrls?.[0] || null;
}

export function ProductCellAction({
  data,
  onSell,
  onPurchase,
  onConsignment
}: ProductCellActionProps) {
  const t = useT();

  const extraActions = data.isActive
    ? [
        ...(onSell
          ? [
              {
                label: t('dukaan.product.sell'),
                icon: Icons.receipt,
                className: 'text-emerald-600 focus:text-emerald-700 dark:text-emerald-400',
                onClick: () => onSell(data)
              }
            ]
          : []),
        ...(onPurchase
          ? [
              {
                label: t('dukaan.product.purchase'),
                icon: Icons.box,
                className: 'text-sky-600 focus:text-sky-700 dark:text-sky-400',
                onClick: () => onPurchase(data)
              }
            ]
          : []),
        ...(onConsignment
          ? [
              {
                label: t('dukaan.product.consignment'),
                icon: Icons.phone,
                className: 'text-amber-600 focus:text-amber-700 dark:text-amber-400',
                onClick: () => {
                  if (data.trackingType === 'QUANTITY') {
                    toast.error(t('consignments.serializedOnly'));
                    return;
                  }
                  onConsignment(data);
                }
              }
            ]
          : [])
      ]
    : undefined;

  return (
    <SimpleEntityCellAction
      id={data.id}
      isActive={data.isActive}
      editHref={`/dashboard/products/${data.id}/edit`}
      deactivateTitle={t('dukaan.product.deactivateTitle')}
      deactivateDescription={t('dukaan.product.deactivateDescription')}
      deactivateConfirmLabel={t('common.delete')}
      deactivateSuccess={t('dukaan.product.productDeactivated')}
      activateTitle={t('dukaan.product.activateTitle')}
      activateDescription={t('dukaan.product.activateDescription')}
      activateConfirmLabel={t('common.activate')}
      activateSuccess={t('dukaan.product.productActivated')}
      onDeactivate={deactivateProduct}
      onActivate={reactivateProduct}
      invalidateQueryKey={productsQueryKeys.all}
      extraActions={extraActions}
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

export function buildProductMobileItem(t: (key: string) => string): MobileItemConfig<ProductDTO> {
  return {
    leading: 'thumbnail',
    leadingIcon: Icons.product,
    imageUrl: (row) => productCoverUrl(row),
    title: (row) => row.name,
    subtitle: (row) => {
      const specs = getProductSpecBadges(row);
      const parts = [row.brandName, ...specs].filter(Boolean);
      return parts.length > 0
        ? parts.join(' · ')
        : row.categoryName || (row.isActive ? t('status.active') : t('status.inactive'));
    },
    badge: (row) => ({
      label: row.isActive ? t('status.active') : t('status.inactive'),
      status: row.isActive ? 'ACTIVE' : 'INACTIVE'
    }),
    value: (row) => formatPkr(row.defaultSellingPrice),
    ariaLabel: (row) => `${row.name}, ${row.isActive ? t('status.active') : t('status.inactive')}`
  };
}

export function buildProductDetail({
  t,
  router,
  onSell,
  onPurchase,
  onConsignment,
  onStatusConfirm
}: BuildProductDetailOptions): DetailConfig<ProductDTO> {
  return {
    mode: 'sheet',
    title: (row) => row.name,
    badge: (row) => ({
      label: row.isActive ? t('status.active') : t('status.inactive'),
      status: row.isActive ? 'ACTIVE' : 'INACTIVE'
    }),
    value: (row) => formatPkr(row.defaultSellingPrice),
    sections: (row) => [
      {
        title: t('dukaan.product.images'),
        fields: [{ label: t('dukaan.product.images'), value: <ProductImagesField row={row} /> }]
      },
      {
        title: t('dukaan.product.title'),
        fields: [
          { label: t('table.col.name'), value: row.name },
          ...(row.model ? [{ label: t('dukaan.product.model'), value: row.model }] : []),
          { label: t('dukaan.product.category'), value: formatEmpty(row.categoryName) },
          { label: t('dukaan.product.brand'), value: formatEmpty(row.brandName) },
          ...(row.color ? [{ label: t('dukaan.product.color'), value: row.color }] : []),
          ...(row.storage ? [{ label: t('dukaan.product.storage'), value: row.storage }] : []),
          ...(row.ram ? [{ label: t('dukaan.product.ram'), value: row.ram }] : []),
          ...(row.ptaStatus
            ? [
                {
                  label: t('dukaan.product.ptaStatus'),
                  value: formatPtaStatus(row.ptaStatus) ?? row.ptaStatus
                }
              ]
            : []),
          ...(row.authenticity
            ? [
                {
                  label: t('dukaan.product.authenticity'),
                  value: formatAuthenticity(row.authenticity) ?? row.authenticity
                }
              ]
            : []),
          ...(row.sku ? [{ label: staticT('dukaan.product.sku'), value: row.sku }] : []),
          ...(row.barcode ? [{ label: t('dukaan.product.barcode'), value: row.barcode }] : []),
          { label: t('dukaan.product.sellingPrice'), value: formatPkr(row.defaultSellingPrice) },
          { label: t('dukaan.product.stock'), value: String(row.quantityOnHand ?? 0) },
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
    ],
    actions: (row) => [
      ...(row.isActive
        ? [
            {
              label: t('dukaan.product.sell'),
              icon: Icons.cash,
              variant: 'default' as const,
              placement: 'bar' as const,
              onClick: () => onSell(row)
            },
            ...(onPurchase
              ? [
                  {
                    label: t('dukaan.product.purchase'),
                    icon: Icons.box,
                    variant: 'outline' as const,
                    placement: 'bar' as const,
                    onClick: () => onPurchase(row)
                  }
                ]
              : []),
            ...(onConsignment
              ? [
                  {
                    label: t('dukaan.product.consignment'),
                    icon: Icons.phone,
                    variant: 'outline' as const,
                    placement: 'bar' as const,
                    onClick: () => {
                      if (row.trackingType === 'QUANTITY') {
                        toast.error(t('consignments.serializedOnly'));
                        return;
                      }
                      onConsignment(row);
                    }
                  }
                ]
              : [])
          ]
        : []),
      {
        label: t('common.edit'),
        icon: Icons.edit,
        variant: 'outline' as const,
        placement: 'more' as const,
        onClick: () => router.push(`/dashboard/products/${row.id}/edit`)
      },
      row.isActive
        ? {
            label: t('common.delete'),
            icon: Icons.trash,
            variant: 'destructive' as const,
            placement: 'more' as const,
            onClick: () => onStatusConfirm({ id: row.id, nextActive: false })
          }
        : {
            label: t('common.activate'),
            icon: Icons.check,
            variant: 'secondary' as const,
            placement: 'bar' as const,
            onClick: () => onStatusConfirm({ id: row.id, nextActive: true })
          }
    ]
  };
}
