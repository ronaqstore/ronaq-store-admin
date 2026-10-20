'use client';

import { useTranslations } from 'next-intl';
import {
  IconCopy,
  IconCheck,
  IconBuildingStore,
  IconUser,
  IconAlertTriangle
} from '@tabler/icons-react';
import { formatPkr, formatLabel } from '@/lib/dukaan/numbers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatusBadge, type StatusTone } from '@/components/data-table';
import type { SerializedUnitsListProps } from '@/types/inventory';

export function SerializedUnitsGrid({
  units,
  copiedImei,
  onCopyImei,
  onOpenWriteOff
}: SerializedUnitsListProps) {
  const t = useTranslations('inventory');

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1'>
      {units.map((unit, idx) => {
        const tone: StatusTone =
          unit.status === 'IN_STOCK' ? 'success' : unit.status === 'SOLD' ? 'neutral' : 'danger';

        return (
          <Card
            key={unit.id}
            className='border-border/80 shadow-none hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden'
          >
            <div className='p-4 space-y-3'>
              <div className='flex items-center justify-between gap-2 border-b border-border/50 pb-2.5'>
                <div className='flex items-center gap-2'>
                  <span className='font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground'>
                    {t('unitNumber')} #{idx + 1}
                  </span>
                  <Badge
                    variant='outline'
                    className={
                      unit.condition === 'NEW'
                        ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]'
                        : 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px]'
                    }
                  >
                    {unit.condition}
                  </Badge>
                </div>

                <StatusBadge
                  status={unit.status}
                  label={formatLabel(unit.status)}
                  tone={tone}
                />
              </div>

              <div className='space-y-1.5'>
                <div className='flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 border border-border/40'>
                  <span className='text-xs text-muted-foreground font-medium'>
                    {t('imeiLabel')} 1:
                  </span>
                  <div className='flex items-center gap-1.5'>
                    <span className='font-mono text-xs font-semibold text-foreground tracking-wider'>
                      {unit.imei1}
                    </span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => onCopyImei(unit.imei1)}
                      className='h-6 w-6 text-muted-foreground hover:text-foreground'
                      title={t('copiedImei')}
                      aria-label={t('copiedImei')}
                    >
                      {copiedImei === unit.imei1 ? (
                        <IconCheck className='h-3.5 w-3.5 text-emerald-500' />
                      ) : (
                        <IconCopy className='h-3.5 w-3.5' />
                      )}
                    </Button>
                  </div>
                </div>

                {unit.imei2 ? (
                  <div className='flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 border border-border/40'>
                    <span className='text-xs text-muted-foreground font-medium'>
                      {t('imeiLabel')} 2:
                    </span>
                    <div className='flex items-center gap-1.5'>
                      <span className='font-mono text-xs font-semibold text-foreground tracking-wider'>
                        {unit.imei2}
                      </span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          if (unit.imei2) onCopyImei(unit.imei2);
                        }}
                        className='h-6 w-6 text-muted-foreground hover:text-foreground'
                        title={t('copiedImei')}
                        aria-label={t('copiedImei')}
                      >
                        {copiedImei === unit.imei2 ? (
                          <IconCheck className='h-3.5 w-3.5 text-emerald-500' />
                        ) : (
                          <IconCopy className='h-3.5 w-3.5' />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className='pt-1 space-y-2 text-xs'>
                <div className='flex items-center justify-between text-muted-foreground'>
                  <span>{t('avgCost')}:</span>
                  <span className='font-semibold text-foreground tabular-nums'>
                    {unit.unitCost ? formatPkr(unit.unitCost) : '—'}
                  </span>
                </div>

                {unit.batteryHealth != null ? (
                  <div className='flex items-center justify-between text-muted-foreground'>
                    <span>{t('batteryHealth')}:</span>
                    <span className='font-semibold text-foreground tabular-nums'>
                      {unit.batteryHealth}%
                    </span>
                  </div>
                ) : null}

                {unit.askingPrice != null || unit.effectivePrice != null ? (
                  <div className='flex items-center justify-between text-muted-foreground'>
                    <span>{t('askingPrice')}:</span>
                    <span className='font-semibold text-foreground tabular-nums'>
                      {formatPkr(unit.askingPrice ?? unit.effectivePrice ?? 0)}
                    </span>
                  </div>
                ) : null}

                {unit.purchaseNo ? (
                  <div className='rounded bg-muted/30 p-2 space-y-1 text-[11px] border border-border/30'>
                    <div className='flex items-center justify-between font-medium text-foreground'>
                      <span className='flex items-center gap-1 text-muted-foreground'>
                        <IconBuildingStore className='h-3 w-3' />
                        {unit.supplierName ?? t('supplier')}
                      </span>
                      <span>{unit.purchaseNo}</span>
                    </div>
                    {unit.purchaseDate ? (
                      <div className='flex items-center justify-between text-muted-foreground text-[10px]'>
                        <span>{t('date')}:</span>
                        <span>{unit.purchaseDate}</span>
                      </div>
                    ) : null}
                    {unit.supplierInvoiceRef ? (
                      <div className='flex items-center justify-between text-muted-foreground text-[10px]'>
                        <span>{t('invoiceRef')}:</span>
                        <span>{unit.supplierInvoiceRef}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {unit.status === 'SOLD' ? (
                  <div className='rounded bg-blue-500/[0.06] p-2 space-y-1 text-[11px] border border-blue-500/20'>
                    <div className='flex items-center justify-between font-medium text-blue-600 dark:text-blue-400'>
                      <span className='flex items-center gap-1'>
                        <IconUser className='h-3 w-3' />
                        {unit.customerName ?? t('customer')}
                      </span>
                      <span>{unit.saleNo}</span>
                    </div>
                    {unit.salePrice ? (
                      <div className='flex items-center justify-between text-foreground text-[10px] font-semibold'>
                        <span>{t('sellingPrice')}:</span>
                        <span>{formatPkr(unit.salePrice)}</span>
                      </div>
                    ) : null}
                    {unit.saleDate ? (
                      <div className='flex items-center justify-between text-muted-foreground text-[10px]'>
                        <span>{t('date')}:</span>
                        <span>{unit.saleDate}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {unit.status === 'IN_STOCK' ? (
              <div className='px-4 py-2.5 bg-muted/20 border-t border-border/50 flex items-center justify-end gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    onOpenWriteOff(
                      unit.id,
                      unit.imei2?.trim() ? `${unit.imei1} · ${unit.imei2}` : unit.imei1
                    )
                  }
                  className='h-7 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10'
                >
                  <IconAlertTriangle className='h-3.5 w-3.5 me-1' />
                  {t('markDamaged')}
                </Button>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
