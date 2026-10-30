'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  IconArrowLeft,
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconAlertTriangle,
  IconDeviceMobile
} from '@tabler/icons-react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SerializedUnitsKpiCards } from './serialized-units-kpi-cards';
import { productQueryOptions } from '@/features/products/api/queries';
import { inventoryUnitsQueryOptions } from '../api/queries';
import { SerializedProductUnitsDialogs } from './serialized-product-units-dialogs';
import {
  averageSerializedUnitCost,
  filterSerializedUnits
} from './serialized-product-units-helpers';
import { SerializedUnitsGrid } from './serialized-units-grid';
import { SerializedUnitsTable } from './serialized-units-table';
import type { InventoryItemDTO, InventoryUnitDTO } from '@/lib/api/types';
import type {
  SerializedProductUnitsPageProps,
  SerializedUnitsConditionFilter,
  SerializedUnitsStatusFilter
} from '@/types/inventory';

export function SerializedProductUnitsPage({ productId }: SerializedProductUnitsPageProps) {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const tProduct = useTranslations('dukaan.product');
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SerializedUnitsStatusFilter>('ALL');
  const [conditionFilter, setConditionFilter] = useState<SerializedUnitsConditionFilter>('ALL');
  const [batteryMin, setBatteryMin] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedImei, setCopiedImei] = useState<string | null>(null);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedUnitIdForAdjust, setSelectedUnitIdForAdjust] = useState<string>('');
  const [selectedUnitLabelForAdjust, setSelectedUnitLabelForAdjust] = useState<string>('');

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selectedUnitForRestore, setSelectedUnitForRestore] = useState<InventoryUnitDTO | null>(
    null
  );

  const [editOpen, setEditOpen] = useState(false);
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<InventoryUnitDTO | null>(null);

  const { data: product } = useQuery(productQueryOptions(productId));
  const { data: unitsPage, isLoading } = useQuery(
    inventoryUnitsQueryOptions(productId, 'ALL', undefined, undefined, {
      page: 1,
      pageSize: 100
    })
  );

  const units = (unitsPage?.items ?? []) as InventoryUnitDTO[];

  const handleCopyImei = (imei: string) => {
    navigator.clipboard.writeText(imei);
    setCopiedImei(imei);
    toast.success(t('copiedImei'));
    setTimeout(() => {
      setCopiedImei((prev) => (prev === imei ? null : prev));
    }, 2000);
  };

  const productItemDTO = useMemo((): InventoryItemDTO | null => {
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      categoryName: product.categoryName,
      brandName: product.brandName,
      trackingType: 'SERIALIZED',
      inStock: units.filter((u) => u.status === 'IN_STOCK').length,
      stockValue: units
        .filter((u) => u.status === 'IN_STOCK')
        .reduce((sum, u) => sum + (u.unitCost ?? 0), 0),
      lowStock: false,
      imeis: units.filter((u) => u.status === 'IN_STOCK').map((u) => u.imei1)
    };
  }, [product, units]);

  const inStockUnits = useMemo(() => units.filter((u) => u.status === 'IN_STOCK'), [units]);
  const soldUnits = useMemo(() => units.filter((u) => u.status === 'SOLD'), [units]);
  const damagedUnits = useMemo(
    () => units.filter((u) => u.status === 'DAMAGED' || u.status === 'LOST'),
    [units]
  );

  const totalStockValue = useMemo(
    () => inStockUnits.reduce((acc, u) => acc + (u.unitCost ?? 0), 0),
    [inStockUnits]
  );

  const avgUnitCost = useMemo(
    () => averageSerializedUnitCost(inStockUnits, units, totalStockValue),
    [inStockUnits, totalStockValue, units]
  );

  const filteredUnits = useMemo(
    () =>
      filterSerializedUnits(units, {
        statusFilter,
        conditionFilter,
        batteryMin,
        search
      }),
    [units, statusFilter, conditionFilter, batteryMin, search]
  );

  const handleOpenWriteOff = (unitId: string, imeiLabel: string) => {
    setSelectedUnitIdForAdjust(unitId);
    setSelectedUnitLabelForAdjust(imeiLabel);
    setAdjustOpen(true);
  };

  const handleOpenRestore = (unit: InventoryUnitDTO) => {
    setSelectedUnitForRestore(unit);
    setRestoreOpen(true);
  };

  const handleOpenEdit = (unit: InventoryUnitDTO) => {
    setSelectedUnitForEdit(unit);
    setEditOpen(true);
  };

  const handleOpenGeneralAdjust = () => {
    setSelectedUnitIdForAdjust('');
    setSelectedUnitLabelForAdjust('');
    setAdjustOpen(true);
  };

  return (
    <div className='flex flex-col gap-5 p-4 sm:p-6 max-w-7xl mx-auto w-full'>
      <div className='flex flex-col gap-4 border-b border-border/80 pb-5'>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => router.push('/dashboard/inventory')}
            className='gap-1 text-muted-foreground hover:text-foreground -ms-2'
          >
            <IconArrowLeft className='h-4 w-4' />
            {t('backToInventory')}
          </Button>
        </div>

        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='space-y-1.5'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                {product?.name ?? '...'}
              </h1>
              <Badge
                variant='outline'
                className='border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10 uppercase font-semibold text-xs'
              >
                {t('serializedUnits')}
              </Badge>
              {product?.brandName ? (
                <Badge variant='secondary' className='text-xs'>
                  {product.brandName}
                </Badge>
              ) : null}
              {product?.categoryName ? (
                <Badge variant='outline' className='text-xs'>
                  {product.categoryName}
                </Badge>
              ) : null}
            </div>

            <div className='flex items-center gap-2 flex-wrap text-xs text-muted-foreground pt-0.5'>
              {product?.model ? (
                <span>
                  {tProduct('model')}:{' '}
                  <strong className='text-foreground font-medium'>{product.model}</strong>
                </span>
              ) : null}
              {product?.color ? (
                <>
                  <span>·</span>
                  <span>
                    {tProduct('color')}:{' '}
                    <strong className='text-foreground font-medium'>{product.color}</strong>
                  </span>
                </>
              ) : null}
              {product?.storage ? (
                <>
                  <span>·</span>
                  <span>
                    {tProduct('storage')}:{' '}
                    <strong className='text-foreground font-medium'>{product.storage}</strong>
                  </span>
                </>
              ) : null}
              {product?.ram ? (
                <>
                  <span>·</span>
                  <span>
                    {tProduct('ram')}:{' '}
                    <strong className='text-foreground font-medium'>{product.ram}</strong>
                  </span>
                </>
              ) : null}
              {product?.ptaStatus ? (
                <>
                  <span>·</span>
                  <Badge variant='outline' className='text-[10px] px-1 py-0 h-4 uppercase'>
                    {product.ptaStatus}
                  </Badge>
                </>
              ) : null}
              {product?.sku ? (
                <>
                  <span>·</span>
                  <span className='font-mono text-[11px] bg-muted/60 px-1 rounded'>
                    {tProduct('sku')}: {product.sku}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className='flex items-center gap-2.5 shrink-0'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleOpenGeneralAdjust}
              className='gap-1.5'
            >
              <IconAlertTriangle className='h-4 w-4' />
              {tCommon('adjustStock')}
            </Button>
            <Button
              type='button'
              size='sm'
              onClick={() => router.push('/dashboard/purchases/new')}
              className='gap-1.5'
            >
              <IconPlus className='h-4 w-4' />
              {t('addPurchase')}
            </Button>
          </div>
        </div>
      </div>

      <SerializedUnitsKpiCards
        totalCount={units.length}
        inStockCount={inStockUnits.length}
        soldCount={soldUnits.length}
        damagedCount={damagedUnits.length}
        totalStockValue={totalStockValue}
        avgUnitCost={avgUnitCost}
      />

      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1'>
        <div className='flex items-center gap-1.5 flex-wrap'>
          <Button
            type='button'
            size='sm'
            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('ALL')}
            className='h-8 text-xs'
          >
            {t('allStatuses')} ({units.length})
          </Button>
          <Button
            type='button'
            size='sm'
            variant={statusFilter === 'IN_STOCK' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('IN_STOCK')}
            className='h-8 text-xs'
          >
            {t('inStockUnits')} ({inStockUnits.length})
          </Button>
          <Button
            type='button'
            size='sm'
            variant={statusFilter === 'SOLD' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('SOLD')}
            className='h-8 text-xs'
          >
            {t('soldUnits')} ({soldUnits.length})
          </Button>
          <Button
            type='button'
            size='sm'
            variant={statusFilter === 'DAMAGED_LOST' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('DAMAGED_LOST')}
            className='h-8 text-xs'
          >
            {t('damagedUnits')} ({damagedUnits.length})
          </Button>
          <Button
            type='button'
            size='sm'
            variant={conditionFilter === 'ALL' ? 'secondary' : 'outline'}
            onClick={() => setConditionFilter('ALL')}
            className='h-8 text-xs'
          >
            {t('conditionAll')}
          </Button>
          <Button
            type='button'
            size='sm'
            variant={conditionFilter === 'NEW' ? 'secondary' : 'outline'}
            onClick={() => setConditionFilter('NEW')}
            className='h-8 text-xs'
          >
            {t('conditionNew')}
          </Button>
          <Button
            type='button'
            size='sm'
            variant={conditionFilter === 'USED' ? 'secondary' : 'outline'}
            onClick={() => setConditionFilter('USED')}
            className='h-8 text-xs'
          >
            {t('conditionUsed')}
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <Input
            type='number'
            min={1}
            max={100}
            placeholder={t('batteryMinPlaceholder')}
            value={batteryMin}
            onChange={(e) => setBatteryMin(e.target.value)}
            className='h-9 w-28 text-xs'
            aria-label={t('batteryMinPlaceholder')}
          />
          <div className='relative w-full sm:w-64'>
            <IconSearch className='absolute inset-s-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder={t('searchImei')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='ps-8 h-9 text-xs'
            />
          </div>

          <div className='flex items-center rounded-md border border-border p-0.5 bg-muted/40 shrink-0'>
            <Button
              type='button'
              size='icon'
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className='h-7 w-7'
              title={t('gridView')}
              aria-label={t('gridView')}
            >
              <IconLayoutGrid className='h-4 w-4' />
            </Button>
            <Button
              type='button'
              size='icon'
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('table')}
              className='h-7 w-7'
              title={t('tableView')}
              aria-label={t('tableView')}
            >
              <IconList className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2'>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className='p-4 space-y-3 animate-pulse'>
              <div className='h-5 bg-muted rounded w-1/3' />
              <div className='h-4 bg-muted rounded w-2/3' />
              <div className='h-16 bg-muted/60 rounded' />
            </Card>
          ))}
        </div>
      ) : filteredUnits.length === 0 ? (
        <Card className='p-12 text-center border-dashed border-border flex flex-col items-center justify-center gap-3'>
          <div className='h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground'>
            <IconDeviceMobile className='h-6 w-6' />
          </div>
          <div className='space-y-1'>
            <h3 className='font-semibold text-foreground'>{t('noUnitsFound')}</h3>
            <p className='text-xs text-muted-foreground max-w-sm'>{t('noUnitsFound')}</p>
          </div>
          <Button
            type='button'
            size='sm'
            onClick={() => router.push('/dashboard/purchases/new')}
            className='gap-1.5 mt-2'
          >
            <IconPlus className='h-4 w-4' />
            {t('addPurchase')}
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <SerializedUnitsGrid
          units={filteredUnits}
          copiedImei={copiedImei}
          onCopyImei={handleCopyImei}
          onOpenWriteOff={handleOpenWriteOff}
          onOpenRestore={handleOpenRestore}
          onOpenEdit={handleOpenEdit}
        />
      ) : (
        <SerializedUnitsTable
          units={filteredUnits}
          copiedImei={copiedImei}
          onCopyImei={handleCopyImei}
          onOpenWriteOff={handleOpenWriteOff}
          onOpenRestore={handleOpenRestore}
          onOpenEdit={handleOpenEdit}
        />
      )}

      <SerializedProductUnitsDialogs
        productId={productId}
        brandName={product?.brandName}
        productItemDTO={productItemDTO}
        adjustOpen={adjustOpen}
        onAdjustOpenChange={setAdjustOpen}
        selectedUnitIdForAdjust={selectedUnitIdForAdjust}
        selectedUnitLabelForAdjust={selectedUnitLabelForAdjust}
        restoreOpen={restoreOpen}
        onRestoreOpenChange={setRestoreOpen}
        selectedUnitForRestore={selectedUnitForRestore}
        editOpen={editOpen}
        onEditOpenChange={setEditOpen}
        selectedUnitForEdit={selectedUnitForEdit}
      />
    </div>
  );

}
