'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, formatIsoDate } from '@/lib/dates';
import { formatPkr } from '@/lib/money';
import type { ImeiTimelineEventDto } from '@/lib/api/types';
import type { ImeiSearchResultProps } from '@/types/inventory';
import { formatPtaStatusLabel, formatWarrantyBadge } from '../helpers/imei-lookup-helpers';

export function ImeiSearchResult({ result, onCopyImei }: ImeiSearchResultProps) {
  const t = useTranslations('imeiSearch');
  const device = result.device;

  if (!result.found || !device) return null;

  const intake = result.intake;
  const latestSale = result.latestSale;
  const warrantyBadge = formatWarrantyBadge(latestSale);

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <Icons.truck className='h-4 w-4 text-sky-600 dark:text-sky-400' />;
      case 'CONSIGNMENT_INTAKE':
        return <Icons.phone className='h-4 w-4 text-purple-600 dark:text-purple-400' />;
      case 'SALE':
        return <Icons.receipt className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />;
      case 'CUSTOMER_RETURN':
        return <Icons.history className='h-4 w-4 text-amber-600 dark:text-amber-400' />;
      case 'DAMAGED':
        return <Icons.warning className='h-4 w-4 text-rose-600 dark:text-rose-400' />;
      case 'LOST':
        return <Icons.ban className='h-4 w-4 text-destructive' />;
      case 'ADJUSTMENT':
        return <Icons.adjustments className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />;
      case 'SALE_CANCEL':
      case 'PURCHASE_CANCEL':
        return <Icons.close className='h-4 w-4 text-destructive' />;
      default:
        return <Icons.history className='h-4 w-4 text-muted-foreground' />;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <Badge className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'>
            {t('status.inStock')}
          </Badge>
        );
      case 'SOLD':
        return (
          <Badge className='bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'>
            {t('status.sold')}
          </Badge>
        );
      case 'DAMAGED':
        return (
          <Badge className='bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'>
            {t('status.damaged')}
          </Badge>
        );
      case 'LOST':
        return (
          <Badge className='bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'>
            {t('status.lost')}
          </Badge>
        );
      case 'VOIDED':
        return <Badge variant='outline'>{t('status.voided')}</Badge>;
      default:
        return <Badge variant='secondary'>{status}</Badge>;
    }
  };

  return (
    <div className='min-w-0 space-y-4 overflow-x-clip sm:space-y-6'>
      <Card className='min-w-0 border-border/70 bg-card/60 shadow-none'>
        <CardContent className='flex min-w-0 flex-col justify-between gap-4 p-4 sm:p-5 md:flex-row md:items-center'>
          <div className='min-w-0 space-y-1.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='min-w-0 break-words text-xl font-bold tracking-tight text-foreground md:text-2xl'>
                {device.productName}
              </h2>
              {renderStatusBadge(device.status)}
              <Badge variant='outline'>
                {device.condition === 'NEW' ? t('conditionNew') : t('conditionUsed')}
              </Badge>
              <Badge variant='secondary'>{formatPtaStatusLabel(device.ptaStatus)}</Badge>
            </div>

            <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 font-mono text-sm text-muted-foreground'>
              <div className='flex min-w-0 max-w-full flex-wrap items-center gap-1.5'>
                <span>{t('imei1Label')}</span>
                <span className='min-w-0 break-all font-semibold text-foreground'>
                  {device.imei1}
                </span>
                <button
                  type='button'
                  onClick={() => onCopyImei(device.imei1)}
                  className='ms-1 shrink-0 p-0.5 hover:text-foreground'
                  title={t('copyImei')}
                >
                  <Icons.copy className='h-3.5 w-3.5' />
                </button>
              </div>

              {device.imei2 ? (
                <div className='flex min-w-0 max-w-full flex-wrap items-center gap-1.5 border-s border-border ps-3'>
                  <span>{t('imei2Label')}</span>
                  <span className='min-w-0 break-all font-semibold text-foreground'>
                    {device.imei2}
                  </span>
                  <button
                    type='button'
                    onClick={() => onCopyImei(device.imei2 ?? '')}
                    className='ms-1 shrink-0 p-0.5 hover:text-foreground'
                    title={t('copyImei')}
                  >
                    <Icons.copy className='h-3.5 w-3.5' />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className='shrink-0 text-start md:text-end'>
            <p className='text-xs text-muted-foreground'>{t('shelfTime')}</p>
            <p className='text-base font-semibold text-foreground'>
              {t('daysOnShelf', { days: device.daysOnShelf })}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className='grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='shadow-none border-border/70 flex flex-col justify-between'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-semibold flex items-center gap-2 text-foreground'>
              <Icons.product className='h-4 w-4 text-primary' />
              {t('specsCard')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2.5 text-xs'>
            <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('brandCategoryLabel')}</span>
              <span className='min-w-0 break-words text-start font-medium text-foreground sm:text-end'>
                {device.brandName ?? '—'} · {device.categoryName ?? '—'}
              </span>
            </div>
            <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('modelSkuLabel')}</span>
              <span className='min-w-0 break-all text-start font-mono font-medium text-foreground sm:text-end'>
                {device.model ?? '—'} / {device.sku ?? '—'}
              </span>
            </div>
            <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('storageRamLabel')}</span>
              <span className='min-w-0 break-words text-start font-medium text-foreground sm:text-end'>
                {device.storage ?? '—'} / {device.ram ?? '—'}
              </span>
            </div>
            <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('color')}:</span>
              <span className='min-w-0 break-words text-start font-medium text-foreground sm:text-end'>
                {device.color ?? '—'}
              </span>
            </div>
            {device.batteryHealth != null ? (
              <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
                <span className='text-muted-foreground'>{t('battery')}:</span>
                <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                  {device.batteryHealth}%
                </span>
              </div>
            ) : null}
            {device.defectNotes ? (
              <div className='pt-1'>
                <span className='text-muted-foreground block mb-0.5'>{t('defectNotes')}:</span>
                <p className='text-foreground font-medium italic bg-muted/40 p-1.5 rounded'>
                  {device.defectNotes}
                </p>
              </div>
            ) : null}
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
            <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('intakeType')}:</span>
              <Badge variant='outline' className='text-[10px]'>
                {intake?.type === 'CONSIGNMENT' ? t('typeConsignment') : t('typePurchase')}
              </Badge>
            </div>
            <div className='flex justify-between border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>
                {intake?.type === 'CONSIGNMENT' ? t('consignor') : t('supplier')}:
              </span>
              <span className='min-w-0 break-words text-start font-semibold text-foreground sm:text-end'>
                {intake?.type === 'CONSIGNMENT'
                  ? (intake?.consignorName ?? '—')
                  : (intake?.supplierName ?? '—')}
              </span>
            </div>
            <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('contactLabel')}</span>
              <span className='font-mono text-muted-foreground'>
                {intake?.type === 'CONSIGNMENT'
                  ? (intake?.consignorPhone ?? '—')
                  : (intake?.supplierPhone ?? '—')}
              </span>
            </div>
            <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>
                {intake?.type === 'CONSIGNMENT' ? t('consignmentNo') : t('purchaseNo')}:
              </span>
              <span className='min-w-0 break-all text-start font-mono font-medium text-foreground sm:text-end'>
                {intake?.type === 'CONSIGNMENT'
                  ? (intake?.consignmentNo ?? '—')
                  : (intake?.purchaseNo ?? '—')}
              </span>
            </div>
            <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
              <span className='text-muted-foreground'>{t('intakeDate')}:</span>
              <span className='font-medium text-foreground'>
                {formatIsoDate(intake?.purchaseDate ?? intake?.intakeDate)}
              </span>
            </div>
            <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 pt-1'>
              <span className='text-muted-foreground font-semibold'>
                {intake?.type === 'CONSIGNMENT' ? t('agreedPayout') : t('unitCost')}:
              </span>
              {device.unitCost > 0 ? (
                <span className='text-sm font-bold text-foreground tabular-nums'>
                  {formatPkr(device.unitCost)}
                </span>
              ) : (
                <span className='text-xs text-muted-foreground italic'>{t('costHidden')}</span>
              )}
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
            {device.unitCost === 0 ? (
              <div className='flex flex-col items-center justify-center py-6 text-center space-y-2'>
                <div className='p-2 rounded-full bg-muted text-muted-foreground'>
                  <Icons.lock className='h-5 w-5' />
                </div>
                <p className='font-semibold text-foreground'>{t('costHiddenTitle')}</p>
                <p className='text-[11px] text-muted-foreground leading-snug'>
                  {t('costHiddenDesc')}
                </p>
              </div>
            ) : latestSale ? (
              <>
                <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('saleNo')}:</span>
                  <span className='min-w-0 break-all text-start font-mono font-semibold text-foreground sm:text-end'>
                    {latestSale.saleNo}
                  </span>
                </div>
                <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('saleDate')}:</span>
                  <span className='font-medium text-foreground'>
                    {formatIsoDate(latestSale.saleDate)}
                  </span>
                </div>
                <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('customer')}:</span>
                  <span className='min-w-0 break-words text-start font-semibold text-foreground sm:text-end'>
                    {latestSale.customerName ?? t('walkInCustomer')}
                  </span>
                </div>
                <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
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
                  {warrantyBadge.detail ? (
                    <p className='text-[11px] text-muted-foreground text-end'>
                      {warrantyBadge.detail}
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center py-4 text-center space-y-2'>
                <div className='p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
                  <Icons.box className='h-5 w-5' />
                </div>
                <p className='font-semibold text-foreground'>{t('inStockTitle')}</p>
                <p className='text-[11px] text-muted-foreground leading-snug'>{t('inStockDesc')}</p>
                {device.effectivePrice != null ? (
                  <div className='pt-2'>
                    <span className='text-muted-foreground text-[11px] block'>
                      {t('askingPrice')}
                    </span>
                    <span className='text-sm font-bold text-foreground'>
                      {formatPkr(device.effectivePrice)}
                    </span>
                  </div>
                ) : null}
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
            {device.unitCost === 0 ? (
              <div className='flex flex-col items-center justify-center py-6 text-center space-y-2'>
                <div className='p-2 rounded-full bg-muted text-muted-foreground'>
                  <Icons.lock className='h-5 w-5' />
                </div>
                <p className='font-semibold text-foreground'>{t('costHiddenTitle')}</p>
                <p className='text-[11px] text-muted-foreground leading-snug'>
                  {t('costHiddenDesc')}
                </p>
              </div>
            ) : latestSale ? (
              <>
                <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
                  <span className='text-muted-foreground'>{t('unitCost')}:</span>
                  <span className='font-medium text-foreground tabular-nums'>
                    {formatPkr(device.unitCost)}
                  </span>
                </div>
                <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/50 pb-1.5'>
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
                <div className='flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-0.5 pt-1'>
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
                {device.effectivePrice != null && device.effectivePrice > device.unitCost ? (
                  <div className='pt-2 border-t border-border/50 w-full flex justify-between text-[11px]'>
                    <span className='text-muted-foreground'>{t('estimatedMargin')}</span>
                    <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                      {formatPkr(device.effectivePrice - device.unitCost)}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='shadow-none border-border/70'>
        <CardHeader>
          <CardTitle className='text-base font-semibold flex items-center gap-2'>
            <Icons.history className='h-5 w-5 text-primary' />
            {t('timelineCard')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.timeline.length === 0 ? (
            <p className='text-sm text-muted-foreground py-4 text-center'>{t('noTimeline')}</p>
          ) : (
            <div className='relative ps-6 space-y-6 before:absolute before:inset-s-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border'>
              {result.timeline.map((event: ImeiTimelineEventDto) => (
                <div key={event.id} className='relative group'>
                  <div className='absolute -inset-s-6 top-1 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center'>
                    {getTimelineIcon(event.type)}
                  </div>
                  <div className='bg-muted/30 rounded-lg p-3.5 border border-border/50 hover:border-border transition-colors'>
                    <div className='mb-1 flex min-w-0 flex-col justify-between gap-1 sm:flex-row sm:items-center'>
                      <div className='flex min-w-0 flex-wrap items-center gap-2'>
                        <span className='min-w-0 break-words text-sm font-semibold text-foreground'>
                          {event.title}
                        </span>
                        {event.referenceNo ? (
                          <Badge
                            variant='outline'
                            className='max-w-full break-all font-mono text-[10px]'
                          >
                            {event.referenceNo}
                          </Badge>
                        ) : null}
                      </div>
                      <span className='break-words font-mono text-xs text-muted-foreground'>
                        {formatDateTime(event.date)}
                      </span>
                    </div>
                    <p className='break-words text-xs text-muted-foreground'>{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
