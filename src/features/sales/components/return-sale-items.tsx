'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { formatPkr } from '@/lib/dukaan/numbers';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/use-t';
import type { ReturnSaleItemsProps } from '@/types/sales';

export function ReturnSaleItems({
  items,
  itemStates,
  itemsError,
  onSelectChange,
  onQuantityChange,
  onConditionChange
}: ReturnSaleItemsProps) {
  const t = useT();

  return (
    <div className='space-y-2'>
      <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
        {t('sales.returnDialog.selectItems')}
      </Label>
      <div className={cn('space-y-2 rounded-lg border p-3', itemsError && 'border-destructive')}>
        {items.map((item) => {
          const state = itemStates[item.id] || {
            selected: false,
            quantity: item.quantity,
            condition: 'GOOD' as const
          };

          return (
            <div
              key={item.id}
              className='flex flex-col gap-2 rounded-md border p-2 text-sm sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id={`check-${item.id}`}
                  checked={state.selected}
                  onCheckedChange={(checked) => onSelectChange(item.id, Boolean(checked))}
                />
                <div>
                  <Label htmlFor={`check-${item.id}`} className='font-medium cursor-pointer'>
                    {item.productName}
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    {t('sales.returnDialog.sold')} {item.quantity} {t('sales.returnDialog.price')}{' '}
                    {formatPkr(item.unitPrice)}
                    {item.imei && ` · ${t('inventory.imeiLabel')} ${item.imei}`}
                  </p>
                </div>
              </div>

              {state.selected ? (
                <div className='flex items-center gap-2 ps-6 sm:ps-0'>
                  <div className='w-20'>
                    <Input
                      type='number'
                      min={1}
                      max={item.quantity}
                      value={state.quantity}
                      onChange={(e) => onQuantityChange(item.id, item.quantity, e.target.value)}
                      className='h-8'
                    />
                  </div>
                  <Select
                    value={state.condition}
                    onValueChange={(val: 'GOOD' | 'DAMAGED' | null) =>
                      onConditionChange(item.id, val)
                    }
                  >
                    <SelectTrigger className='h-8 w-28'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='GOOD'>{t('sales.returnDialog.conditionGood')}</SelectItem>
                      <SelectItem value='DAMAGED'>
                        {t('sales.returnDialog.conditionDamaged')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <DialogFieldError message={itemsError} />
    </div>
  );
}
