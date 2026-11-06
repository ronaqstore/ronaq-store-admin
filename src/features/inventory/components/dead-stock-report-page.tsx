'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';

import { deadStockReportQueryOptions } from '../api/queries';
import {
  calculateDiscountMargin,
  formatDaysOnShelf,
  getAgingBucketMeta
} from '../helpers/dead-stock-helpers';
import { DeadStockKpiCards } from './dead-stock-kpi-cards';
import { EditInventoryUnitDialog } from './edit-inventory-unit-dialog';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIsoDate } from '@/lib/dates';
import { formatPkr } from '@/lib/money';
import type {
  DeadStockAgingBucket,
  DeadStockQueryFilters,
  DeadStockUnitItemDto
} from '@/lib/api/types';

export function DeadStockReportPage() {
  const t = useTranslations('deadStock');
  const router = useRouter();

  const [activeBucket, setActiveBucket] = React.useState<'ALL' | DeadStockAgingBucket>('ALL');
  const [conditionFilter, setConditionFilter] = React.useState<'ALL' | 'NEW' | 'USED'>('ALL');
  const [sortBy, setSortBy] = React.useState<'ageDesc' | 'ageAsc' | 'costDesc' | 'costAsc'>(
    'ageDesc'
  );
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [copiedImei, setCopiedImei] = React.useState<string | null>(null);
  const [unitForEdit, setUnitForEdit] = React.useState<DeadStockUnitItemDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryFilters: DeadStockQueryFilters = React.useMemo(
    () => ({
      bucket: activeBucket,
      condition: conditionFilter,
      search: debouncedSearch || undefined,
      sortBy,
      page,
      pageSize
    }),
    [activeBucket, conditionFilter, debouncedSearch, sortBy, page, pageSize]
  );

  const {
    data: report,
    isLoading,
    isFetching,
    refetch
  } = useQuery(deadStockReportQueryOptions(queryFilters));

  const summary = report?.summary;
  const pagination = report?.pagination;
  const items = pagination?.items ?? [];

  const handleCopyImei = async (imei: string) => {
    try {
      await navigator.clipboard.writeText(imei);
      setCopiedImei(imei);
      toast.success(t('table.imeiCopied'));
      setTimeout(() => setCopiedImei(null), 2000);
    } catch {
      toast.error(t('table.copyFailed'));
    }
  };

  const handleBucketToggle = (bucket: DeadStockAgingBucket) => {
    setActiveBucket((prev) => (prev === bucket ? 'ALL' : bucket));
    setPage(1);
  };

  const handleSelectDeadStock = () => {
    setActiveBucket('60+');
    setPage(1);
  };

  const handleResetFilters = () => {
    setActiveBucket('ALL');
    setConditionFilter('ALL');
    setSortBy('ageDesc');
    setSearchTerm('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleOpenEdit = (unit: DeadStockUnitItemDto) => {
    setUnitForEdit(unit);
    setEditDialogOpen(true);
  };

  const handleEditOpenChange = (isOpen: boolean) => {
    setEditDialogOpen(isOpen);
    if (!isOpen) {
      setUnitForEdit(null);
    }
  };

  const handlePagePrevious = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handlePageNext = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      setPage((p) => p + 1);
    }
  };

  const handleConditionChange = (val: 'ALL' | 'NEW' | 'USED' | null) => {
    if (val) {
      setConditionFilter(val);
      setPage(1);
    }
  };

  const handleSortChange = (val: 'ageDesc' | 'ageAsc' | 'costDesc' | 'costAsc' | null) => {
    if (val) {
      setSortBy(val);
      setPage(1);
    }
  };

  const handleView360 = (imei: string) => {
    router.push(`/dashboard/imei-search?imei=${imei}`);
  };

  const isFiltered =
    activeBucket !== 'ALL' ||
    conditionFilter !== 'ALL' ||
    debouncedSearch.length > 0 ||
    sortBy !== 'ageDesc';

  return (
    <div className='flex flex-col gap-6 p-4 md:p-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Icons.clock className='h-6 w-6 text-primary' />
            <h1 className='text-2xl font-bold tracking-tight'>{t('title')}</h1>
          </div>
          <p className='text-sm text-muted-foreground mt-1'>{t('description')}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isFetching}
            className='gap-1.5'
          >
            <Icons.spinner className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? t('refreshing') : t('refresh')}</span>
          </Button>
        </div>
      </div>

      <DeadStockKpiCards
        summary={summary}
        activeBucket={activeBucket}
        isLoading={isLoading}
        onBucketToggle={handleBucketToggle}
        onSelectDeadStock={handleSelectDeadStock}
      />

      <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card border rounded-lg p-3'>
        <div className='relative flex-1'>
          <Icons.search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder={t('filters.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='ps-9'
          />
          {searchTerm && (
            <button
              type='button'
              onClick={handleClearSearch}
              className='absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground text-xs p-1'
              title={t('filters.clearSearch')}
            >
              <Icons.close className='h-3.5 w-3.5' />
            </button>
          )}
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <Select value={conditionFilter} onValueChange={handleConditionChange}>
            <SelectTrigger className='w-[130px]'>
              <SelectValue placeholder={t('filters.condition')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>{t('filters.allConditions')}</SelectItem>
              <SelectItem value='NEW'>{t('filters.conditionNew')}</SelectItem>
              <SelectItem value='USED'>{t('filters.conditionUsed')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder={t('filters.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ageDesc'>{t('filters.sortAgeDesc')}</SelectItem>
              <SelectItem value='ageAsc'>{t('filters.sortAgeAsc')}</SelectItem>
              <SelectItem value='costDesc'>{t('filters.sortCostDesc')}</SelectItem>
              <SelectItem value='costAsc'>{t('filters.sortCostAsc')}</SelectItem>
            </SelectContent>
          </Select>

          {isFiltered && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleResetFilters}
              className='text-xs h-9 text-muted-foreground hover:text-foreground'
            >
              {t('filters.clearFilters')}
            </Button>
          )}
        </div>
      </div>

      <div className='rounded-lg border bg-card overflow-hidden shadow-xs'>
        {isLoading ? (
          <div className='p-8 space-y-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : items.length === 0 ? (
          <div className='flex flex-col items-center justify-center p-12 text-center'>
            <Icons.clock className='h-12 w-12 text-muted-foreground/50 mb-3' />
            <h3 className='text-base font-semibold'>{t('empty.title')}</h3>
            <p className='text-sm text-muted-foreground mt-1 max-w-sm'>
              {isFiltered ? t('empty.desc') : t('empty.allClear')}
            </p>
            {isFiltered && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleResetFilters}
                className='mt-4'
              >
                {t('filters.clearFilters')}
              </Button>
            )}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-start'>
              <thead className='bg-muted/50 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wider'>
                <tr>
                  <th className='py-3 px-4'>#</th>
                  <th className='py-3 px-4'>{t('table.phone')}</th>
                  <th className='py-3 px-4'>{t('table.imei')}</th>
                  <th className='py-3 px-4'>{t('table.condition')}</th>
                  <th className='py-3 px-4'>{t('table.shelfAge')}</th>
                  <th className='py-3 px-4'>{t('table.unitCost')}</th>
                  <th className='py-3 px-4'>{t('table.askingPrice')}</th>
                  <th className='py-3 px-4'>{t('table.intakeDate')}</th>
                  <th className='py-3 px-4 text-end'>{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60'>
                {items.map((unit, idx) => {
                  const meta = getAgingBucketMeta(unit.agingBucket);
                  const marginInfo = calculateDiscountMargin(unit.unitCost, unit.askingPrice);
                  const rowNumber =
                    (pagination ? (pagination.page - 1) * pagination.pageSize : 0) + idx + 1;

                  return (
                    <tr
                      key={unit.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        unit.agingBucket === '60+'
                          ? 'bg-rose-50/20 dark:bg-rose-950/10'
                          : unit.agingBucket === '31-60'
                            ? 'bg-amber-50/20 dark:bg-amber-950/10'
                            : ''
                      }`}
                    >
                      <td className='py-3 px-4 text-xs text-muted-foreground font-mono'>
                        {rowNumber}
                      </td>

                      <td className='py-3 px-4'>
                        <div className='font-medium text-foreground'>{unit.productName}</div>
                        <div className='text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5'>
                          {unit.brandName && <span className='font-medium'>{unit.brandName}</span>}
                          {unit.storage && <span>· {unit.storage}</span>}
                          {unit.ram && <span>· {unit.ram} RAM</span>}
                          {unit.color && <span>· {unit.color}</span>}
                          {unit.ptaStatus && (
                            <Badge variant='outline' className='text-[10px] py-0 px-1 font-mono'>
                              {unit.ptaStatus}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className='py-3 px-4'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-mono text-xs'>{unit.imei1}</span>
                          <button
                            type='button'
                            onClick={() => handleCopyImei(unit.imei1)}
                            className='text-muted-foreground hover:text-foreground p-0.5 rounded'
                            title={t('table.copyImei')}
                          >
                            {copiedImei === unit.imei1 ? (
                              <Icons.check className='h-3.5 w-3.5 text-emerald-600' />
                            ) : (
                              <Icons.copy className='h-3.5 w-3.5' />
                            )}
                          </button>
                        </div>
                        {unit.imei2 && (
                          <div className='text-[11px] text-muted-foreground font-mono mt-0.5'>
                            {t('table.sim2Label', { imei: unit.imei2 })}
                          </div>
                        )}
                      </td>

                      <td className='py-3 px-4'>
                        <Badge
                          variant={unit.condition === 'NEW' ? 'default' : 'secondary'}
                          className='text-xs font-semibold'
                        >
                          {unit.condition === 'NEW'
                            ? t('filters.conditionNew')
                            : t('filters.conditionUsed')}
                        </Badge>
                        {unit.batteryHealth != null && (
                          <div className='text-[11px] text-muted-foreground mt-0.5'>
                            🔋 {unit.batteryHealth}%
                          </div>
                        )}
                      </td>

                      <td className='py-3 px-4'>
                        <div className='flex flex-col gap-1 items-start'>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-full ${meta.bgLightClass} ${meta.textClass}`}
                          >
                            <Icons.clock className='h-3 w-3' />
                            {formatDaysOnShelf(unit.daysOnShelf)}
                          </span>
                          <span className='text-[10px] text-muted-foreground'>{meta.label}</span>
                        </div>
                      </td>

                      <td className='py-3 px-4 font-mono font-medium text-xs'>
                        {formatPkr(unit.unitCost)}
                      </td>

                      <td className='py-3 px-4'>
                        {unit.askingPrice != null && unit.askingPrice > 0 ? (
                          <div>
                            <div className='font-mono font-semibold text-xs'>
                              {formatPkr(unit.askingPrice)}
                            </div>
                            <div
                              className={`text-[10px] font-mono mt-0.5 ${
                                marginInfo.isAboveCost
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : marginInfo.marginPaisa === 0
                                    ? 'text-muted-foreground'
                                    : 'text-rose-600 dark:text-rose-400 font-semibold'
                              }`}
                            >
                              {marginInfo.isAboveCost
                                ? `+${formatPkr(marginInfo.marginPaisa)} (${marginInfo.marginPercent}%)`
                                : marginInfo.marginPaisa === 0
                                  ? t('table.atCost')
                                  : `${formatPkr(marginInfo.marginPaisa)} (${marginInfo.marginPercent}%)`}
                            </div>
                          </div>
                        ) : (
                          <span className='text-xs text-muted-foreground italic'>
                            {t('table.noAskingPrice')}
                          </span>
                        )}
                      </td>

                      <td className='py-3 px-4 text-xs text-muted-foreground'>
                        <div>{formatIsoDate(unit.intakeDate)}</div>
                        {unit.sourceName && (
                          <div className='text-[11px] text-foreground/80 truncate max-w-[120px]'>
                            {unit.sourceName}
                          </div>
                        )}
                      </td>

                      <td className='py-3 px-4 text-end'>
                        <div className='flex items-center justify-end gap-1.5'>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='h-7 px-2 text-xs gap-1'
                            onClick={() => handleOpenEdit(unit)}
                          >
                            <Icons.edit className='h-3 w-3' />
                            <span>{t('table.adjustPrice')}</span>
                          </Button>

                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='h-7 px-2 text-xs text-primary gap-1'
                            onClick={() => handleView360(unit.imei1)}
                            title={t('table.view360Title')}
                          >
                            <Icons.scan className='h-3 w-3' />
                            <span>{t('table.view360')}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className='flex items-center justify-between border-t p-3 text-xs text-muted-foreground bg-muted/20'>
            <div>
              {t('pagination.showing', {
                start: (pagination.page - 1) * pagination.pageSize + 1,
                end: Math.min(pagination.page * pagination.pageSize, pagination.total),
                total: pagination.total
              })}
            </div>
            <div className='flex items-center gap-1'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={handlePagePrevious}
                disabled={pagination.page <= 1}
              >
                <Icons.chevronLeft className='h-3.5 w-3.5' />
              </Button>
              <span className='px-2 font-mono'>
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={handlePageNext}
                disabled={pagination.page >= pagination.totalPages}
              >
                <Icons.chevronRight className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
        )}
      </div>

      {unitForEdit && (
        <EditInventoryUnitDialog
          open={editDialogOpen}
          onOpenChange={handleEditOpenChange}
          unit={unitForEdit}
          brandName={unitForEdit.brandName}
        />
      )}
    </div>
  );
}
