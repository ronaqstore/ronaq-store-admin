'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InfiniteEntitySelect } from '@/components/forms/infinite-entity-select';
import { ImeiCameraScanButton } from '@/components/barcode';
import { useT } from '@/i18n/use-t';
import { listInventoryUnits } from '@/features/inventory/api/service';
import { formatUnitImeiLabel } from '@/lib/inventory/format-unit-imei-label';
import type { ListFilters } from '@/lib/dukaan';
import type {
  SaleLineImeiFieldProps,
  SaleLineImeiPickerItem,
  SaleUnitOptionSource
} from '@/types/sales';

function formatSaleUnitOption(unit: SaleUnitOptionSource, t: ReturnType<typeof useT>): string {
  const parts = [
    formatUnitImeiLabel(unit.imei1, unit.imei2),
    unit.condition || null,
    unit.batteryHealth != null ? t('dukaan.sale.batteryPct', { pct: unit.batteryHealth }) : null
  ].filter(Boolean);
  return parts.join(' · ');
}

export function SaleLineImeiField({
  productId,
  name,
  value,
  onBlur,
  onValueChange,
  isInvalid,
  errors,
  excludedUnitIds
}: SaleLineImeiFieldProps) {
  const t = useT();
  const [selectedLabel, setSelectedLabel] = useState('');
  const excludedKey = excludedUnitIds.join(',');

  useEffect(() => {
    if (!value) setSelectedLabel('');
  }, [value, productId]);

  const fetchImeiPage = useCallback(
    async (filters: ListFilters) => {
      if (!productId) {
        return { items: [], total: 0, page: 1, limit: filters.pageSize ?? 20 };
      }

      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? filters.limit ?? 20;
      const excluded = new Set(excludedKey ? excludedKey.split(',') : []);
      const res = await listInventoryUnits(productId, 'IN_STOCK', filters.search, undefined, {
        page,
        pageSize
      });

      const items: SaleLineImeiPickerItem[] = res.items
        .filter((unit) => unit.id === value || !excluded.has(unit.id))
        .map((unit) => {
          const condition =
            unit.condition === 'USED' || unit.condition === 'NEW' ? unit.condition : undefined;
          return {
            id: unit.id,
            name: formatSaleUnitOption(unit, t),
            condition,
            effectivePrice: unit.effectivePrice ?? unit.askingPrice ?? null,
            batteryHealth: unit.batteryHealth ?? null,
            defectNotes: unit.defectNotes ?? null
          };
        });

      return {
        items,
        total: res.total,
        page: res.page,
        limit: res.pageSize
      };
    },
    [productId, value, excludedKey, t]
  );

  const handleValueChange = (unitId: string, item: SaleLineImeiPickerItem | null) => {
    setSelectedLabel(item?.name ?? '');
    onValueChange(unitId, item?.condition, {
      condition: item?.condition,
      effectivePrice: item?.effectivePrice ?? null,
      batteryHealth: item?.batteryHealth ?? null,
      defectNotes: item?.defectNotes ?? null
    });
  };

  const handleScanImei = async (scannedImei: string) => {
    if (!productId) return;
    try {
      const res = await listInventoryUnits(productId, 'IN_STOCK', scannedImei, undefined, {
        page: 1,
        pageSize: 10
      });
      const excluded = new Set(excludedKey ? excludedKey.split(',') : []);
      const matched = res.items.find(
        (u) =>
          (u.imei1 === scannedImei || u.imei2 === scannedImei) &&
          (u.id === value || !excluded.has(u.id))
      );

      if (matched) {
        const condition =
          matched.condition === 'USED' || matched.condition === 'NEW'
            ? matched.condition
            : undefined;
        const pickerItem: SaleLineImeiPickerItem = {
          id: matched.id,
          name: formatSaleUnitOption(matched, t),
          condition,
          effectivePrice: matched.effectivePrice ?? matched.askingPrice ?? null,
          batteryHealth: matched.batteryHealth ?? null,
          defectNotes: matched.defectNotes ?? null
        };
        handleValueChange(matched.id, pickerItem);
        toast.success(t('scanner.unitSelected', { imei: scannedImei }));
      } else {
        toast.warning(t('scanner.unitNotFoundInStock', { imei: scannedImei }));
      }
    } catch {
      toast.error(t('scanner.scanFailed'));
    }
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={name}>{t('dukaan.sale.imeiUnit')} *</FieldLabel>
      <div onBlur={onBlur} className='flex items-center gap-1.5'>
        <div className='min-w-0 flex-1'>
          <InfiniteEntitySelect<SaleLineImeiPickerItem>
            value={value || ''}
            onValueChange={handleValueChange}
            queryKey={['inventory', 'sale-units-select', productId, excludedKey]}
            fetchPage={fetchImeiPage}
            selectedLabel={selectedLabel || undefined}
            extraItems={value && selectedLabel ? [{ id: value, name: selectedLabel }] : []}
            activeOnly={false}
            disabled={!productId}
            placeholder={t('dukaan.sale.selectImei')}
            searchPlaceholder={t('inventory.searchImei')}
            emptyMessage={t('dukaan.sale.noImeisInStock')}
            className='h-9 w-full min-w-0'
          />
        </div>
        <ImeiCameraScanButton
          onScan={(code) => void handleScanImei(code)}
          title={t('scanner.scanImeiTitle')}
          disabled={!productId}
          className='h-9 w-9 shrink-0'
        />
      </div>
      {isInvalid ? <FieldError id={`${name}-error`} errors={errors} /> : null}
    </Field>
  );
}
