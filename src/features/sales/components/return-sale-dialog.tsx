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
import type { OverdraftPrompt } from '@/types';
import type { ReturnSaleDialogProps, ItemReturnState } from '@/types/sales';
import { createReturnMutation, previewReturnMutation } from '../api/mutations';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { SALE_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import { ReturnSaleItems } from './return-sale-items';
import { ReturnSaleSettlementPreview } from './return-sale-settlement-preview';

export function ReturnSaleDialog({ sale, open, onOpenChange, onSuccess }: ReturnSaleDialogProps) {
  const qc = useQueryClient();
  const t = useT();
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId());
  const [returnDate, setReturnDate] = useState(todayIsoDate);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [refundPkr, setRefundPkr] = useState<number>(0);
  const [confirmOverdraft, setConfirmOverdraft] = useState(false);
  const [overdraftPrompt, setOverdraftPrompt] = useState<OverdraftPrompt | null>(null);
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

  const clearPreview = () => {
    setPreviewData(null);
    setOverdraftPrompt(null);
    setConfirmOverdraft(false);
  };

  const preview = useMutation({
    ...previewReturnMutation,
    onSuccess: (data) => {
      setPreviewData(data);
      setOverdraftPrompt(null);
      setConfirmOverdraft(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('sales.returnDialog.previewFailed'));
    }
  });

  const recordReturn = useMutation({
    ...createReturnMutation,
    onSuccess: (res) => {
      if (res && 'confirmOverdraft' in res && res.confirmOverdraft) {
        setOverdraftPrompt({
          shortfall: res.shortfall,
          message: res.message
        });
        setConfirmOverdraft(false);
        toast.warning(
          t('sales.returnDialog.overdraftNotice', {
            shortfall: formatPkr(
              res.shortfall ?? (previewData?.cashAfter ? Math.abs(previewData.cashAfter) : 0)
            )
          })
        );
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
    clearPreview();
  };

  const handleItemQuantityChange = (itemId: string, maxQty: number, valStr: string) => {
    const cappedMax = Math.min(maxQty, INPUT_LIMITS.quantityMax);
    const sanitized = sanitizeNumberInput(valStr, { min: 1, max: cappedMax });
    const val = sanitized === '' ? 1 : Number(sanitized);
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: val }
    }));
    clearPreview();
  };

  const handleRefundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeNumberInput(e.target.value, {
      min: 0,
      max: INPUT_LIMITS.amountRupeesMax
    });
    setRefundPkr(sanitized === '' ? 0 : Number(sanitized));
    setRefundError('');
    clearPreview();
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
    clearPreview();
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
      setRefundError(t('sales.returnDialog.previewRequired'));
      return;
    }

    if (toPaisa(refundPkr) > previewData.refundable) {
      setRefundError(t('validation.refundExceedsMax'));
      return;
    }
    if ((previewData.willCauseOverdraft || !!overdraftPrompt) && !confirmOverdraft) {
      setRefundError(t('sales.returnDialog.confirmOverdraftRequired'));
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

  const shortfallAmount = formatPkr(
    overdraftPrompt?.shortfall ??
      (previewData?.cashAfter != null && previewData.cashAfter < 0
        ? Math.abs(previewData.cashAfter)
        : 0)
  );
  const showOverdraft = !!(previewData?.willCauseOverdraft || overdraftPrompt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t('sales.returnDialog.title', { saleNo: sale.saleNo })}</DialogTitle>
          <DialogDescription>{t('sales.returnDialog.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <ReturnSaleItems
            items={sale.items}
            itemStates={itemStates}
            itemsError={itemsError}
            onSelectChange={handleItemSelectChange}
            onQuantityChange={handleItemQuantityChange}
            onConditionChange={handleItemConditionChange}
          />

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

          <ReturnSaleSettlementPreview
            previewData={previewData}
            showOverdraft={showOverdraft}
            shortfallAmount={shortfallAmount}
            confirmOverdraft={confirmOverdraft}
            onConfirmOverdraftChange={setConfirmOverdraft}
          />

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
