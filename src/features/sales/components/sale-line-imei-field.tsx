'use client';

import { useCallback, useEffect, useState } from 'react';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InfiniteEntitySelect } from '@/components/forms/infinite-entity-select';
import { useT } from '@/i18n/use-t';
import { listInventoryUnits } from '@/features/inventory/api/service';
import { formatUnitImeiLabel } from '@/lib/inventory/format-unit-imei-label';
import type { NamedEntity } from '@/types';
import type { SaleLineImeiFieldProps, SaleLineImeiUnitPick } from '@/types/sales';

type ImeiPickerItem = NamedEntity & SaleLineImeiUnitPick;

function formatSaleUnitOption(
  unit: {
    imei1: string;
    imei2?: string | null;
    condition?: string | null;
    batteryHealth?: number | null;
  },
  t: ReturnType<typeof useT>
): string {
  const parts = [
    formatUnitImeiLabel(unit.imei1, unit.imei2),
    unit.condition || null,
    unit.batteryHealth != null
      ? t('dukaan.sale.batteryPct', { pct: unit.batteryHealth })
      : null
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
    async (filters: {
      page?: number;
      limit?: number;
      pageSize?: number;
      search?: string;
    }) => {
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

      const items: ImeiPickerItem[] = res.items
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

  const handleValueChange = (unitId: string, item: ImeiPickerItem | null) => {
    setSelectedLabel(item?.name ?? '');
    onValueChange(unitId, item?.condition, {
      condition: item?.condition,
      effectivePrice: item?.effectivePrice ?? null,
      batteryHealth: item?.batteryHealth ?? null,
      defectNotes: item?.defectNotes ?? null
    });
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={name}>{t('dukaan.sale.imeiUnit')} *</FieldLabel>
      <div onBlur={onBlur}>
        <InfiniteEntitySelect<ImeiPickerItem>
          value={value || ''}
          onValueChange={handleValueChange}
          queryKey={['inventory', 'sale-units-select', productId, excludedKey]}
          fetchPage={fetchImeiPage}
          selectedLabel={selectedLabel || undefined}
          extraItems={
            value && selectedLabel ? [{ id: value, name: selectedLabel }] : []
          }
          activeOnly={false}
          disabled={!productId}
          placeholder={t('dukaan.sale.selectImei')}
          searchPlaceholder={t('inventory.searchImei')}
          emptyMessage={t('dukaan.sale.noImeisInStock')}
          className='h-9 w-full min-w-0'
        />
      </div>
      {isInvalid ? <FieldError id={`${name}-error`} errors={errors} /> : null}
    </Field>
  );
}
