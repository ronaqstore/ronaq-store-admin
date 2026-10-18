'use client';

import { useQuery } from '@tanstack/react-query';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useT } from '@/i18n/use-t';
import { listInventoryUnits } from '@/features/inventory/api/service';
import { inventoryKeys } from '@/features/inventory/api/queries';
import type { SaleLineImeiFieldProps } from '@/types/sales';

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
  const unitsQuery = useQuery({
    queryKey: [...inventoryKeys.all, 'units', productId],
    queryFn: () => listInventoryUnits(productId),
    enabled: !!productId
  });

  const excluded = new Set(excludedUnitIds);
  const options = (unitsQuery.data ?? [])
    .filter((unit) => unit.id === value || !excluded.has(unit.id))
    .map((unit) => ({
      value: unit.id,
      label: `${t('inventory.imeiLabel')} ${unit.imei1}${
        unit.condition ? ` · ${unit.condition}` : ''
      }`
    }));

  const placeholder = unitsQuery.isLoading
    ? t('dukaan.sale.loadingImeis')
    : options.length === 0
      ? t('dukaan.sale.noImeisInStock')
      : t('dukaan.sale.selectImei');

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={name}>
        {t('dukaan.sale.imeiUnit')} *
      </FieldLabel>
      <Select
        name={name}
        value={value || ''}
        onValueChange={(next) => onValueChange(next ?? '')}
        items={options.map((opt) => ({ value: opt.value, label: opt.label }))}
      >
        <SelectTrigger
          id={name}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? `${name}-error` : undefined}
          disabled={!productId || unitsQuery.isLoading || options.length === 0}
          onBlur={onBlur}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {!unitsQuery.isLoading && options.length === 0 ? (
        <FieldDescription>{t('dukaan.sale.noImeisInStockHelp')}</FieldDescription>
      ) : null}
      {isInvalid ? <FieldError id={`${name}-error`} errors={errors} /> : null}
    </Field>
  );
}
