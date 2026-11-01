'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { createClientRequestId, toPaisa } from '@/lib/dukaan/numbers';
import { todayIsoDate } from '@/lib/dates';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import { sanitizePkMobileInput, sanitizePkCnicInput } from '@/lib/validation/pk';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { mapProductToPicker } from '@/lib/api/picker';
import { listCustomers } from '@/features/customers/api/service';
import { listProducts } from '@/features/products/api/service';
import { QuickVariantDialog } from '@/features/purchases/components/quick-variant-dialog';
import type { ConsignmentDTO, CustomerDTO } from '@/lib/api/types';
import type { ConsignmentIntakeDialogProps } from '@/types/consignments';
import type { ProductPickerItem } from '@/types/picker';
import { createConsignmentMutation } from '../api/mutations';
import { createConsignmentFormSchema } from '../schemas/consignment-schema';

export function ConsignmentIntakeDialog({
  open,
  onOpenChange,
  onSuccess
}: ConsignmentIntakeDialogProps) {
  const t = useT();

  const [customerId, setCustomerId] = useState<string>('');
  const [consignorName, setConsignorName] = useState('');
  const [consignorPhone, setConsignorPhone] = useState('');
  const [consignorCnic, setConsignorCnic] = useState('');

  const [productId, setProductId] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [quickVariantOpen, setQuickVariantOpen] = useState(false);

  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [condition, setCondition] = useState<'NEW' | 'LIKE_NEW' | 'USED' | 'REFURBISHED'>('USED');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [defectNotes, setDefectNotes] = useState('');

  const [agreedPayoutRupees, setAgreedPayoutRupees] = useState('');
  const [targetSellingPriceRupees, setTargetSellingPriceRupees] = useState('');
  const [intakeDate, setIntakeDate] = useState(todayIsoDate);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    ...createConsignmentMutation,
    onSuccess: (data: ConsignmentDTO) => {
      onOpenChange(false);
      resetForm();
      toastSuccessAfterClose(
        t('consignments.intakeSuccess', { consignmentNo: data.consignmentNo })
      );
      onSuccess?.(data);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('consignments.intakeFailed'));
    }
  });

  const resetForm = () => {
    setCustomerId('');
    setConsignorName('');
    setConsignorPhone('');
    setConsignorCnic('');
    setProductId('');
    setProductLabel('');
    setImei1('');
    setImei2('');
    setCondition('USED');
    setBatteryHealth('');
    setDefectNotes('');
    setAgreedPayoutRupees('');
    setTargetSellingPriceRupees('');
    setIntakeDate(todayIsoDate);
    setNotes('');
    setErrors({});
  };

  const handleCustomerSelect = (id: string, customer: CustomerDTO | null) => {
    setCustomerId(id);
    if (customer) {
      if (customer.name) setConsignorName(customer.name);
      if (customer.phone) setConsignorPhone(customer.phone);
    }
  };

  const handleProductCreated = (product: ProductPickerItem) => {
    setProductId(product.id);
    setProductLabel(product.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payoutNum = agreedPayoutRupees ? Number(agreedPayoutRupees) : '';
    const targetNum = targetSellingPriceRupees ? Number(targetSellingPriceRupees) : '';
    const batteryNum = batteryHealth !== '' ? Number(batteryHealth) : '';

    const schema = createConsignmentFormSchema(t);
    const parsed = schema.safeParse({
      customerId: customerId || undefined,
      consignorName,
      consignorPhone,
      consignorCnic: consignorCnic || undefined,
      productId,
      imei1,
      imei2: imei2 || undefined,
      condition,
      batteryHealth: batteryNum,
      defectNotes: defectNotes || undefined,
      agreedPayoutRupees: payoutNum,
      targetSellingPriceRupees: targetNum,
      intakeDate,
      notes: notes || undefined
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key && typeof key === 'string' && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    mutation.mutate({
      clientRequestId: createClientRequestId(),
      customerId: customerId || null,
      consignorName: consignorName.trim(),
      consignorPhone: consignorPhone.trim(),
      consignorCnic: consignorCnic.trim() || null,
      productId,
      imei1: imei1.trim(),
      imei2: imei2.trim() || null,
      condition,
      batteryHealth: typeof batteryNum === 'number' ? batteryNum : null,
      defectNotes: defectNotes.trim() || null,
      agreedPayout: toPaisa(Number(payoutNum)),
      targetSellingPrice: typeof targetNum === 'number' ? toPaisa(targetNum) : null,
      intakeDate,
      notes: notes.trim() || null
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('consignments.newConsignment')}</DialogTitle>
            <DialogDescription>{t('consignments.newConsignmentDesc')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-5 py-2'>
            {/* Section 1: Consignor Details */}
            <div className='rounded-md border p-3.5 space-y-3 bg-muted/20'>
              <div className='font-medium text-sm text-foreground'>
                {t('consignments.sectionConsignor')}
              </div>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='sm:col-span-2'>
                  <FormEntitySelect
                    name='customer_picker'
                    label={t('consignments.pickCustomerOptional')}
                    value={customerId}
                    onValueChange={handleCustomerSelect}
                    isInvalid={!!errors.customerId}
                    errors={errors.customerId ? [{ message: errors.customerId }] : []}
                    queryKey={['customers', 'picker']}
                    fetchPage={(filters) =>
                      listCustomers(filters).then((res) => ({
                        items: res.items,
                        total: res.total,
                        page: res.page,
                        limit: res.pageSize
                      }))
                    }
                    placeholder={t('consignments.pickCustomerPlaceholder')}
                    searchPlaceholder={t('dukaan.sale.searchCustomers')}
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='consignor-name'>
                    {t('consignments.consignorName')} <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='consignor-name'
                    value={consignorName}
                    onChange={(e) => setConsignorName(e.target.value)}
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
                    value={consignorPhone}
                    onChange={(e) => setConsignorPhone(sanitizePkMobileInput(e.target.value))}
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
                    onChange={(e) => setConsignorCnic(sanitizePkCnicInput(e.target.value))}
                    placeholder='17301-1234567-1'
                    maxLength={15}
                  />
                  <DialogFieldError message={errors.consignorCnic} />
                </div>
              </div>
            </div>

            {/* Section 2: Phone Device Details */}
            <div className='rounded-md border p-3.5 space-y-3 bg-muted/20'>
              <div className='font-medium text-sm text-foreground'>
                {t('consignments.sectionDevice')}
              </div>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='sm:col-span-2'>
                  <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
                    <div className='min-w-0 flex-1'>
                      <FormEntitySelect<ProductPickerItem>
                        name='product_id'
                        label={t('dukaan.purchase.product')}
                        required
                        value={productId}
                        onValueChange={(id, p) => {
                          setProductId(id);
                          if (p?.name) setProductLabel(p.name);
                        }}
                        isInvalid={!!errors.productId}
                        errors={errors.productId ? [{ message: errors.productId }] : []}
                        queryKey={['products', 'serialized-picker']}
                        fetchPage={(filters) =>
                          listProducts({ ...filters, trackingType: 'SERIALIZED' }).then((res) => ({
                            items: res.items.map(mapProductToPicker),
                            total: res.total,
                            page: res.page,
                            limit: res.pageSize
                          }))
                        }
                        placeholder={t('dukaan.purchase.pickProductFirst')}
                        searchPlaceholder={t('dukaan.purchase.searchProducts')}
                        selectedLabel={productLabel || undefined}
                      />
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='shrink-0'
                      onClick={() => setQuickVariantOpen(true)}
                    >
                      <Icons.add className='me-1.5 size-3.5' />
                      {t('dukaan.purchase.quickVariant')}
                    </Button>
                  </div>
                  <DialogFieldError message={errors.productId} />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='imei1'>
                    IMEI 1 <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='imei1'
                    value={imei1}
                    onChange={(e) => setImei1(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder='15 digits'
                    maxLength={15}
                  />
                  <DialogFieldError message={errors.imei1} />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='imei2'>IMEI 2 ({t('common.optional')})</Label>
                  <Input
                    id='imei2'
                    value={imei2}
                    onChange={(e) => setImei2(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder='15 digits'
                    maxLength={15}
                  />
                  <DialogFieldError message={errors.imei2} />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='condition'>{t('table.col.condition')}</Label>
                  <Select
                    value={condition}
                    onValueChange={(val) => {
                      if (val) setCondition(val);
                    }}
                  >
                    <SelectTrigger id='condition'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='USED'>{t('consignments.conditionUsed')}</SelectItem>
                      <SelectItem value='LIKE_NEW'>{t('consignments.conditionLikeNew')}</SelectItem>
                      <SelectItem value='REFURBISHED'>
                        {t('consignments.conditionRefurbished')}
                      </SelectItem>
                      <SelectItem value='NEW'>{t('consignments.conditionNew')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='battery-health'>{t('consignments.batteryHealth')} (%)</Label>
                  <Input
                    id='battery-health'
                    type='number'
                    min={0}
                    max={100}
                    value={batteryHealth}
                    onChange={(e) => setBatteryHealth(e.target.value)}
                    placeholder='e.g. 85'
                  />
                  <DialogFieldError message={errors.batteryHealth} />
                </div>

                <div className='sm:col-span-2 space-y-1.5'>
                  <Label htmlFor='defect-notes'>{t('consignments.defectNotes')}</Label>
                  <Input
                    id='defect-notes'
                    value={defectNotes}
                    onChange={(e) => setDefectNotes(e.target.value)}
                    placeholder={t('consignments.defectNotesPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Financial Terms & Agreement */}
            <div className='rounded-md border p-3.5 space-y-3 bg-muted/20'>
              <div className='font-medium text-sm text-foreground'>
                {t('consignments.sectionTerms')}
              </div>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label htmlFor='agreed-payout'>
                    {t('consignments.agreedPayout')} (PKR){' '}
                    <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='agreed-payout'
                    type='text'
                    inputMode='decimal'
                    value={agreedPayoutRupees}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={(e) => setAgreedPayoutRupees(sanitizeNumberInput(e.target.value))}
                    placeholder='e.g. 50,000'
                  />
                  <p className='text-xs text-muted-foreground'>
                    {t('consignments.agreedPayoutHint')}
                  </p>
                  <DialogFieldError message={errors.agreedPayoutRupees} />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='target-price'>{t('consignments.targetSellingPrice')} (PKR)</Label>
                  <Input
                    id='target-price'
                    type='text'
                    inputMode='decimal'
                    value={targetSellingPriceRupees}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={(e) =>
                      setTargetSellingPriceRupees(sanitizeNumberInput(e.target.value))
                    }
                    placeholder='e.g. 55,000'
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
                    onChange={(e) => setIntakeDate(e.target.value)}
                  />
                  <DialogFieldError message={errors.intakeDate} />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='notes'>{t('common.notes')}</Label>
                  <Input
                    id='notes'
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('consignments.notesPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <DialogCancelButton onClick={() => onOpenChange(false)} />
              <DialogPrimaryButton
                mode='save'
                type='submit'
                loading={mutation.isPending}
                label={t('consignments.saveConsignment')}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {quickVariantOpen && (
        <QuickVariantDialog
          open={quickVariantOpen}
          onOpenChange={setQuickVariantOpen}
          onCreated={handleProductCreated}
        />
      )}
    </>
  );
}
