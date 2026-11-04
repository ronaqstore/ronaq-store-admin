'use client';

import { useEffect, useState } from 'react';
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
import { createClientRequestId, fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import { todayIsoDate } from '@/lib/dates';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { mapProductToPicker } from '@/lib/api/picker';
import { isAppleBrandName } from '@/lib/device-family';
import { listProducts } from '@/features/products/api/service';
import { QuickVariantDialog } from '@/components/variants/quick-variant-dialog';
import { CustomerDialog } from '@/components/dialogs/customer-dialog';
import { ConsignmentIntakeConsignorSection } from './consignment-intake-consignor-section';
import { ImeiCameraScanButton } from '@/components/barcode';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CONSIGNMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { ConsignmentDTO, CustomerDTO, ProductDTO } from '@/lib/api/types';
import type { ConsignmentIntakeDialogProps } from '@/types/consignments';
import type { ProductPickerItem } from '@/types/picker';
import { createConsignmentMutation } from '../api/mutations';
import { createConsignmentFormSchema } from '../schemas/consignment-schema';

export function ConsignmentIntakeDialog({
  open,
  onOpenChange,
  onSuccess,
  initialProduct
}: ConsignmentIntakeDialogProps) {
  const t = useT();
  const qc = useQueryClient();

  const [customerId, setCustomerId] = useState<string>('');
  const [consignorName, setConsignorName] = useState('');
  const [consignorPhone, setConsignorPhone] = useState('');
  const [consignorCnic, setConsignorCnic] = useState('');
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [extraCustomers, setExtraCustomers] = useState<CustomerDTO[]>([]);

  const [productId, setProductId] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [brandName, setBrandName] = useState<string | null>(null);
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [condition, setCondition] = useState<'NEW' | 'USED'>('USED');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [defectNotes, setDefectNotes] = useState('');

  const [agreedPayoutRupees, setAgreedPayoutRupees] = useState('');
  const [targetSellingPriceRupees, setTargetSellingPriceRupees] = useState('');
  const [intakeDate, setIntakeDate] = useState<string>(todayIsoDate());
  const [notes, setNotes] = useState('');

  const [quickVariantOpen, setQuickVariantOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isApple = isAppleBrandName(brandName);
  const isUsed = condition === 'USED';

  const mutation = useMutation({
    ...createConsignmentMutation,
    onSuccess: (created: ConsignmentDTO) => {
      onOpenChange(false);
      resetForm();
      invalidateDomains({ queryClient: qc, domains: CONSIGNMENT_SYNC_DOMAINS });
      toastSuccessAfterClose(
        t('consignments.intakeSuccess', { consignmentNo: created.consignmentNo })
      );
      onSuccess?.(created);
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
    setBrandName(null);
    setImei1('');
    setImei2('');
    setCondition('USED');
    setBatteryHealth('');
    setDefectNotes('');
    setAgreedPayoutRupees('');
    setTargetSellingPriceRupees('');
    setIntakeDate(todayIsoDate());
    setNotes('');
    setErrors({});
  };

  useEffect(() => {
    if (open) {
      if (initialProduct) {
        setProductId(initialProduct.id);
        setProductLabel(initialProduct.name);
        setBrandName(initialProduct.brandName ?? null);
        if (initialProduct.defaultSellingPrice) {
          setTargetSellingPriceRupees(String(fromPaisa(initialProduct.defaultSellingPrice)));
        }
      }
    } else {
      resetForm();
    }
  }, [open, initialProduct]);

  const handleCustomerCreated = (created: CustomerDTO) => {
    setExtraCustomers((prev) => [created, ...prev]);
    handleCustomerSelect(created.id, created);
  };

  const handleCustomerSelect = (id: string, customer?: CustomerDTO | null) => {
    setCustomerId(id);
    if (customer) {
      setConsignorName(customer.name ?? '');
      setConsignorPhone(customer.phone ?? '');
    }
  };

  const handleProductCreated = (item: ProductPickerItem) => {
    setProductId(item.id);
    setProductLabel(item.name);
    setBrandName(item.brand_name ?? null);
    if (!isAppleBrandName(item.brand_name)) {
      setBatteryHealth('');
    }
  };

  const handleProductChange = (id: string, p?: ProductPickerItem | null) => {
    setProductId(id);
    if (p?.name) setProductLabel(p.name);
    setBrandName(p?.brand_name ?? null);
    if (!isAppleBrandName(p?.brand_name)) {
      setBatteryHealth('');
    }
  };

  const handleConditionChange = (val: string | null) => {
    if (val === 'NEW' || val === 'USED') {
      setCondition(val);
      if (val === 'NEW') {
        setBatteryHealth('');
        setDefectNotes('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const payoutNum = agreedPayoutRupees ? Number(agreedPayoutRupees) : 0;
    const targetNum = targetSellingPriceRupees ? Number(targetSellingPriceRupees) : undefined;
    const batteryNum =
      isApple && isUsed && batteryHealth !== '' ? Number(batteryHealth) : undefined;
    const defectNotesVal = isUsed ? defectNotes.trim() || undefined : undefined;

    const values = {
      customerId: customerId || undefined,
      consignorName: consignorName.trim(),
      consignorPhone: consignorPhone.trim(),
      consignorCnic: consignorCnic.trim() || undefined,
      productId,
      imei1: imei1.trim(),
      imei2: imei2.trim() || undefined,
      condition,
      batteryHealth: batteryNum,
      defectNotes: defectNotesVal,
      agreedPayoutRupees: payoutNum,
      targetSellingPriceRupees: targetNum,
      intakeDate,
      notes: notes.trim() || undefined
    };

    const schema = createConsignmentFormSchema(t);
    const parsed = schema.safeParse(values);

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
      customerId: customerId || undefined,
      consignorName: consignorName.trim(),
      consignorPhone: consignorPhone.trim(),
      consignorCnic: consignorCnic.trim() || undefined,
      productId,
      imei1: imei1.trim(),
      imei2: imei2.trim() || undefined,
      condition,
      batteryHealth: typeof batteryNum === 'number' && batteryNum > 0 ? batteryNum : undefined,
      defectNotes: defectNotesVal,
      agreedPayout: toPaisa(Number(payoutNum)),
      targetSellingPrice:
        typeof targetNum === 'number' && targetNum > 0 ? toPaisa(targetNum) : undefined,
      intakeDate,
      notes: notes.trim() || undefined
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl no-scrollbar'>
          <DialogHeader>
            <DialogTitle>{t('consignments.newConsignment')}</DialogTitle>
            <DialogDescription>{t('consignments.newConsignmentDesc')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-5 py-2'>
            <ConsignmentIntakeConsignorSection
              customerId={customerId}
              consignorName={consignorName}
              consignorPhone={consignorPhone}
              consignorCnic={consignorCnic}
              errors={errors}
              onCustomerSelect={handleCustomerSelect}
              onConsignorNameChange={setConsignorName}
              onConsignorPhoneChange={setConsignorPhone}
              onConsignorCnicChange={setConsignorCnic}
              onAddNewCustomerClick={() => setAddCustomerOpen(true)}
              extraCustomers={extraCustomers}
            />

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
                        onValueChange={handleProductChange}
                        isInvalid={!!errors.productId}
                        errors={errors.productId ? [{ message: errors.productId }] : []}
                        queryKey={['products', 'serialized-picker']}
                        fetchPage={(filters) =>
                          listProducts({
                            ...filters,
                            trackingType: 'SERIALIZED',
                            isActive: true
                          }).then((res) => ({
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
                    {t('dukaan.purchase.imei1')} <span className='text-destructive'>*</span>
                  </Label>
                  <div className='flex items-center gap-1.5'>
                    <Input
                      id='imei1'
                      value={imei1}
                      onChange={(e) => setImei1(e.target.value.replace(/\D/g, '').slice(0, 15))}
                      placeholder={t('consignments.imeiPlaceholder')}
                      maxLength={15}
                      className='flex-1'
                    />
                    <ImeiCameraScanButton
                      onScan={(code) => setImei1(code)}
                      title={t('scanner.scanImeiTitle')}
                      className='h-9 w-9 shrink-0'
                    />
                  </div>
                  <DialogFieldError message={errors.imei1} />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='imei2'>
                    {t('dukaan.purchase.imei2')} ({t('common.optional')})
                  </Label>
                  <div className='flex items-center gap-1.5'>
                    <Input
                      id='imei2'
                      value={imei2}
                      onChange={(e) => setImei2(e.target.value.replace(/\D/g, '').slice(0, 15))}
                      placeholder={t('consignments.imeiPlaceholder')}
                      maxLength={15}
                      className='flex-1'
                    />
                    <ImeiCameraScanButton
                      onScan={(code) => setImei2(code)}
                      title={t('scanner.scanImeiTitle')}
                      className='h-9 w-9 shrink-0'
                    />
                  </div>
                  <DialogFieldError message={errors.imei2} />
                </div>

                <div className={isUsed && isApple ? 'space-y-1.5' : 'sm:col-span-2 space-y-1.5'}>
                  <Label htmlFor='condition'>{t('consignments.condition')}</Label>
                  <Select value={condition} onValueChange={handleConditionChange}>
                    <SelectTrigger id='condition' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='USED'>{t('consignments.conditionUsed')}</SelectItem>
                      <SelectItem value='NEW'>{t('consignments.conditionNew')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isUsed && isApple ? (
                  <div className='space-y-1.5'>
                    <Label htmlFor='battery-health'>{t('consignments.batteryHealth')} (%)</Label>
                    <Input
                      id='battery-health'
                      type='number'
                      min={0}
                      max={100}
                      value={batteryHealth}
                      onChange={(e) => setBatteryHealth(e.target.value)}
                      placeholder={t('consignments.batteryPlaceholder')}
                    />
                    <DialogFieldError message={errors.batteryHealth} />
                  </div>
                ) : null}

                {isUsed ? (
                  <div className='sm:col-span-2 space-y-1.5'>
                    <Label htmlFor='defect-notes'>{t('consignments.defectNotes')}</Label>
                    <Input
                      id='defect-notes'
                      value={defectNotes}
                      onChange={(e) => setDefectNotes(e.target.value)}
                      placeholder={t('consignments.defectNotesPlaceholder')}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className='rounded-md border p-3.5 space-y-3 bg-muted/20'>
              <div className='font-medium text-sm text-foreground'>
                {t('consignments.sectionTerms')}
              </div>

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
                    onChange={(e) => setAgreedPayoutRupees(sanitizeNumberInput(e.target.value))}
                    placeholder={t('consignments.amountPlaceholder50k')}
                  />
                  <p className='text-xs text-muted-foreground'>
                    {t('consignments.agreedPayoutHint')}
                  </p>
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
                    onChange={(e) =>
                      setTargetSellingPriceRupees(sanitizeNumberInput(e.target.value))
                    }
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
      <CustomerDialog
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        onSuccess={handleCustomerCreated}
      />
    </>
  );
}
