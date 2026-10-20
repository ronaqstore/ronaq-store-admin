'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { InfiniteEntitySelect } from '@/components/forms/infinite-entity-select';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import { cn } from '@/lib/utils';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import type { NamedEntity } from '@/types';
import type { StockAdjustDialogProps, StockAdjustFormErrors } from '@/types/inventory';
import { createInventoryAdjustment, listInventoryUnits } from '../api/service';
import { inventoryKeys, inventoryStockQueryOptions } from '../api/queries';
import type { CreateInventoryAdjustmentInput } from '@/lib/api/types';
import { formatUnitImeiLabel } from '@/lib/inventory/format-unit-imei-label';


export function StockAdjustDialog({
  open,
  onOpenChange,
  initialProduct,
  initialUnitId,
  initialUnitLabel
}: StockAdjustDialogProps) {
  const qc = useQueryClient();
  const t = useT();
  const { data: stockData } = useQuery({
    ...inventoryStockQueryOptions({ limit: 100, sortBy: 'name', sortOrder: 'asc' }),
    enabled: open
  });

  const products = (stockData?.items ?? []).filter((p) => {
    if (p.inStock > 0) return true;
    if (initialProduct?.id === p.id) return true;
    return false;
  });

  const [productId, setProductId] = useState<string>(initialProduct?.id ?? '');
  const [type, setType] = useState<'ADJUSTMENT' | 'DAMAGED' | 'LOST'>('ADJUSTMENT');
  const [countedQuantity, setCountedQuantity] = useState<number>(initialProduct?.inStock ?? 0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(initialUnitId ?? '');
  const [selectedUnitLabel, setSelectedUnitLabel] = useState<string>(initialUnitLabel ?? '');
  const [reason, setReason] = useState<string>('');
  const [errors, setErrors] = useState<StockAdjustFormErrors>({});

  const selectedProduct =
    products.find((p) => p.id === productId) ??
    (initialProduct?.id === productId ? initialProduct : null);

  const isSerialized = selectedProduct?.trackingType === 'SERIALIZED';

  useEffect(() => {
    if (initialProduct) {
      setProductId(initialProduct.id);
      setCountedQuantity(initialProduct.inStock);
      return;
    }
    if (products.length === 0) {
      setProductId('');
      return;
    }
    const stillValid = products.some((p) => p.id === productId);
    if (!productId || !stillValid) {
      setProductId(products[0].id);
      setCountedQuantity(products[0].inStock);
    }
  }, [initialProduct, products, productId]);

  useEffect(() => {
    if (!selectedProduct) return;
    setCountedQuantity(selectedProduct.inStock);
    const available = Math.max(0, selectedProduct.inStock);
    setQuantity(available > 0 ? Math.min(1, available) : 0);
    if (initialUnitId && initialProduct?.id === selectedProduct.id) {
      setSelectedUnitId(initialUnitId);
      setSelectedUnitLabel(initialUnitLabel ?? initialUnitId);
    } else {
      setSelectedUnitId('');
      setSelectedUnitLabel('');
    }
    if (selectedProduct.trackingType === 'SERIALIZED' && type === 'ADJUSTMENT') {
      setType('DAMAGED');
    }
  }, [productId, initialUnitId, initialUnitLabel, initialProduct?.id]);

  const fetchImeiPage = useCallback(
    async (filters: {
      page?: number;
      limit?: number;
      pageSize?: number;
      search?: string;
    }) => {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? filters.limit ?? 20;
      const res = await listInventoryUnits(productId, 'IN_STOCK', filters.search, undefined, {
        page,
        pageSize
      });
      const items: NamedEntity[] = res.items.map((unit) => ({
        id: unit.id,
        name: formatUnitImeiLabel(unit.imei1, unit.imei2)
      }));
      return {
        items,
        total: res.total,
        page: res.page,
        limit: res.pageSize
      };
    },
    [productId]
  );

  const buildPayload = (): CreateInventoryAdjustmentInput | null => {
    const payload: CreateInventoryAdjustmentInput = {
      productId,
      type,
      reason: reason.trim()
    };

    if (type === 'ADJUSTMENT') {
      payload.countedQuantity = Number(countedQuantity);
    } else if (isSerialized) {
      payload.inventoryUnitId = selectedUnitId;
    } else {
      payload.quantity = Math.max(1, Number(quantity));
    }

    return payload;
  };

  const mutation = useMutation({
    mutationFn: async (payload: CreateInventoryAdjustmentInput) =>
      createInventoryAdjustment(payload),
    onSuccess: (res) => {
      const message = res.message || t('inventory.adjustSuccess');
      onOpenChange(false);
      setReason('');
      void qc.invalidateQueries({ queryKey: inventoryKeys.all });
      toastSuccessAfterClose(message);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('inventory.adjustFailed'));
    }
  });

  const writeOffQtyMax = selectedProduct
    ? Math.min(Math.max(0, selectedProduct.inStock), INPUT_LIMITS.quantityMax)
    : INPUT_LIMITS.quantityMax;
  const canWriteOffQuantity = writeOffQtyMax >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: StockAdjustFormErrors = {};
    if (!productId) {
      nextErrors.productId = t('validation.productRequired');
    }
    if (!reason.trim()) {
      nextErrors.reason = t('validation.reasonRequired');
    }
    if (type !== 'ADJUSTMENT' && isSerialized && !selectedUnitId) {
      nextErrors.imei = t('validation.imeiRequired');
    }
    if (
      type !== 'ADJUSTMENT' &&
      !isSerialized &&
      (writeOffQtyMax < 1 || quantity < 1 || quantity > writeOffQtyMax)
    ) {
      nextErrors.quantity = t('inventory.noStockToWriteOff');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    const payload = buildPayload();
    if (!payload) return;
    mutation.mutate(payload);
  };

  const handleProductChange = (val: string | null) => {
    setProductId(val ?? '');
    setErrors((prev) => ({ ...prev, productId: undefined }));
  };

  const handleTypeChange = (val: string | null) => {
    if (val) setType(val as 'ADJUSTMENT' | 'DAMAGED' | 'LOST');
  };

  const handleUnitChange = (id: string, item: NamedEntity | null) => {
    setSelectedUnitId(id);
    setSelectedUnitLabel(item?.name ?? '');
    setErrors((prev) => ({ ...prev, imei: undefined }));
  };

  const handleCountedQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCountedQuantity(
      Number(
        sanitizeNumberInput(e.target.value, { min: 0, max: INPUT_LIMITS.quantityMax })
      ) || 0
    );
  };

  const handleWriteOffQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canWriteOffQuantity) {
      setQuantity(0);
      return;
    }
    setQuantity(
      Number(
        sanitizeNumberInput(e.target.value, { min: 1, max: writeOffQtyMax })
      ) || 1
    );
    setErrors((prev) => ({ ...prev, quantity: undefined }));
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(clampText(e.target.value, INPUT_LIMITS.cancelReason));
    setErrors((prev) => ({ ...prev, reason: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={handleSubmit} className='min-w-0 space-y-4'>
          <DialogHeader>
            <DialogTitle>{t('inventory.adjustTitle')}</DialogTitle>
            <DialogDescription>{t('inventory.adjustDesc')}</DialogDescription>
          </DialogHeader>

          <div className='grid min-w-0 gap-4 py-2'>
            <div className='min-w-0 space-y-1.5'>
              <Label htmlFor='adj-product'>{t('table.col.product')}</Label>
              <Select value={productId} onValueChange={handleProductChange}>
                <SelectTrigger id='adj-product' className='w-full min-w-0'>
                  <SelectValue placeholder={t('inventory.selectProduct')}>
                    {selectedProduct ? (
                      <span
                        className='block min-w-0 truncate'
                        title={`${selectedProduct.name} · ${selectedProduct.inStock} ${t('inventory.inStockDot')} · ${selectedProduct.trackingType}`}
                      >
                        {selectedProduct.name}
                        <span className='text-muted-foreground'>
                          {' '}
                          · {selectedProduct.inStock} {t('inventory.inStockDot')} ·{' '}
                          {selectedProduct.trackingType}
                        </span>
                      </span>
                    ) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => {
                    const fullLabel = `${p.name} · ${p.inStock} ${t('inventory.inStockDot')} · ${p.trackingType}`;
                    return (
                      <SelectItem key={p.id} value={p.id} title={fullLabel}>
                        {fullLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <DialogFieldError message={errors.productId} />
            </div>

            <div className='min-w-0 space-y-1.5'>
              <Label htmlFor='adj-type'>{t('inventory.changeType')}</Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger id='adj-type' className='w-full min-w-0'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {!isSerialized && (
                    <SelectItem value='ADJUSTMENT'>{t('inventory.typeShelfCount')}</SelectItem>
                  )}
                  <SelectItem value='DAMAGED'>{t('inventory.typeDamaged')}</SelectItem>
                  <SelectItem value='LOST'>{t('inventory.typeLost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'ADJUSTMENT' ? (
              <div className='min-w-0 space-y-1.5'>
                <div className='flex items-center justify-between gap-2'>
                  <Label htmlFor='adj-count'>{t('inventory.physicalCount')}</Label>
                  {selectedProduct && (
                    <span className='shrink-0 text-xs text-muted-foreground'>
                      {t('inventory.currentSystemStock')} {selectedProduct.inStock}
                    </span>
                  )}
                </div>
                <Input
                  id='adj-count'
                  type='number'
                  min={0}
                  max={INPUT_LIMITS.quantityMax}
                  value={countedQuantity}
                  onChange={handleCountedQuantityChange}
                  onKeyDown={(e) => blockInvalidNumberKeys(e)}
                  required
                />
                {selectedProduct && (
                  <p className='text-[11px] text-muted-foreground'>
                    {t('inventory.changeLabel')}{' '}
                    <span
                      className={
                        countedQuantity - selectedProduct.inStock > 0
                          ? 'font-semibold text-emerald-600'
                          : countedQuantity - selectedProduct.inStock < 0
                            ? 'font-semibold text-rose-600'
                            : 'font-semibold text-muted-foreground'
                      }
                    >
                      {countedQuantity - selectedProduct.inStock > 0 ? '+' : ''}
                      {countedQuantity - selectedProduct.inStock}
                    </span>{' '}
                    {t('inventory.units')}
                  </p>
                )}
              </div>
            ) : isSerialized ? (
              <div className='min-w-0 space-y-1.5'>
                <Label htmlFor='adj-imei'>{t('inventory.unitImeiToWriteOff')}</Label>
                {productId ? (
                  <InfiniteEntitySelect
                    value={selectedUnitId}
                    onValueChange={handleUnitChange}
                    queryKey={['inventory', 'units-select', productId]}
                    fetchPage={fetchImeiPage}
                    selectedLabel={selectedUnitLabel || undefined}
                    extraItems={
                      selectedUnitId && selectedUnitLabel
                        ? [{ id: selectedUnitId, name: selectedUnitLabel }]
                        : []
                    }
                    activeOnly={false}
                    placeholder={t('inventory.selectImei')}
                    searchPlaceholder={t('inventory.searchImei')}
                    emptyMessage={t('inventory.noUnitsFound')}
                    className='h-9 w-full min-w-0'
                  />
                ) : null}
                <DialogFieldError id='adj-imei-error' message={errors.imei} />
              </div>
            ) : (
              <div className='min-w-0 space-y-1.5'>
                <div className='flex items-center justify-between gap-2'>
                  <Label htmlFor='adj-qty'>{t('inventory.quantityToWriteOff')}</Label>
                  {selectedProduct && (
                    <span className='shrink-0 text-xs text-muted-foreground'>
                      {t('inventory.availableLabel')} {selectedProduct.inStock}
                    </span>
                  )}
                </div>
                <Input
                  id='adj-qty'
                  type='number'
                  min={canWriteOffQuantity ? 1 : 0}
                  max={writeOffQtyMax}
                  value={canWriteOffQuantity ? quantity : 0}
                  onChange={handleWriteOffQuantityChange}
                  onKeyDown={(e) => blockInvalidNumberKeys(e)}
                  disabled={!canWriteOffQuantity}
                  required={canWriteOffQuantity}
                  className={cn(errors.quantity && 'border-destructive')}
                  aria-invalid={!!errors.quantity}
                />
                <DialogFieldError id='adj-qty-error' message={errors.quantity} />
                {!canWriteOffQuantity ? (
                  <p className='text-xs text-muted-foreground'>
                    {t('inventory.noStockToWriteOff')}
                  </p>
                ) : null}
              </div>
            )}

            <div className='min-w-0 space-y-1.5'>
              <Label htmlFor='adj-reason'>{t('inventory.reasonMandatory')}</Label>
              <Textarea
                id='adj-reason'
                placeholder={t('inventory.reasonPlaceholder')}
                rows={3}
                value={reason}
                onChange={handleReasonChange}
                maxLength={INPUT_LIMITS.cancelReason}
                className={cn(errors.reason && 'border-destructive')}
                aria-invalid={!!errors.reason}
                required
              />
              <DialogFieldError id='adj-reason-error' message={errors.reason} />
            </div>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <DialogCancelButton onClick={() => onOpenChange(false)} disabled={mutation.isPending} />
            <DialogPrimaryButton
              mode='save'
              label={t('inventory.recordChange')}
              loading={mutation.isPending}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
