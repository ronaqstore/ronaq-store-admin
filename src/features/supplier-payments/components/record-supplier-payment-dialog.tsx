'use client';

import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientRequestId, formatPkr, toPaisa, fromPaisa } from '@/lib/dukaan/numbers';
import { todayIsoDate } from '@/lib/dates';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import type {
  SupplierDTO,
  UnpaidPurchaseDTO,
  RecordSupplierPaymentDialogProps,
  SupplierPaymentFormErrors
} from '@/types/supplier-payment';
import type { OverdraftPrompt } from '@/types';
import { createSupplierPaymentMutation } from '../api/mutations';
import { supplierPayableQueryOptions } from '../api/queries';
import { SupplierSelectCombobox } from './supplier-select';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { OverdraftAlert } from '@/components/common/overdraft-alert';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { SupplierPaymentTargetSection } from './supplier-payment-target-section';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import { cn } from '@/lib/utils';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { SUPPLIER_PAYMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';

export function RecordSupplierPaymentDialog({
  open,
  onOpenChange,
  defaultSupplierId,
  onSuccess
}: RecordSupplierPaymentDialogProps) {
  const t = useT();
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = useState(defaultSupplierId ?? '');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDTO | null>(null);
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId());
  const [targetType, setTargetType] = useState<'opening' | 'purchase'>('opening');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [amountStr, setAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayIsoDate);
  const [notes, setNotes] = useState('');
  const [confirmOverdraft, setConfirmOverdraft] = useState(false);
  const [overdraftPrompt, setOverdraftPrompt] = useState<OverdraftPrompt | null>(null);
  const [errors, setErrors] = useState<SupplierPaymentFormErrors>({});

  const { data: payableData, isLoading: payableLoading } = useQuery({
    ...supplierPayableQueryOptions(supplierId),
    enabled: open && !!supplierId
  });

  const unpaidPurchases = payableData?.unpaidPurchases ?? [];
  const openingRemaining = payableData?.openingRemaining ?? 0;
  const totalPayable = payableData?.payable ?? 0;
  const hasDebt = !!payableData && totalPayable > 0;
  const noDebt = !!supplierId && !!payableData && !payableLoading && !hasDebt;

  const activePurchase: UnpaidPurchaseDTO | undefined = unpaidPurchases.find(
    (p) => p.id === selectedPurchaseId
  );

  const maxRemainingPaisa =
    targetType === 'opening' ? openingRemaining : (activePurchase?.remaining ?? 0);

  const maxRemainingRupees = fromPaisa(maxRemainingPaisa);
  const canSubmitPayment = hasDebt && maxRemainingPaisa > 0;

  useEffect(() => {
    if (!payableData || payableData.payable <= 0) return;
    if (payableData.openingRemaining > 0) return;
    const firstUnpaid = payableData.unpaidPurchases[0];
    if (!firstUnpaid) return;
    if (targetType === 'purchase' && selectedPurchaseId) return;

    setTargetType('purchase');
    setSelectedPurchaseId((current) => current || firstUnpaid.id);
  }, [payableData, targetType, selectedPurchaseId]);

  const resetForm = () => {
    setSupplierId('');
    setSelectedSupplier(null);
    setClientRequestId(createClientRequestId());
    setTargetType('opening');
    setSelectedPurchaseId('');
    setAmountStr('');
    setNotes('');
    setConfirmOverdraft(false);
    setOverdraftPrompt(null);
    setErrors({});
  };

  const recordMutation = useMutation({
    ...createSupplierPaymentMutation,
    onSuccess: (res) => {
      if (res && res.confirmOverdraft) {
        setOverdraftPrompt({
          shortfall: res.shortfall,
          message: res.message
        });
        setConfirmOverdraft(false);
        toast.warning(
          t('supplierPayments.shortfallWarningDesc', {
            shortfall: formatPkr(res.shortfall ?? 0)
          })
        );
        return;
      }

      const message = t('supplierPayments.recordSuccess', {
        amount: amountStr,
        supplier:
          selectedSupplier?.name || payableData?.supplierName || t('supplierPayments.supplier')
      });
      onOpenChange(false);
      resetForm();
      invalidateDomains({ queryClient: qc, domains: SUPPLIER_PAYMENT_SYNC_DOMAINS });
      onSuccess?.();
      toastSuccessAfterClose(message);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('supplierPayments.recordFailed'));
    }
  });

  const handleSupplierSelect = (supplier: SupplierDTO | null) => {
    setSelectedSupplier(supplier);
    setSupplierId(supplier?.id ?? '');
    setTargetType('opening');
    setSelectedPurchaseId('');
    setAmountStr('');
    setOverdraftPrompt(null);
    setConfirmOverdraft(false);
  };

  const handlePayFull = () => {
    if (maxRemainingRupees > 0) {
      setAmountStr(String(maxRemainingRupees));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: SupplierPaymentFormErrors = {};
    if (!supplierId) {
      nextErrors.supplierId = t('supplierPayments.supplierRequired');
    }

    if (!hasDebt || maxRemainingPaisa <= 0) {
      nextErrors.amount = t('supplierPayments.noDebtToPay');
      setErrors(nextErrors);
      return;
    }

    const num = parseFloat(amountStr);
    const paisaAmount = toPaisa(num);
    if (!num || num <= 0) {
      nextErrors.amount = t('common.invalidAmount');
    } else if (paisaAmount > maxRemainingPaisa) {
      nextErrors.amount = t('supplierPayments.amountExceedsDebt');
    }

    if (targetType === 'purchase' && !selectedPurchaseId) {
      nextErrors.purchaseId = t('supplierPayments.selectPurchaseBill');
    }

    if (overdraftPrompt && !confirmOverdraft) {
      nextErrors.confirmOverdraft = t('supplierPayments.confirmOverdraftBeforeSaving');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    recordMutation.mutate({
      clientRequestId,
      supplierId,
      purchaseId: targetType === 'purchase' ? selectedPurchaseId : null,
      amount: paisaAmount,
      paymentDate,
      confirmOverdraft: confirmOverdraft ? true : undefined,
      notes: notes.trim() ? notes.trim() : undefined
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };
  const handleTargetTypeChange = (val: string) => {
    setTargetType(val as 'opening' | 'purchase');
    setAmountStr('');
  };
  const handleSelectPurchase = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    setAmountStr('');
    setErrors((e) => ({ ...e, purchaseId: undefined }));
  };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountStr(
      sanitizeNumberInput(e.target.value, { min: 1, max: INPUT_LIMITS.amountRupeesMax })
    );
    setErrors((p) => ({ ...p, amount: undefined }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(clampText(e.target.value, INPUT_LIMITS.notes));
  };
  const handleConfirmOverdraftChange = (checked: boolean) => {
    setConfirmOverdraft(checked);
    if (checked) setErrors((p) => ({ ...p, confirmOverdraft: undefined }));
  };

  const handleChoosePurchaseTarget = () => {
    if (unpaidPurchases.length > 0) {
      setTargetType('purchase');
      if (!selectedPurchaseId && unpaidPurchases[0]) {
        setSelectedPurchaseId(unpaidPurchases[0].id);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('supplierPayments.addPaymentTitle')}</DialogTitle>
          <DialogDescription>{t('supplierPayments.addPaymentDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='space-y-1.5'>
            <Label className='text-sm font-normal text-foreground'>
              {t('supplierPayments.supplier')} <span className='text-destructive'>*</span>
            </Label>
            <SupplierSelectCombobox
              value={supplierId}
              selectedSupplier={selectedSupplier}
              onSelectSupplier={handleSupplierSelect}
              placeholder={t('supplierPayments.searchSupplierPlaceholder')}
              disabled={recordMutation.isPending}
            />
            <DialogFieldError message={errors.supplierId} />
          </div>

          {supplierId && (
            <div className='rounded-xl border border-border/70 bg-muted/40 p-3.5 text-sm'>
              {payableLoading ? (
                <div className='space-y-2' aria-busy='true'>
                  <div className='flex items-center justify-between gap-3'>
                    <Skeleton className='h-4 w-28' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <div className='flex items-center justify-between gap-3'>
                    <Skeleton className='h-3 w-36' />
                    <Skeleton className='h-3 w-16' />
                  </div>
                  <div className='flex items-center justify-between gap-3'>
                    <Skeleton className='h-3 w-24' />
                    <Skeleton className='h-3 w-14' />
                  </div>
                </div>
              ) : payableData ? (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='font-normal text-muted-foreground'>
                      {t('supplierPayments.totalPayable')}
                    </span>
                    <span className='font-semibold text-foreground'>{formatPkr(totalPayable)}</span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground'>
                      {t('supplierPayments.openingBalanceRemaining')}
                    </span>
                    <span className='font-medium text-foreground'>
                      {formatPkr(openingRemaining)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground'>
                      {t('supplierPayments.unpaidPurchases')}
                    </span>
                    <span className='font-medium text-foreground'>
                      {unpaidPurchases.length} {t('supplierPayments.billsCount')}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {noDebt ? (
            <div className='rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-3 text-sm text-foreground'>
              <p className='font-medium'>{t('supplierPayments.noDebtTitle')}</p>
              <p className='mt-1 text-muted-foreground'>{t('supplierPayments.noDebtToPay')}</p>
            </div>
          ) : null}

          {supplierId && payableData && hasDebt ? (
            <SupplierPaymentTargetSection
              targetType={targetType}
              openingRemaining={openingRemaining}
              unpaidPurchases={unpaidPurchases}
              selectedPurchaseId={selectedPurchaseId}
              purchaseIdError={errors.purchaseId}
              onTargetTypeChange={handleTargetTypeChange}
              onSelectPurchase={handleSelectPurchase}
              onChoosePurchaseTarget={handleChoosePurchaseTarget}
              labels={{
                paymentTarget: t('supplierPayments.paymentTarget'),
                openingBalance: t('supplierPayments.openingBalance'),
                specificBill: t('supplierPayments.specificBill'),
                billsCount: t('supplierPayments.billsCount'),
                selectBillInvoice: t('supplierPayments.selectBillInvoice'),
                noUnpaidBills: t('supplierPayments.noUnpaidBills'),
                inv: (inv) => t('supplierPayments.inv', { inv }),
                date: t('supplierPayments.date'),
                total: t('supplierPayments.total'),
                remaining: t('supplierPayments.remaining')
              }}
            />
          ) : null}

          {hasDebt ? (
            <>
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='supplier-payment-amount'
                    className='text-sm font-normal text-foreground'
                  >
                    {t('supplierPayments.amountPkr')} <span className='text-destructive'>*</span>
                  </Label>
                  {maxRemainingRupees > 0 && (
                    <button
                      type='button'
                      onClick={handlePayFull}
                      className='text-xs font-medium text-primary hover:underline'
                    >
                      {t('supplierPayments.payFull', { amount: formatPkr(maxRemainingPaisa) })}
                    </button>
                  )}
                </div>
                <div className='relative'>
                  <span className='absolute inset-s-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                    {t('common.currency')}
                  </span>
                  <Input
                    id='supplier-payment-amount'
                    type='number'
                    min={1}
                    max={INPUT_LIMITS.amountRupeesMax}
                    step='any'
                    placeholder={t('common.amountPlaceholder')}
                    value={amountStr}
                    onChange={handleAmountChange}
                    onKeyDown={(e) => blockInvalidNumberKeys(e)}
                    disabled={recordMutation.isPending || !canSubmitPayment}
                    className={cn(
                      'h-10 ps-9 text-sm font-normal text-foreground',
                      errors.amount && 'border-destructive'
                    )}
                    aria-invalid={!!errors.amount}
                    required
                  />
                </div>
                <DialogFieldError id='supplier-payment-amount-error' message={errors.amount} />
              </div>

              <div className='space-y-1.5'>
                <Label
                  htmlFor='supplier-payment-date'
                  className='text-sm font-normal text-foreground'
                >
                  {t('supplierPayments.paymentDateLabel')}{' '}
                  <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='supplier-payment-date'
                  type='date'
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={recordMutation.isPending}
                  className='h-10 text-sm font-normal text-foreground cursor-pointer'
                  required
                />
              </div>

              <div className='space-y-1.5'>
                <Label
                  htmlFor='supplier-payment-notes'
                  className='text-sm font-normal text-foreground'
                >
                  {t('supplierPayments.notes')}{' '}
                  <span className='text-xs text-muted-foreground'>({t('common.optional')})</span>
                </Label>
                <Textarea
                  id='supplier-payment-notes'
                  rows={2}
                  placeholder={t('supplierPayments.notesPlaceholder')}
                  value={notes}
                  onChange={handleNotesChange}
                  maxLength={INPUT_LIMITS.notes}
                  disabled={recordMutation.isPending}
                  className='resize-none text-sm font-normal text-foreground'
                />
              </div>

              {overdraftPrompt && (
                <OverdraftAlert
                  variant='banner'
                  checked={confirmOverdraft}
                  onCheckedChange={handleConfirmOverdraftChange}
                  title={t('supplierPayments.shortfallWarningTitle')}
                  description={t('supplierPayments.shortfallWarningDesc', {
                    shortfall: formatPkr(overdraftPrompt.shortfall ?? 0)
                  })}
                  confirmLabel={t('supplierPayments.confirmOverdraft')}
                />
              )}
              {errors.confirmOverdraft && <DialogFieldError message={errors.confirmOverdraft} />}
            </>
          ) : null}

          <DialogFooter className='gap-2 sm:gap-2.5 pt-2'>
            <DialogCancelButton
              onClick={() => onOpenChange(false)}
              disabled={recordMutation.isPending}
            />
            {hasDebt ? (
              <DialogPrimaryButton
                mode='add'
                loading={recordMutation.isPending}
                disabled={recordMutation.isPending || !canSubmitPayment}
              />
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
