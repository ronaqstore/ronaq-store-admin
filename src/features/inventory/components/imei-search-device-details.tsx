'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { formatPtaStatusLabel, formatWarrantyBadge } from '../helpers/imei-lookup-helpers';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIsoDate } from '@/lib/dates';
import { formatPkr } from '@/lib/money';
import type { ImeiSearchDeviceDetailsProps } from '@/types/inventory';

function renderStatusBadge(status: string) {
  switch (status) {
    case 'IN_STOCK':
      return (
        <Badge className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'>
          In Stock
        </Badge>
      );
    case 'SOLD':
      return (
        <Badge className='bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'>
          Sold
        </Badge>
      );
    case 'DAMAGED':
      return (
        <Badge className='bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'>
          Damaged
        </Badge>
      );
    case 'LOST':
      return (
        <Badge className='bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'>
          Lost
        </Badge>
      );
    default:
      return <Badge variant='secondary'>{status}</Badge>;
  }
}

export function ImeiSearchDeviceDetails({
  device,
  intake,
  latestSale,
  onCopyImei
}: ImeiSearchDeviceDetailsProps) {
  const t = useTranslations('imeiSearch');
  const warrantyBadge = formatWarrantyBadge(latestSale);

  const handleCopyImei1 = () => {
    onCopyImei(device.imei1);
  };

  const handleCopyImei2 = () => {
    if (device.imei2) {
      onCopyImei(device.imei2);
    }
  };

  return (
    <div className='space-y-6'>
      <Card className='border-border/70 bg-card/60 shadow-none'>
        <CardContent className='p-5 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='space-y-1.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='text-xl md:text-2xl font-bold tracking-tight text-foreground'>
                {device.productName}
              </h2>
              {renderStatusBadge(device.status)}
              <Badge variant='outline'>{device.condition === 'NEW' ? 'NEW' : 'USED'}</Badge>
              <Badge variant='secondary'>{formatPtaStatusLabel(device.ptaStatus)}</Badge>
            </div>

            <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-mono'>
              <div className='flex items-center gap-1.5'>
                <span>{t('imei1Label')}:</span>
                <span className='font-semibold text-foreground'>{device.imei1}</span>
                <button
                  type='button'
                  onClick={handleCopyImei1}
                  className='hover:text-foreground ms-1 p-0.5'
                  title={t('copyImei')}
                >
                  <Icons.copy className='h-3.5 w-3.5' />
                </button>
              </div>

              {device.imei2 && (
                <div className='flex items-center gap-1.5 border-s border-border ps-3'>
                  <span>{t('imei2Label')}:</span>
                  <span className='font-semibold text-foreground'>{device.imei2}</span>
                  <button
                    type='button'
                    onClick={handleCopyImei2}
                    className='hover:text-foreground ms-1 p-0.5'
                    title={t('copyImei')}
                  >
                    <Icons.copy className='h-3.5 w-3.5' />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className='text-start md:text-end shrink-0'>
            <p className='text-xs text-muted-foreground'>{t('shelfTime')}</p>
            <p className='text-base font-semibold text-foreground'>
              {t('daysOnShelf', { days: device.daysOnShelf })}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='shadow-none border-border/70 flex flex-col justify-between'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-semibold flex items-center gap-2 text-foreground'>
              <Icons.product className='h-4 w-4 text-primary' />
              {t('specsCard')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2.5 text-xs'>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('brandCategory')}:</span>
              <span className='font-medium text-foreground'>
                {device.brandName ?? '—'} · {device.categoryName ?? '—'}
              </span>
            </div>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('modelSku')}:</span>
              <span className='font-medium text-foreground font-mono'>
                {device.model ?? '—'} / {device.sku ?? '—'}
              </span>
            </div>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('storageRam')}:</span>
              <span className='font-medium text-foreground'>
                {device.storage ?? '—'} / {device.ram ?? '—'}
              </span>
            </div>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('color')}:</span>
              <span className='font-medium text-foreground'>{device.color ?? '—'}</span>
            </div>
            {device.batteryHealth != null && (
              <div className='flex justify-between border-b border-border/50 pb-1.5'>
                <span className='text-muted-foreground'>{t('battery')}:</span>
                <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                  {device.batteryHealth}%
                </span>
              </div>
            )}
            {device.defectNotes && (
              <div className='pt-1'>
                <span className='text-muted-foreground block mb-0.5'>{t('defectNotes')}:</span>
                <p className='text-foreground font-medium italic bg-muted/40 p-1.5 rounded'>
                  {device.defectNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='shadow-none border-border/70 flex flex-col justify-between'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-semibold flex items-center gap-2 text-foreground'>
              <Icons.truck className='h-4 w-4 text-sky-600 dark:text-sky-400' />
              {t('intakeCard')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2.5 text-xs'>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('intakeType')}:</span>
              <Badge variant='outline' className='text-[10px]'>
                {intake?.type === 'CONSIGNMENT' ? t('typeConsignment') : t('typePurchase')}
              </Badge>
            </div>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>
                {intake?.type === 'CONSIGNMENT' ? t('consignor') : t('supplier')}:
              </span>
              <span className='font-semibold text-foreground text-end'>
                {intake?.type === 'CONSIGNMENT'
                  ? (intake?.consignorName ?? '—')
                  : (intake?.supplierName ?? '—')}
              </span>
            </div>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('contact')}:</span>
              <span className='font-mono text-muted-foreground'>
                {intake?.type === 'CONSIGNMENT'
                  ? (intake?.consignorPhone ?? '—')
                  : (intake?.supplierPhone ?? '—')}
              </span>
            </div>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>
                {intake?.type === 'CONSIGNMENT' ? t('consignmentNo') : t('purchaseNo')}:
              </span>
              <span className='font-mono font-medium text-foreground'>
                {intake?.type === 'CONSIGNMENT'
                  ? (intake?.consignmentNo ?? '—')
                  : (intake?.purchaseNo ?? '—')}
              </span>
            </div>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('intakeDate')}:</span>
              <span className='font-medium text-foreground'>
                {formatIsoDate(intake?.purchaseDate ?? intake?.intakeDate)}
              </span>
            </div>
            <div className='flex justify-between pt-1'>
              <span className='text-muted-foreground font-semibold'>
                {intake?.type === 'CONSIGNMENT' ? t('agreedPayout') : t('unitCost')}:
              </span>
              <span className='text-sm font-bold text-foreground tabular-nums'>
                {formatPkr(device.unitCost)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-none border-border/70 flex flex-col justify-between'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-semibold flex items-center gap-2 text-foreground'>
              <Icons.receipt className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
              {t('saleCard')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2.5 text-xs'>
            {latestSale ? (
              <>
                <div className='flex justify-between border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('saleNo')}:</span>
                  <span className='font-mono font-semibold text-foreground'>
                    {latestSale.saleNo}
                  </span>
                </div>
                <div className='flex justify-between border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('saleDate')}:</span>
                  <span className='font-medium text-foreground'>
                    {formatIsoDate(latestSale.saleDate)}
                  </span>
                </div>
                <div className='flex justify-between border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('customer')}:</span>
                  <span className='font-semibold text-foreground text-end'>
                    {latestSale.customerName ?? 'Walk-in Customer'}
                  </span>
                </div>
                <div className='flex justify-between border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('salePrice')}:</span>
                  <span className='text-sm font-bold text-foreground tabular-nums'>
                    {formatPkr(latestSale.salePrice)}
                  </span>
                </div>
                <div className='pt-1 space-y-1'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>{t('warrantyStatus')}:</span>
                    <Badge
                      variant={warrantyBadge.variant}
                      className={
                        warrantyBadge.isActive
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : ''
                      }
                    >
                      {warrantyBadge.label}
                    </Badge>
                  </div>
                  {warrantyBadge.detail && (
                    <p className='text-[11px] text-muted-foreground text-end'>
                      {warrantyBadge.detail}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center py-4 text-center space-y-2'>
                <div className='p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
                  <Icons.box className='h-5 w-5' />
                </div>
                <p className='font-semibold text-foreground'>{t('inStockTitle')}</p>
                <p className='text-[11px] text-muted-foreground leading-snug'>{t('inStockDesc')}</p>
                {device.effectivePrice != null && (
                  <div className='pt-2'>
                    <span className='text-muted-foreground text-[11px] block'>
                      {t('askingPrice')}
                    </span>
                    <span className='text-sm font-bold text-foreground'>
                      {formatPkr(device.effectivePrice)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='shadow-none border-border/70 flex flex-col justify-between'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-semibold flex items-center gap-2 text-foreground'>
              <Icons.wallet className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
              {t('profitCard')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2.5 text-xs'>
            {latestSale ? (
              <>
                <div className='flex justify-between border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('unitCost')}:</span>
                  <span className='font-medium text-foreground tabular-nums'>
                    {formatPkr(device.unitCost)}
                  </span>
                </div>
                <div className='flex justify-between border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('salePrice')}:</span>
                  <span className='font-medium text-foreground tabular-nums'>
                    {formatPkr(latestSale.salePrice)}
                  </span>
                </div>
                <div className='flex justify-between border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('netProfit')}:</span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      latestSale.profitAmount >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatPkr(latestSale.profitAmount)}
                  </span>
                </div>
                <div className='flex justify-between pt-1'>
                  <span className='text-muted-foreground font-semibold'>{t('profitMargin')}:</span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      latestSale.profitMarginPercent >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {latestSale.profitMarginPercent}%
                  </span>
                </div>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center py-4 text-center space-y-2'>
                <div className='p-2 rounded-full bg-muted text-muted-foreground'>
                  <Icons.clock className='h-5 w-5' />
                </div>
                <p className='text-[11px] text-muted-foreground leading-snug'>
                  {t('awaitingSale')}
                </p>
                {device.effectivePrice != null && device.effectivePrice > device.unitCost && (
                  <div className='pt-2 border-t border-border/50 w-full flex justify-between text-[11px]'>
                    <span className='text-muted-foreground'>{t('estMargin')}:</span>
                    <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                      {formatPkr(device.effectivePrice - device.unitCost)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
