'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/use-t';
import { createClientRequestId, formatPkr, toPaisa } from '@/lib/dukaan/numbers';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import type { ReturnPreviewDTO, ReturnItemInput } from '@/lib/api/types';
import { todayIsoDate } from '@/lib/dates';
import { OverdraftAlert } from '@/components/common/overdraft-alert';
import type { ReturnSaleDialogProps, ItemReturnState } from '@/types/sales';
import { createReturnMutation, previewReturnMutation } from '../api/mutations';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { SALE_SYNC_DOMAINS } from '@/lib/query/sync-domains';

export function ReturnSaleDialog({ sale, open, onOpenChange, onSuccess }: ReturnSaleDialogProps) {
  const qc = useQueryClient();
  const t = useT();
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId());
  const [returnDate, setReturnDate] = useState(todayIsoDate);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [refundPkr, setRefundPkr] = useState<number>(0);
  const [confirmOverdraft, setConfirmOverdraft] = useState(false);
  const [previewData, setPreviewData] = useState<ReturnPreviewDTO | null>(null);
  const [itemsError, setItemsError] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [refundError, setRefundError] = useState('');

  const [itemStates, setItemStates] = useState<Record<string, ItemReturnState>>(() => {
    const initial: Record<string, ItemReturnState> = {};
    for (const item of sale.items) {
      initial[item.id] = {
        selected: false,
        quantity: item.quantity,
        condition: 'GOOD'
      };
    }
    return initial;
  });

  const preview = useMutation({
    ...previewReturnMutation,
    onSuccess: (data) => {
      setPreviewData(data);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('sales.returnDialog.previewFailed'));
    }
  });

  const recordReturn = useMutation({
    ...createReturnMutation,
    onSuccess: (res) => {
      if (res && 'confirmOverdraft' in res && res.confirmOverdraft) {
        const shortfallPkr = formatPkr(
          res.shortfall ?? (previewData?.cashAfter ? Math.abs(previewData.cashAfter) : 0)
        );
        toast.warning(
          t('sales.returnDialog.overdraftNotice', {
            shortfall: shortfallPkr
          })
        );
        setConfirmOverdraft(false);
        return;
      }

      setClientRequestId(createClientRequestId());
      onOpenChange(false);
      invalidateDomains({ queryClient: qc, domains: SALE_SYNC_DOMAINS });
      toastSuccessAfterClose(t('sales.returnDialog.success'));
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('sales.returnDialog.failed'));
    }
  });

  const handleItemSelectChange = (itemId: string, selected: boolean) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected }
    }));
    setItemsError('');
  };

  const handleItemQuantityChange = (itemId: string, maxQty: number, valStr: string) => {
    const cappedMax = Math.min(maxQty, INPUT_LIMITS.quantityMax);
    const sanitized = sanitizeNumberInput(valStr, { min: 1, max: cappedMax });
    const val = sanitized === '' ? 1 : Number(sanitized);
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: val }
    }));
  };

  const handleRefundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeNumberInput(e.target.value, {
      min: 0,
      max: INPUT_LIMITS.amountRupeesMax
    });
    setRefundPkr(sanitized === '' ? 0 : Number(sanitized));
    setRefundError('');
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(clampText(e.target.value, INPUT_LIMITS.cancelReason));
    setReasonError('');
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(clampText(e.target.value, INPUT_LIMITS.notes));
  };

  const handleItemConditionChange = (itemId: string, condition: 'GOOD' | 'DAMAGED' | null) => {
    if (!condition) return;
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], condition }
    }));
  };

  const getSelectedReturnItems = (): ReturnItemInput[] | null => {
    const selectedItems: ReturnItemInput[] = sale.items
      .filter((item) => itemStates[item.id]?.selected)
      .map((item) => ({
        saleItemId: item.id,
        quantity: itemStates[item.id].quantity,
        condition: itemStates[item.id].condition
      }));

    if (selectedItems.length === 0) {
      return null;
    }
    return selectedItems;
  };

  const validateSelectedItems = (): ReturnItemInput[] | null => {
    const selectedItems = getSelectedReturnItems();
    if (!selectedItems) {
      setItemsError(t('sales.returnDialog.selectAtLeastOne'));
      return null;
    }
    setItemsError('');
    return selectedItems;
  };

  const handleRunPreview = () => {
    const selectedItems = validateSelectedItems();
    if (!selectedItems) return;

    preview.mutate({
      id: sale.id,
      input: {
        items: selectedItems,
        refundAmount: toPaisa(refundPkr)
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setReasonError(t('sales.returnDialog.reasonRequired'));
      return;
    }
    setReasonError('');

    const selectedItems = validateSelectedItems();
    if (!selectedItems) return;

    if (!previewData) {
      setRefundError(t('sales.returnDialog.previewRequired') || 'Preview the settlement before saving.');
      return;
    }

    if (toPaisa(refundPkr) > previewData.refundable) {
      setRefundError(t('validation.refundExceedsMax'));
      return;
    }
    if (previewData.willCauseOverdraft && !confirmOverdraft) {
      setRefundError(
        t('sales.returnDialog.confirmOverdraftRequired') || 'Confirm overdraft before saving.'
      );
      return;
    }
    setRefundError('');

    recordReturn.mutate({
      id: sale.id,
      input: {
        clientRequestId,
        reason: reason.trim(),
        returnDate,
        items: selectedItems,
        refundAmount: toPaisa(refundPkr),
        confirmOverdraft: confirmOverdraft ? true : undefined,
        notes: notes.trim() || undefined
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t('sales.returnDialog.title', { saleNo: sale.saleNo })}</DialogTitle>
          <DialogDescription>{t('sales.returnDialog.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              {t('sales.returnDialog.selectItems')}
            </Label>
            <div
              className={cn('space-y-2 rounded-lg border p-3', itemsError && 'border-destructive')}
            >
              {sale.items.map((item) => {
                const state = itemStates[item.id] || {
                  selected: false,
                  quantity: item.quantity,
                  condition: 'GOOD'
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
                        onCheckedChange={(checked) =>
                          handleItemSelectChange(item.id, Boolean(checked))
                        }
                      />
                      <div>
                        <Label htmlFor={`check-${item.id}`} className='font-medium cursor-pointer'>
                          {item.productName}
                        </Label>
                        <p className='text-xs text-muted-foreground'>
                          {t('sales.returnDialog.sold')} {item.quantity}{' '}
                          {t('sales.returnDialog.price')} {formatPkr(item.unitPrice)}
                          {item.imei && ` · ${t('inventory.imeiLabel')} ${item.imei}`}
                        </p>
                      </div>
                    </div>

                    {state.selected && (
                      <div className='flex items-center gap-2 ps-6 sm:ps-0'>
                        <div className='w-20'>
                          <Input
                            type='number'
                            min={1}
                            max={item.quantity}
                            value={state.quantity}
                            onChange={(e) =>
                              handleItemQuantityChange(item.id, item.quantity, e.target.value)
                            }
                            className='h-8'
                          />
                        </div>
                        <Select
                          value={state.condition}
                          onValueChange={(val: 'GOOD' | 'DAMAGED' | null) =>
                            handleItemConditionChange(item.id, val)
                          }
                        >
                          <SelectTrigger className='h-8 w-28'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='GOOD'>
                              {t('sales.returnDialog.conditionGood')}
                            </SelectItem>
                            <SelectItem value='DAMAGED'>
                              {t('sales.returnDialog.conditionDamaged')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <DialogFieldError message={itemsError} />
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='returnDate'>
                {t('sales.returnDialog.returnDate')} <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='returnDate'
                type='date'
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='refundAmount'>{t('sales.returnDialog.cashRefund')}</Label>
              <Input
                id='refundAmount'
                type='number'
                min={0}
                max={INPUT_LIMITS.amountRupeesMax}
                value={refundPkr}
                onChange={handleRefundChange}
                onKeyDown={(e) => blockInvalidNumberKeys(e)}
                placeholder={t('common.amountPlaceholder')}
                aria-invalid={!!refundError}
                className={cn(refundError && 'border-destructive')}
              />
              <DialogFieldError message={refundError} />
            </div>
          </div>

          <div className='flex justify-end'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleRunPreview}
              isLoading={preview.isPending}
            >
              <Icons.eye className='me-1.5 h-3.5 w-3.5' />
              {t('sales.returnDialog.previewSettlement')}
            </Button>
          </div>

          {previewData && (
            <div className='space-y-2 rounded-lg border bg-muted/40 p-3 text-xs'>
              <p className='font-semibold text-foreground'>
                {t('sales.returnDialog.settlementPreview')}
              </p>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <span className='text-muted-foreground'>
                    {t('sales.returnDialog.returnValue')}{' '}
                  </span>
                  <span className='font-medium'>{formatPkr(previewData.returnAmount)}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>
                    {t('sales.returnDialog.maxRefundableCash')}{' '}
                  </span>
                  <span className='font-medium text-emerald-600 dark:text-emerald-400'>
                    {formatPkr(previewData.refundable)}
                  </span>
                </div>
                <div>
                  <span className='text-muted-foreground'>
                    {t('sales.returnDialog.udharRelief')}{' '}
                  </span>
                  <span className='font-medium'>
                    {formatPkr(previewData.outstandingBefore - previewData.outstandingAfter)}
                  </span>
                </div>
                <div>
                  <span className='text-muted-foreground'>
                    {t('sales.returnDialog.outstandingAfter')}{' '}
                  </span>
                  <span className='font-medium'>{formatPkr(previewData.outstandingAfter)}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>
                    {t('sales.returnDialog.drawerCashAfter')}{' '}
                  </span>
                  <span className='font-medium'>{formatPkr(previewData.cashAfter)}</span>
                </div>
              </div>

              {previewData.willCauseOverdraft && (
                <OverdraftAlert
                  variant='compact'
                  checked={confirmOverdraft}
                  onCheckedChange={setConfirmOverdraft}
                  description={t('sales.returnDialog.overdraftNotice', {
                    shortfall: formatPkr(Math.abs(previewData.cashAfter))
                  })}
                  id='return-overdraft'
                  className='mt-2'
                />
              )}
            </div>
          )}

          <div className='space-y-1.5'>
            <Label htmlFor='returnReason'>
              {t('sales.returnDialog.reason')} <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              id='returnReason'
              value={reason}
              onChange={handleReasonChange}
              maxLength={INPUT_LIMITS.cancelReason}
              placeholder={t('sales.returnDialog.reasonPlaceholder')}
              rows={2}
              className={cn(reasonError && 'border-destructive')}
              aria-invalid={!!reasonError}
              required
            />
            <DialogFieldError id='returnReason-error' message={reasonError} />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='returnNotes'>{t('sales.returnDialog.notes')}</Label>
            <Input
              id='returnNotes'
              value={notes}
              onChange={handleNotesChange}
              maxLength={INPUT_LIMITS.notes}
              placeholder={t('sales.returnDialog.notesPlaceholder')}
            />
          </div>

          <DialogFooter>
            <DialogCancelButton
              onClick={() => onOpenChange(false)}
              disabled={recordReturn.isPending}
            />
            <DialogPrimaryButton
              mode='add'
              label={t('sales.returnDialog.submit')}
              disabled={recordReturn.isPending}
              loading={recordReturn.isPending}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
