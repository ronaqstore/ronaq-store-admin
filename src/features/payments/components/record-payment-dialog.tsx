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
import { formatPkr, fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import { todayIsoDate } from '@/lib/dates';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import { Icons } from '@/components/icons';
import type { CustomerDTO } from '@/lib/api/types';
import type {
  RecordPaymentDialogProps,
  RecordPaymentFormErrors,
  UnpaidSaleDTO
} from '@/types/payment';
import {
  PAYMENT_METHOD_OPTIONS,
  isStoredPaymentMethod,
  type StoredPaymentMethod
} from '@/lib/dukaan/payment-methods';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { createPaymentMutation } from '../api/mutations';
import { customerReceivableQueryOptions } from '../api/queries';
import { CustomerSelectCombobox } from './customer-select';
import { PaymentTargetSection } from './payment-target-section';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import { cn } from '@/lib/utils';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { PAYMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';

export function RecordPaymentDialog({
  open,
  onOpenChange,
  defaultCustomerId,
  onSuccess
}: RecordPaymentDialogProps) {
  const t = useT();
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? '');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDTO | null>(null);
  const [targetType, setTargetType] = useState<'opening' | 'sale'>('opening');
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayIsoDate);
  const [paymentMethod, setPaymentMethod] = useState<StoredPaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<RecordPaymentFormErrors>({});

  const { data: receivableData, isLoading: receivableLoading } = useQuery({
    ...customerReceivableQueryOptions(customerId),
    enabled: open && !!customerId
  });

  const unpaidSales = receivableData?.unpaidSales ?? [];
  const openingRemaining = receivableData?.openingRemaining ?? 0;
  const totalReceivable = receivableData?.receivable ?? 0;
  const hasDebt = !!receivableData && totalReceivable > 0;
  const noDebt = !!customerId && !!receivableData && !receivableLoading && !hasDebt;

  const activeSale: UnpaidSaleDTO | undefined = unpaidSales.find((s) => s.id === selectedSaleId);
  const maxRemainingPaisa =
    targetType === 'opening' ? openingRemaining : (activeSale?.remaining ?? 0);
  const maxRemainingRupees = fromPaisa(maxRemainingPaisa);
  const canSubmitPayment = hasDebt && maxRemainingPaisa > 0;

  useEffect(() => {
    if (!receivableData || receivableData.receivable <= 0) return;
    if (receivableData.openingRemaining > 0) return;
    const firstUnpaid = receivableData.unpaidSales[0];
    if (!firstUnpaid) return;
    if (targetType === 'sale' && selectedSaleId) return;
    setTargetType('sale');
    setSelectedSaleId((current) => current || firstUnpaid.id);
  }, [receivableData, targetType, selectedSaleId]);

  const resetForm = () => {
    setCustomerId('');
    setSelectedCustomer(null);
    setTargetType('opening');
    setSelectedSaleId('');
    setAmountStr('');
    setNotes('');
    setErrors({});
  };

  const recordMutation = useMutation({
    ...createPaymentMutation,
    onSuccess: () => {
      const message = t('payments.recordSuccess', {
        amount: amountStr,
        customer: selectedCustomer?.name || receivableData?.customerName || t('payments.customer')
      });
      onOpenChange(false);
      resetForm();
      invalidateDomains({ queryClient: qc, domains: PAYMENT_SYNC_DOMAINS });
      onSuccess?.();
      toastSuccessAfterClose(message);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('payments.recordFailed'));
    }
  });

  const handleSelectCustomer = (cust: CustomerDTO | null) => {
    setCustomerId(cust ? cust.id : '');
    setSelectedCustomer(cust);
    setTargetType('opening');
    setSelectedSaleId('');
    setAmountStr('');
    if (cust) setErrors((prev) => ({ ...prev, customerId: undefined }));
  };

  const handlePayFull = () => {
    if (maxRemainingRupees > 0) setAmountStr(String(maxRemainingRupees));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: RecordPaymentFormErrors = {};
    if (!customerId) nextErrors.customerId = t('payments.selectCustomer');

    if (!hasDebt || maxRemainingPaisa <= 0) {
      nextErrors.amount = t('payments.noDebtToPay');
      setErrors(nextErrors);
      return;
    }

    const num = parseFloat(amountStr);
    const paisaAmount = toPaisa(num);
    if (!num || num <= 0) {
      nextErrors.amount = t('payments.validAmount');
    } else if (paisaAmount > maxRemainingPaisa) {
      nextErrors.amount = t('payments.amountExceedsUdhar');
    }

    if (targetType === 'sale' && !selectedSaleId) {
      nextErrors.saleId = t('payments.selectSaleBill');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    recordMutation.mutate({
      clientRequestId: crypto.randomUUID(),
      customerId,
      amount: paisaAmount,
      paymentDate,
      method: paymentMethod,
      notes: notes.trim() || undefined,
      ...(targetType === 'sale' ? { salesIds: [selectedSaleId] } : {})
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleTargetTypeChange = (val: string) => {
    setTargetType(val as 'opening' | 'sale');
    setAmountStr('');
  };

  const handleSelectSale = (saleId: string) => {
    setSelectedSaleId(saleId);
    setAmountStr('');
    setErrors((e) => ({ ...e, saleId: undefined }));
  };

  const handleChooseSaleTarget = () => {
    if (unpaidSales.length === 0) return;
    setTargetType('sale');
    if (!selectedSaleId && unpaidSales[0]) setSelectedSaleId(unpaidSales[0].id);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountStr(
      sanitizeNumberInput(e.target.value, { min: 1, max: INPUT_LIMITS.amountRupeesMax })
    );
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(clampText(e.target.value, INPUT_LIMITS.notes));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('payments.recordPaymentTitle')}</DialogTitle>
          <DialogDescription>{t('payments.recordPaymentDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='space-y-1.5'>
            <Label className='text-sm font-normal text-foreground'>
              {t('payments.customer')} <span className='text-destructive'>*</span>
            </Label>
            <CustomerSelectCombobox
              value={customerId}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={handleSelectCustomer}
            />
            <DialogFieldError message={errors.customerId} />
          </div>

          {customerId ? (
            <div className='rounded-xl border border-border/70 bg-muted/40 p-3.5 text-sm'>
              {receivableLoading ? (
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
              ) : receivableData ? (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='font-normal text-muted-foreground'>
                      {t('payments.totalUdhar')}
                    </span>
                    <span className='font-semibold text-foreground'>
                      {formatPkr(totalReceivable)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground'>
                      {t('payments.openingUdharRemaining')}
                    </span>
                    <span className='font-medium text-foreground'>
                      {formatPkr(openingRemaining)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground'>{t('payments.unpaidSales')}</span>
                    <span className='font-medium text-foreground'>
                      {unpaidSales.length} {t('payments.billsCount')}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {noDebt ? (
            <div className='rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-3 text-sm text-foreground'>
              <p className='font-medium'>{t('payments.noDebtTitle')}</p>
              <p className='mt-1 text-muted-foreground'>{t('payments.noDebtToPay')}</p>
            </div>
          ) : null}

          {customerId && receivableData && hasDebt ? (
            <PaymentTargetSection
              targetType={targetType}
              openingRemaining={openingRemaining}
              unpaidSales={unpaidSales}
              selectedSaleId={selectedSaleId}
              saleIdError={errors.saleId}
              onTargetTypeChange={handleTargetTypeChange}
              onSelectSale={handleSelectSale}
              onChooseSaleTarget={handleChooseSaleTarget}
              labels={{
                paymentTarget: t('payments.paymentTarget'),
                openingBalance: t('payments.openingUdharTarget'),
                specificBill: t('payments.specificBill'),
                billsCount: t('payments.billsCount'),
                noUnpaidBills: t('payments.noUnpaidBills'),
                saleNo: (saleNo) => saleNo,
                date: t('payments.billDate'),
                total: t('payments.billTotal'),
                remaining: t('payments.remaining')
              }}
            />
          ) : null}

          {hasDebt ? (
            <>
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='payment-amount' className='text-sm font-normal text-foreground'>
                    {t('payments.amountReceivedPkr')} <span className='text-destructive'>*</span>
                  </Label>
                  {maxRemainingRupees > 0 ? (
                    <button
                      type='button'
                      onClick={handlePayFull}
                      className='text-xs font-medium text-primary hover:underline'
                    >
                      {t('payments.payFull', { amount: formatPkr(maxRemainingPaisa) })}
                    </button>
                  ) : null}
                </div>
                <div className='relative'>
                  <span className='absolute inset-s-3 top-1/2 -translate-y-1/2 text-sm font-normal text-foreground'>
                    {t('common.currency')}
                  </span>
                  <Input
                    id='payment-amount'
                    type='number'
                    min={1}
                    max={INPUT_LIMITS.amountRupeesMax}
                    step='any'
                    placeholder={t('common.amountPlaceholder')}
                    className={cn(
                      'ps-9 text-sm font-normal text-foreground',
                      errors.amount && 'border-destructive'
                    )}
                    value={amountStr}
                    onChange={handleAmountChange}
                    onKeyDown={(e) => blockInvalidNumberKeys(e)}
                    aria-invalid={!!errors.amount}
                    required
                  />
                </div>
                <DialogFieldError id='payment-amount-error' message={errors.amount} />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='payment-date' className='text-sm font-normal text-foreground'>
                  {t('payments.paymentDate')} <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='payment-date'
                  type='date'
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className='cursor-pointer text-sm font-normal text-foreground'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='payment-method' className='text-sm font-normal text-foreground'>
                  {t('payments.paymentMethod')}
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) => {
                    if (isStoredPaymentMethod(val)) setPaymentMethod(val);
                  }}
                  items={PAYMENT_METHOD_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label
                  }))}
                >
                  <SelectTrigger
                    id='payment-method'
                    className='h-9 w-full justify-between text-sm font-normal text-foreground'
                  >
                    <SelectValue
                      placeholder={t('payments.selectPaymentMethod')}
                      className='text-sm font-normal text-foreground'
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PAYMENT_METHOD_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className='text-sm font-normal text-foreground'
                        >
                          <div className='flex items-center gap-2'>
                            {opt.value === 'CASH' ? (
                              <Icons.cash className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400' />
                            ) : null}
                            {opt.value === 'JAZZCASH' ? (
                              <Icons.wallet className='h-3.5 w-3.5 text-amber-500' />
                            ) : null}
                            {opt.value === 'EASYPAISA' ? (
                              <Icons.wallet className='h-3.5 w-3.5 text-emerald-500' />
                            ) : null}
                            {opt.value === 'BANK' ? (
                              <Icons.creditCard className='h-3.5 w-3.5 text-blue-500' />
                            ) : null}
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='payment-notes' className='text-sm font-normal text-foreground'>
                  {t('payments.notesOptional')}
                </Label>
                <Textarea
                  id='payment-notes'
                  placeholder={t('payments.notesPlaceholder')}
                  value={notes}
                  onChange={handleNotesChange}
                  maxLength={INPUT_LIMITS.notes}
                  rows={2}
                  className='text-sm font-normal text-foreground'
                />
              </div>
            </>
          ) : null}

          <DialogFooter className='gap-2 pt-2 sm:gap-2.5'>
            <DialogCancelButton
              onClick={() => handleOpenChange(false)}
              disabled={recordMutation.isPending}
            />
            <DialogPrimaryButton
              mode='add'
              disabled={recordMutation.isPending || !canSubmitPayment}
              loading={recordMutation.isPending}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
