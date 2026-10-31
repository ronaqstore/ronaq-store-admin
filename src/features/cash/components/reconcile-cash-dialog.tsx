'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import { cn } from '@/lib/utils';
import { createClientRequestId, formatPkr, toPaisa } from '@/lib/dukaan/numbers';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { createCashReconciliationMutation } from '../api/mutations';
import { shopKpisQueryOptions } from '@/features/dukaan/api/queries';
import type { ReconcileCashDialogProps } from '@/types/cash';
import { useT } from '@/i18n/use-t';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CASH_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import { Icons } from '@/components/icons';

export function ReconcileCashDialog({ open, onOpenChange }: ReconcileCashDialogProps) {
  const t = useT();
  const qc = useQueryClient();
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId());
  const [countedCashStr, setCountedCashStr] = useState('');
  const [reason, setReason] = useState('');
  const [countedCashError, setCountedCashError] = useState('');
  const [reasonError, setReasonError] = useState('');

  const { data: kpis, isLoading: isLoadingKpis } = useQuery(shopKpisQueryOptions());
  const systemCashPaisa = kpis?.balance?.cashInHand ?? 0;

  const resetForm = () => {
    setCountedCashStr('');
    setReason('');
    setCountedCashError('');
    setReasonError('');
    setClientRequestId(createClientRequestId());
  };

  const reconcileMutation = useMutation({
    ...createCashReconciliationMutation,
    onSuccess: () => {
      resetForm();
      onOpenChange(false);
      invalidateDomains({ queryClient: qc, domains: CASH_SYNC_DOMAINS });
      toastSuccessAfterClose(t('dukaan.cash.reconcileSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('dukaan.cash.reconcileFailed'));
    }
  });

  const parsedCountedRupees = countedCashStr === '' ? null : parseFloat(countedCashStr);
  const isValidCount =
    parsedCountedRupees !== null && !isNaN(parsedCountedRupees) && parsedCountedRupees >= 0;
  const countedCashPaisa = isValidCount ? toPaisa(parsedCountedRupees) : null;
  const differencePaisa = countedCashPaisa !== null ? countedCashPaisa - systemCashPaisa : null;
  const hasDifference = differencePaisa !== null && differencePaisa !== 0;

  const handleCountedCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCountedCashStr(
      sanitizeNumberInput(e.target.value, { min: 0, max: INPUT_LIMITS.amountRupeesMax })
    );
    setCountedCashError('');
    if (reasonError) setReasonError('');
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(clampText(e.target.value, INPUT_LIMITS.notes));
    if (reasonError) setReasonError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidCount || countedCashPaisa === null) {
      setCountedCashError(t('common.invalidCashCount'));
      return;
    }
    setCountedCashError('');

    if (hasDifference && !reason.trim()) {
      setReasonError(t('dukaan.cash.reconcileReasonRequired'));
      return;
    }
    setReasonError('');

    reconcileMutation.mutate({
      clientRequestId,
      countedCash: countedCashPaisa,
      reason: reason.trim() || undefined
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetForm();
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='w-full sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('dukaan.cash.reconcileTitle')}</DialogTitle>
          <DialogDescription>{t('dukaan.cash.reconcileDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='flex items-center justify-between rounded-lg border bg-muted/40 p-3'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Icons.wallet className='h-4 w-4' />
              <span>{t('dukaan.cash.expectedCash')}</span>
            </div>
            <span className='font-semibold text-foreground tabular-nums'>
              {isLoadingKpis ? '...' : formatPkr(systemCashPaisa)}
            </span>
          </div>

          <div className='space-y-1.5 w-full'>
            <Label htmlFor='reconcile-counted-cash' className='text-sm font-normal text-foreground'>
              {t('dukaan.cash.countedCash')} <span className='text-destructive'>*</span>
            </Label>
            <div className='relative w-full'>
              <span className='absolute inset-s-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                {t('common.currency')}
              </span>
              <Input
                id='reconcile-counted-cash'
                type='number'
                min={0}
                max={INPUT_LIMITS.amountRupeesMax}
                step='any'
                placeholder={t('dukaan.cash.countedCashPlaceholder')}
                value={countedCashStr}
                onChange={handleCountedCashChange}
                onKeyDown={(e) => blockInvalidNumberKeys(e)}
                disabled={reconcileMutation.isPending}
                className={cn(
                  'h-10 ps-9 text-sm font-normal text-foreground w-full',
                  countedCashError && 'border-destructive'
                )}
                aria-invalid={!!countedCashError}
                autoFocus
                required
              />
            </div>
            <DialogFieldError id='reconcile-counted-cash-error' message={countedCashError} />
          </div>

          {differencePaisa !== null && (
            <div
              className={cn(
                'rounded-lg border p-3 flex items-start gap-3 text-sm transition-colors',
                differencePaisa === 0 &&
                  'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                differencePaisa < 0 &&
                  'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400',
                differencePaisa > 0 &&
                  'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'
              )}
            >
              {differencePaisa === 0 ? (
                <Icons.circleCheck className='h-5 w-5 shrink-0 mt-0.5' />
              ) : differencePaisa < 0 ? (
                <Icons.trendingDown className='h-5 w-5 shrink-0 mt-0.5' />
              ) : (
                <Icons.trendingUp className='h-5 w-5 shrink-0 mt-0.5' />
              )}
              <div className='flex-1'>
                <div className='flex items-center justify-between font-medium'>
                  <span>
                    {differencePaisa === 0
                      ? t('dukaan.cash.balanced')
                      : differencePaisa < 0
                        ? t('dukaan.cash.shortage')
                        : t('dukaan.cash.surplus')}
                  </span>
                  <span className='font-semibold tabular-nums'>
                    {differencePaisa > 0 ? '+' : ''}
                    {formatPkr(differencePaisa)}
                  </span>
                </div>
                {differencePaisa !== 0 && (
                  <p className='text-xs mt-1 text-muted-foreground'>
                    {t('dukaan.cash.reconcileReasonRequired')}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className='space-y-1.5 w-full'>
            <Label htmlFor='reconcile-reason' className='text-sm font-normal text-foreground'>
              {t('dukaan.cash.reason')}{' '}
              {hasDifference ? (
                <span className='text-destructive'>*</span>
              ) : (
                <span className='text-xs text-muted-foreground'>({t('common.optional')})</span>
              )}
            </Label>
            <Textarea
              id='reconcile-reason'
              rows={2}
              placeholder={t('dukaan.cash.reconcileReasonPlaceholder')}
              value={reason}
              onChange={handleReasonChange}
              maxLength={INPUT_LIMITS.notes}
              disabled={reconcileMutation.isPending}
              className={cn(
                'resize-none text-sm font-normal text-foreground w-full',
                reasonError && 'border-destructive'
              )}
              aria-invalid={!!reasonError}
            />
            <DialogFieldError id='reconcile-reason-error' message={reasonError} />
          </div>

          <DialogFooter className='gap-2 sm:gap-2.5 pt-2'>
            <DialogCancelButton
              onClick={() => handleOpenChange(false)}
              disabled={reconcileMutation.isPending}
            />
            <DialogPrimaryButton
              mode='save'
              loading={reconcileMutation.isPending}
              disabled={reconcileMutation.isPending}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
