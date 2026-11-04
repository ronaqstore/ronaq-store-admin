'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { useT } from '@/i18n/use-t';
import type { ConsignmentTermsSectionProps } from '@/types/consignments';

export function ConsignmentIntakeTermsSection({
  agreedPayoutRupees,
  targetSellingPriceRupees,
  intakeDate,
  notes,
  errors,
  onAgreedPayoutChange,
  onTargetSellingPriceChange,
  onIntakeDateChange,
  onNotesChange
}: ConsignmentTermsSectionProps) {
  const t = useT();

  return (
    <div className='rounded-md border p-3.5 space-y-3 bg-muted/20'>
      <div className='font-medium text-sm text-foreground'>{t('consignments.sectionTerms')}</div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='agreed-payout'>
            {t('consignments.agreedPayout')} {t('consignments.pkrSuffix')}{' '}
            <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='agreed-payout'
            type='text'
            inputMode='decimal'
            value={agreedPayoutRupees}
            onKeyDown={blockInvalidNumberKeys}
            onChange={(e) => onAgreedPayoutChange(sanitizeNumberInput(e.target.value))}
            placeholder={t('consignments.amountPlaceholder50k')}
          />
          <p className='text-xs text-muted-foreground'>{t('consignments.agreedPayoutHint')}</p>
          <DialogFieldError message={errors.agreedPayoutRupees} />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='target-price'>
            {t('consignments.targetSellingPrice')} {t('consignments.pkrSuffix')}
          </Label>
          <Input
            id='target-price'
            type='text'
            inputMode='decimal'
            value={targetSellingPriceRupees}
            onKeyDown={blockInvalidNumberKeys}
            onChange={(e) => onTargetSellingPriceChange(sanitizeNumberInput(e.target.value))}
            placeholder={t('consignments.amountPlaceholder55k')}
          />
          <p className='text-xs text-muted-foreground'>
            {t('consignments.targetSellingPriceHint')}
          </p>
          <DialogFieldError message={errors.targetSellingPriceRupees} />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='intake-date'>
            {t('consignments.intakeDate')} <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='intake-date'
            type='date'
            value={intakeDate}
            onChange={(e) => onIntakeDateChange(e.target.value)}
          />
          <DialogFieldError message={errors.intakeDate} />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='notes'>{t('common.notes')}</Label>
          <Input
            id='notes'
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={t('consignments.notesPlaceholder')}
          />
        </div>
      </div>
    </div>
  );
}
