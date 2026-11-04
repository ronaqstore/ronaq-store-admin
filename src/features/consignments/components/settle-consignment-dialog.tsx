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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { OverdraftAlert } from '@/components/common/overdraft-alert';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { createClientRequestId, formatPkr, fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { formatIsoDate } from '@/lib/dates';
import { useT } from '@/i18n/use-t';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CONSIGNMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { ConsignmentDTO } from '@/lib/api/types';
import type { OverdraftPrompt } from '@/types';
import type { SettleConsignmentDialogProps, SettleConsignmentResult } from '@/types/consignments';
import { settleConsignmentMutation } from '../api/mutations';
import { settleConsignmentFormSchema, mapZodIssuesToErrors } from '../schemas/consignment-schema';

export function SettleConsignmentDialog({
  consignment,
  open,
  onOpenChange,
  onSuccess
}: SettleConsignmentDialogProps) {
  const t = useT();
  const qc = useQueryClient();

  const initialAmount = consignment ? String(fromPaisa(consignment.agreedPayout)) : '';
  const [settledAmountRupees, setSettledAmountRupees] = useState(initialAmount);
  const [payoutMethod, setPayoutMethod] = useState<'CASH' | 'BANK' | 'JAZZCASH' | 'EASYPAISA'>(
    'CASH'
  );
  const [payoutReference, setPayoutReference] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmOverdraft, setConfirmOverdraft] = useState(false);
  const [overdraftPrompt, setOverdraftPrompt] = useState<OverdraftPrompt | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    ...settleConsignmentMutation,
    onSuccess: (res: SettleConsignmentResult) => {
      if (res && 'confirmOverdraft' in res && res.confirmOverdraft) {
        setOverdraftPrompt({
          shortfall: res.shortfall,
          message: res.message
        });
        setConfirmOverdraft(false);
        toast.warning(
          t('consignments.overdraftNotice', {
            shortfall: formatPkr(res.shortfall ?? 0)
          })
        );
        return;
      }

      onOpenChange(false);
      resetForm();
      invalidateDomains({ queryClient: qc, domains: CONSIGNMENT_SYNC_DOMAINS });
      toastSuccessAfterClose(
        t('consignments.settleSuccess', {
          consignmentNo: consignment?.consignmentNo ?? ''
        })
      );
      onSuccess?.(res as ConsignmentDTO);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('consignments.settleFailed'));
    }
  });

  if (!consignment) return null;

  const resetForm = () => {
    setSettledAmountRupees('');
    setPayoutMethod('CASH');
    setPayoutReference('');
    setNotes('');
    setConfirmOverdraft(false);
    setOverdraftPrompt(null);
    setErrors({});
  };

  const soldPrice = consignment.soldPrice ?? 0;
  const agreedPayout = consignment.agreedPayout;
  const storeProfit = soldPrice > 0 ? soldPrice - agreedPayout : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const amountNum = settledAmountRupees ? Number(settledAmountRupees) : 0;
    const schema = settleConsignmentFormSchema(t);
    const parsed = schema.safeParse({
      settledAmountRupees: amountNum,
      payoutMethod,
      payoutReference: payoutReference || undefined,
      notes: notes || undefined
    });

    if (!parsed.success) {
      setErrors(mapZodIssuesToErrors(parsed.error));
      return;
    }

    if (overdraftPrompt && !confirmOverdraft) {
      setErrors({ confirmOverdraft: t('consignments.confirmOverdraftRequired') });
      return;
    }

    setErrors({});

    mutation.mutate({
      id: consignment.id,
      input: {
        clientRequestId: createClientRequestId(),
        settledAmount: toPaisa(amountNum),
        payoutMethod,
        payoutReference: payoutReference.trim() || null,
        notes: notes.trim() || null,
        confirmOverdraft: confirmOverdraft || undefined
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg no-scrollbar'>
        <DialogHeader>
          <DialogTitle>{t('consignments.settleTitle')}</DialogTitle>
          <DialogDescription>{t('consignments.settleDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='rounded-md border p-3.5 bg-muted/40 text-sm space-y-2'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('consignments.consignmentNo')}:</span>
              <span className='font-semibold'>{consignment.consignmentNo}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('consignments.device')}:</span>
              <span className='font-medium'>{consignment.productName}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('consignments.consignor')}:</span>
              <span>
                {consignment.consignorName} ({consignment.consignorPhone})
              </span>
            </div>
            {consignment.soldAt && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>{t('consignments.soldAt')}:</span>
                <span>{formatIsoDate(String(consignment.soldAt))}</span>
              </div>
            )}
            <div className='pt-2 border-t flex justify-between'>
              <span className='text-muted-foreground'>{t('consignments.soldPrice')}:</span>
              <span className='font-semibold text-foreground'>{formatPkr(soldPrice)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('consignments.agreedPayout')}:</span>
              <span className='font-semibold text-primary'>{formatPkr(agreedPayout)}</span>
            </div>
            {soldPrice > 0 && (
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>{t('consignments.storeMargin')}:</span>
                <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                  +{formatPkr(storeProfit)}
                </span>
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='settled-amount'>
                {t('consignments.payoutAmount')} {t('consignments.pkrSuffix')}{' '}
                <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='settled-amount'
                type='text'
                inputMode='decimal'
                value={settledAmountRupees}
                onKeyDown={blockInvalidNumberKeys}
                onChange={(e) => setSettledAmountRupees(sanitizeNumberInput(e.target.value))}
                placeholder={String(fromPaisa(consignment.agreedPayout))}
              />
              <DialogFieldError message={errors.settledAmountRupees} />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='payout-method'>
                {t('consignments.payoutMethod')} <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={payoutMethod}
                onValueChange={(val) => {
                  if (val) setPayoutMethod(val);
                }}
              >
                <SelectTrigger id='payout-method' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='CASH'>{t('consignments.payoutMethodCash')}</SelectItem>
                  <SelectItem value='BANK'>{t('consignments.payoutMethodBank')}</SelectItem>
                  <SelectItem value='JAZZCASH'>{t('consignments.payoutMethodJazzcash')}</SelectItem>
                  <SelectItem value='EASYPAISA'>
                    {t('consignments.payoutMethodEasypaisa')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='sm:col-span-2 space-y-1.5'>
              <Label htmlFor='payout-ref'>{t('consignments.payoutReference')}</Label>
              <Input
                id='payout-ref'
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
                placeholder={t('consignments.payoutRefPlaceholder')}
              />
            </div>

            <div className='sm:col-span-2 space-y-1.5'>
              <Label htmlFor='settle-notes'>{t('common.notes')}</Label>
              <Textarea
                id='settle-notes'
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('consignments.notesPlaceholder')}
              />
            </div>
          </div>

          {overdraftPrompt && (
            <div className='space-y-2'>
              <OverdraftAlert
                checked={confirmOverdraft}
                onCheckedChange={setConfirmOverdraft}
                title={t('purchases.cancelDialog.overdraftWarning')}
                description={t('consignments.overdraftNotice', {
                  shortfall: formatPkr(overdraftPrompt.shortfall ?? 0)
                })}
                id='consignment-confirm-overdraft'
              />
              <DialogFieldError message={errors.confirmOverdraft} />
            </div>
          )}

          <DialogFooter className='gap-2 sm:gap-0'>
            <DialogCancelButton onClick={() => onOpenChange(false)} />
            <DialogPrimaryButton
              mode='save'
              type='submit'
              loading={mutation.isPending}
              label={t('consignments.confirmPayout')}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
