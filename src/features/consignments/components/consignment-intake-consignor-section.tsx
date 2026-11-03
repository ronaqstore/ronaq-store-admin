'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { useT } from '@/i18n/use-t';
import { sanitizePkMobileInput, sanitizePkCnicInput } from '@/lib/validation/pk';
import { listCustomers } from '@/features/customers/api/service';
import type { CustomerDTO } from '@/lib/api/types';
import type { ConsignmentConsignorSectionProps } from '@/types/consignments';

export function ConsignmentIntakeConsignorSection({
  customerId,
  consignorName,
  consignorPhone,
  consignorCnic,
  errors,
  onCustomerSelect,
  onConsignorNameChange,
  onConsignorPhoneChange,
  onConsignorCnicChange
}: ConsignmentConsignorSectionProps) {
  const t = useT();

  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConsignorNameChange(e.target.value);
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConsignorPhoneChange(sanitizePkMobileInput(e.target.value));
  };

  const handleCnicInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConsignorCnicChange(sanitizePkCnicInput(e.target.value));
  };

  return (
    <div className='rounded-md border p-3.5 space-y-3 bg-muted/20'>
      <div className='font-medium text-sm text-foreground'>
        {t('consignments.sectionConsignor')}
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='sm:col-span-2'>
          <FormEntitySelect<CustomerDTO>
            name='customer_picker'
            label={t('consignments.pickCustomerOptional')}
            value={customerId}
            onValueChange={onCustomerSelect}
            isInvalid={!!errors.customerId}
            errors={errors.customerId ? [{ message: errors.customerId }] : []}
            queryKey={['customers', 'picker']}
            fetchPage={(filters) =>
              listCustomers({ ...filters, limit: 20, isActive: true }).then((res) => ({
                items: res.items,
                total: res.total,
                page: res.page,
                limit: res.pageSize
              }))
            }
            placeholder={t('consignments.pickCustomerPlaceholder')}
            searchPlaceholder={t('dukaan.customer.search')}
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='consignor-name'>
            {t('consignments.consignorName')} <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='consignor-name'
            value={consignorName}
            onChange={handleNameInput}
            placeholder={t('consignments.consignorNamePlaceholder')}
          />
          <DialogFieldError message={errors.consignorName} />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='consignor-phone'>
            {t('consignments.consignorPhone')} <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='consignor-phone'
            type='tel'
            value={consignorPhone}
            onChange={handlePhoneInput}
            placeholder='03001234567'
            maxLength={11}
          />
          <DialogFieldError message={errors.consignorPhone} />
        </div>

        <div className='sm:col-span-2 space-y-1.5'>
          <Label htmlFor='consignor-cnic'>{t('consignments.consignorCnic')}</Label>
          <Input
            id='consignor-cnic'
            value={consignorCnic}
            onChange={handleCnicInput}
            placeholder='17301-1234567-1'
            maxLength={15}
          />
          <DialogFieldError message={errors.consignorCnic} />
        </div>
      </div>
    </div>
  );
}
