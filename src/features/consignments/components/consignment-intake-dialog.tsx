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
import {} from '@/components/ui/select';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { createClientRequestId, fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import { todayIsoDate } from '@/lib/dates';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import { isAppleBrandName } from '@/lib/device-family';
import { QuickVariantDialog } from '@/components/variants/quick-variant-dialog';
import { CustomerDialog } from '@/components/dialogs/customer-dialog';
import { ConsignmentIntakeConsignorSection } from './consignment-intake-consignor-section';
import { ConsignmentIntakeTermsSection } from './consignment-intake-terms-section';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CONSIGNMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { ConsignmentDTO, CustomerDTO } from '@/lib/api/types';
import type { ConsignmentIntakeDialogProps } from '@/types/consignments';
import type { ProductPickerItem } from '@/types/picker';
import { createConsignmentMutation } from '../api/mutations';
import { createConsignmentFormSchema, mapZodIssuesToErrors } from '../schemas/consignment-schema';

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
        if (initialProduct.defaultSellingPrice)
          setTargetSellingPriceRupees(String(fromPaisa(initialProduct.defaultSellingPrice)));
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
      setErrors(mapZodIssuesToErrors(parsed.error));
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
        <DialogContent className='max-h-[90dvh] overflow-y-auto touch-pan-y overscroll-y-contain [webkit-overflow-scrolling:touch] sm:max-w-2xl no-scrollbar'>
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

            <ConsignmentIntakeTermsSection
              agreedPayoutRupees={agreedPayoutRupees}
              targetSellingPriceRupees={targetSellingPriceRupees}
              intakeDate={intakeDate}
              notes={notes}
              errors={errors}
              onAgreedPayoutChange={setAgreedPayoutRupees}
              onTargetSellingPriceChange={setTargetSellingPriceRupees}
              onIntakeDateChange={setIntakeDate}
              onNotesChange={setNotes}
            />

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
