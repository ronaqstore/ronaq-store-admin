'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { OverdraftAlert } from '@/components/common/overdraft-alert';
import { formatPkr, toPaisa } from '@/lib/dukaan/numbers';
import { todayIsoDate } from '@/lib/dates';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { createOwnerWithdrawalMutation } from '../api/mutations';
import type {
  CashOverdraftPrompt,
  CreateOwnerWithdrawalResult,
  OwnerWithdrawalDialogProps
} from '@/types/cash';

import { useT } from '@/i18n/use-t';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CASH_SYNC_DOMAINS } from '@/lib/query/sync-domains';

export function OwnerWithdrawalDialog({ open, onOpenChange }: OwnerWithdrawalDialogProps) {
  const t = useT();
  const qc = useQueryClient();
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(todayIsoDate);
  const [notes, setNotes] = useState('');
  const [overdraftPrompt, setOverdraftPrompt] = useState<CashOverdraftPrompt | null>(null);
  const [confirmOverdraft, setConfirmOverdraft] = useState(false);
  const [amountError, setAmountError] = useState('');

  const withdrawalMutation = useMutation({
    ...createOwnerWithdrawalMutation,
    onSuccess: async (data: CreateOwnerWithdrawalResult) => {
      if ('confirmOverdraft' in data && data.confirmOverdraft) {
        setOverdraftPrompt(data);
        toast.warning(
          t('dukaan.cash.shortfallWarningDesc', {
            shortfall: formatPkr(data.shortfall ?? 0)
          })
        );
        return;
      }

      setAmountStr('');
      setNotes('');
      setOverdraftPrompt(null);
      setConfirmOverdraft(false);
      onOpenChange(false);
      invalidateDomains({ queryClient: qc, domains: CASH_SYNC_DOMAINS });
      toastSuccessAfterClose(t('dukaan.cash.withdrawalSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('dukaan.cash.withdrawalFailed'));
    }
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountStr(
      sanitizeNumberInput(e.target.value, { min: 1, max: INPUT_LIMITS.amountRupeesMax })
    );
    setAmountError('');
    setOverdraftPrompt(null);
    setConfirmOverdraft(false);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(clampText(e.target.value, INPUT_LIMITS.notes));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError(t('common.invalidAmount'));
      return;
    }
    setAmountError('');

    withdrawalMutation.mutate({
      amount: toPaisa(parsedAmount),
      date: date || undefined,
      notes: notes.trim() || undefined,
      confirmOverdraft: confirmOverdraft || undefined
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAmountStr('');
      setNotes('');
      setOverdraftPrompt(null);
      setConfirmOverdraft(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='w-full sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('dukaan.cash.recordWithdrawalTitle')}</DialogTitle>
          <DialogDescription>{t('dukaan.cash.recordWithdrawalDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='space-y-1.5 w-full'>
            <Label htmlFor='withdrawal-amount' className='text-sm font-normal text-foreground'>
              {t('dukaan.cash.withdrawalAmount')} <span className='text-destructive'>*</span>
            </Label>
            <div className='relative w-full'>
              <span className='absolute inset-s-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                {t('common.currency')}
              </span>
              <Input
                id='withdrawal-amount'
                type='number'
                min={1}
                max={INPUT_LIMITS.amountRupeesMax}
                step='any'
                placeholder={t('common.amountPlaceholder')}
                value={amountStr}
                onChange={handleAmountChange}
                onKeyDown={(e) => blockInvalidNumberKeys(e)}
                disabled={withdrawalMutation.isPending}
                className={cn(
                  'h-10 ps-9 text-sm font-normal text-foreground w-full',
                  amountError && 'border-destructive'
                )}
                aria-invalid={!!amountError}
                autoFocus
                required
              />
            </div>
            <DialogFieldError id='withdrawal-amount-error' message={amountError} />
          </div>

          <div className='space-y-1.5 w-full'>
            <Label htmlFor='withdrawal-date' className='text-sm font-normal text-foreground'>
              {t('dukaan.cash.date')} <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='withdrawal-date'
              type='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={withdrawalMutation.isPending}
              className='h-10 text-sm font-normal text-foreground w-full cursor-pointer'
              required
            />
          </div>

          <div className='space-y-1.5 w-full'>
            <Label htmlFor='withdrawal-notes' className='text-sm font-normal text-foreground'>
              {t('dukaan.cash.notes')}{' '}
              <span className='text-xs text-muted-foreground'>({t('common.optional')})</span>
            </Label>
            <Textarea
              id='withdrawal-notes'
              rows={2}
              placeholder={t('dukaan.cash.withdrawalPlaceholder')}
              value={notes}
              onChange={handleNotesChange}
              maxLength={INPUT_LIMITS.notes}
              disabled={withdrawalMutation.isPending}
              className='resize-none text-sm font-normal text-foreground w-full'
            />
          </div>

          {overdraftPrompt && (
            <OverdraftAlert
              variant='banner'
              checked={confirmOverdraft}
              onCheckedChange={setConfirmOverdraft}
              title={t('dukaan.cash.shortfallWarningTitle')}
              description={t('dukaan.cash.shortfallWarningDesc', {
                shortfall: formatPkr(overdraftPrompt.shortfall ?? 0)
              })}
              confirmLabel={t('dukaan.cash.confirmOverdraftLabel')}
            />
          )}

          <DialogFooter className='gap-2 sm:gap-2.5 pt-2'>
            <DialogCancelButton
              onClick={() => onOpenChange(false)}
              disabled={withdrawalMutation.isPending}
            />
            <DialogPrimaryButton
              mode='save'
              loading={withdrawalMutation.isPending}
              disabled={withdrawalMutation.isPending}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
