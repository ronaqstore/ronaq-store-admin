'use client';

import { useTranslations } from 'next-intl';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { formatPkr, formatLabel } from '@/lib/dukaan/numbers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { StatusBadge, type StatusTone } from '@/components/data-table';
import type { SerializedUnitsListProps } from '@/types/inventory';

export function SerializedUnitsTable({
  units,
  copiedImei,
  onCopyImei,
  onOpenWriteOff
}: SerializedUnitsListProps) {
  const t = useTranslations('inventory');

  return (
    <div className='rounded-md border border-border bg-card overflow-hidden'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-14 text-center'>#</TableHead>
            <TableHead>{t('imeiLabel')} 1</TableHead>
            <TableHead>{t('imeiLabel')} 2</TableHead>
            <TableHead>{t('condition')}</TableHead>
            <TableHead>{t('avgCost')}</TableHead>
            <TableHead>{t('purchaseInfo')}</TableHead>
            <TableHead>{t('saleInfo')}</TableHead>
            <TableHead>{formatLabel('status')}</TableHead>
            <TableHead className='text-end'>{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit, idx) => {
            const tone: StatusTone =
              unit.status === 'IN_STOCK' ? 'success' : unit.status === 'SOLD' ? 'neutral' : 'danger';

            return (
              <TableRow key={unit.id}>
                <TableCell className='text-center font-mono text-xs text-muted-foreground'>
                  {idx + 1}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1.5 font-mono text-xs font-semibold'>
                    <span>{unit.imei1}</span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => onCopyImei(unit.imei1)}
                      className='h-5 w-5 text-muted-foreground'
                      title={t('copiedImei')}
                      aria-label={t('copiedImei')}
                    >
                      {copiedImei === unit.imei1 ? (
                        <IconCheck className='h-3 w-3 text-emerald-500' />
                      ) : (
                        <IconCopy className='h-3 w-3' />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {unit.imei2 ? (
                    <div className='flex items-center gap-1.5 font-mono text-xs text-muted-foreground'>
                      <span>{unit.imei2}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          if (unit.imei2) onCopyImei(unit.imei2);
                        }}
                        className='h-5 w-5'
                        title={t('copiedImei')}
                        aria-label={t('copiedImei')}
                      >
                        {copiedImei === unit.imei2 ? (
                          <IconCheck className='h-3 w-3 text-emerald-500' />
                        ) : (
                          <IconCopy className='h-3 w-3' />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <span className='text-muted-foreground text-xs'>—</span>
                  )}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className='font-semibold tabular-nums text-xs'>
                  {unit.unitCost ? formatPkr(unit.unitCost) : '—'}
                </TableCell>
                <TableCell className='text-xs'>
                  {unit.purchaseNo ? (
                    <div className='flex flex-col gap-0.5'>
                      <span className='font-medium'>{unit.supplierName ?? unit.purchaseNo}</span>
                      <span className='text-[10px] text-muted-foreground'>
                        {unit.purchaseNo} {unit.purchaseDate ? `· ${unit.purchaseDate}` : ''}
                      </span>
                    </div>
                  ) : (
                    <span className='text-muted-foreground'>—</span>
                  )}
                </TableCell>
                <TableCell className='text-xs'>
                  {unit.status === 'SOLD' ? (
                    <div className='flex flex-col gap-0.5'>
                      <span className='font-medium text-blue-600 dark:text-blue-400'>
                        {unit.customerName ?? unit.saleNo}
                      </span>
                      <span className='text-[10px] text-muted-foreground'>
                        {unit.salePrice ? formatPkr(unit.salePrice) : (unit.saleNo ?? '')}
                      </span>
                    </div>
                  ) : (
                    <span className='text-muted-foreground'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={unit.status}
                    label={formatLabel(unit.status)}
                    tone={tone}
                  />
                </TableCell>
                <TableCell className='text-end'>
                  {unit.status === 'IN_STOCK' ? (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => onOpenWriteOff(unit.imei1)}
                      className='h-7 text-xs text-rose-600 dark:text-rose-400'
                    >
                      {t('markDamaged')}
                    </Button>
                  ) : (
                    <span className='text-muted-foreground text-xs'>—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
