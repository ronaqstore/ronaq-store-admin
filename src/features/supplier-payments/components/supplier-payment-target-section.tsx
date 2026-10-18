'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { formatPkr } from '@/lib/dukaan/numbers';
import type { SupplierPaymentTargetSectionProps } from '@/types/supplier-payment';

export function SupplierPaymentTargetSection({
  targetType,
  openingRemaining,
  unpaidPurchases,
  selectedPurchaseId,
  purchaseIdError,
  onTargetTypeChange,
  onSelectPurchase,
  onChoosePurchaseTarget,
  labels
}: SupplierPaymentTargetSectionProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm font-normal text-foreground'>{labels.paymentTarget}</Label>
      <RadioGroup
        value={targetType}
        onValueChange={onTargetTypeChange}
        className='grid grid-cols-2 gap-2'
      >
        <div
          onClick={() => onTargetTypeChange('opening')}
          className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm transition-all ${
            targetType === 'opening'
              ? 'border-primary bg-primary/5 text-primary shadow-xs'
              : 'border-border/70 bg-card hover:bg-muted/30 text-foreground'
          }`}
        >
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='opening' id='target-opening' />
            <Label htmlFor='target-opening' className='cursor-pointer text-xs font-medium'>
              {labels.openingBalance}
            </Label>
          </div>
          <span className='text-xs font-semibold text-muted-foreground'>
            {formatPkr(openingRemaining)}
          </span>
        </div>

        <div
          onClick={onChoosePurchaseTarget}
          className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm transition-all ${
            targetType === 'purchase'
              ? 'border-primary bg-primary/5 text-primary shadow-xs'
              : 'border-border/70 bg-card hover:bg-muted/30 text-foreground'
          } ${unpaidPurchases.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className='flex items-center gap-2'>
            <RadioGroupItem
              value='purchase'
              id='target-purchase'
              disabled={unpaidPurchases.length === 0}
            />
            <Label htmlFor='target-purchase' className='cursor-pointer text-xs font-medium'>
              {labels.specificBill}
            </Label>
          </div>
          <span className='text-[10px] font-medium text-muted-foreground'>
            {unpaidPurchases.length} {labels.billsCount}
          </span>
        </div>
      </RadioGroup>

      {targetType === 'purchase' && (
        <div className='mt-2 max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-2'>
          {unpaidPurchases.length === 0 ? (
            <p className='px-1 py-2 text-xs text-muted-foreground'>{labels.noUnpaidBills}</p>
          ) : (
            unpaidPurchases.map((p) => (
              <button
                key={p.id}
                type='button'
                onClick={() => onSelectPurchase(p.id)}
                className={`flex w-full flex-col gap-0.5 rounded-md border px-2.5 py-2 text-start text-xs transition-colors ${
                  selectedPurchaseId === p.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-background hover:bg-muted/40'
                }`}
              >
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-medium text-foreground'>
                    {p.supplierInvoiceRef
                      ? labels.inv(p.supplierInvoiceRef)
                      : p.purchaseNo}
                  </span>
                  <span className='font-semibold text-foreground'>{formatPkr(p.remaining)}</span>
                </div>
                <div className='flex items-center justify-between text-muted-foreground'>
                  <span>
                    {labels.date}: {p.purchaseDate}
                  </span>
                  <span>
                    {labels.total}: {formatPkr(p.totalAmount)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
      <DialogFieldError message={purchaseIdError} />
    </div>
  );
}
