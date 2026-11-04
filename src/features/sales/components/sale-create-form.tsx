'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-form';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { useT } from '@/i18n/use-t';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { createClientRequestId } from '@/lib/dukaan/numbers';
import { isValidationApiError } from '@/lib/api/is-validation-error';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { listCustomers } from '@/features/customers/api/service';
import { CustomerDialog } from '@/components/dialogs/customer-dialog';
import type { CustomerDTO } from '@/lib/api/types';
import type { NamedEntity } from '@/types';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { createSaleMutation } from '../api/mutations';
import { createSaleFormSchema } from '../schemas/sale-schema';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { SALE_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import {
  buildCreateSalePayload,
  buildQuickSaleDefaults,
  calcSaleTotals,
  emptySaleLine,
  getSalePricingFingerprint,
  isPhoneSaleLine,
  selectSaleTotals
} from '../helpers/sale-create-helpers';
import { SaleLineCard } from './sale-line-card';
import { SaleTotalsSummary } from './sale-totals-summary';
import { SaleScanBar } from './sale-scan-bar';
import { SaleWhatsAppShareDialog } from './sale-whatsapp-share-dialog';
import type { WhatsAppReceiptData } from '@/types/barcode';
import { OverdraftAlert } from '@/components/common/overdraft-alert';
import type { ResponseResolveScanDto, SaleDTO } from '@/lib/api/types';
import type {
  SaleFormSubmitContext,
  SaleFormValues,
  SaleCreateFormProps,
  CreateSaleResult,
  SaleBelowCostPrompt,
  SaleLineItem
} from '@/types/sales';

export function SaleCreateForm({ onDone, initialProduct }: SaleCreateFormProps) {
  const qc = useQueryClient();
  const t = useT();
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId());
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [belowCostPrompt, setBelowCostPrompt] = useState<SaleBelowCostPrompt | null>(null);
  const [confirmBelowCost, setConfirmBelowCost] = useState(false);
  const [promptedFingerprint, setPromptedFingerprint] = useState<string | null>(null);
  const [savedReceipt, setSavedReceipt] = useState<WhatsAppReceiptData | null>(null);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [extraCustomers, setExtraCustomers] = useState<NamedEntity[]>([]);

  const handleCustomerCreated = (newCust: CustomerDTO) => {
    setExtraCustomers((prev) => [{ id: newCust.id, name: newCust.name }, ...prev]);
    form.setFieldValue('customer_id', newCust.id);
  };

  const save = useMutation({
    ...createSaleMutation,
    onSuccess: (res: CreateSaleResult) => {
      if (res && 'confirmBelowCost' in res && res.confirmBelowCost) {
        setBelowCostPrompt(res);
        setPromptedFingerprint(
          getSalePricingFingerprint(form.state.values.lines, form.state.values.discount)
        );
        return;
      }
      setBelowCostPrompt(null);
      setConfirmBelowCost(false);
      setPromptedFingerprint(null);
      setClientRequestId(createClientRequestId());
      invalidateDomains({ queryClient: qc, domains: SALE_SYNC_DOMAINS });

      const saleDto = res as SaleDTO;
      if (saleDto?.saleNo) {
        const receiptItems = (saleDto.items || []).map((it) => ({
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
          imei: it.imei,
          warrantyDays: it.warrantyDays
        }));
        setSavedReceipt({
          saleNo: saleDto.saleNo,
          saleDate: saleDto.saleDate ? saleDto.saleDate.slice(0, 10) : undefined,
          customerName: saleDto.customerName,
          customerPhone: null,
          items: receiptItems,
          totalAmount: saleDto.totalAmount,
          discount: saleDto.discount,
          paymentMethod: 'CASH'
        });
        toastSuccessAfterClose(t('dukaan.sale.saved', { saleNo: saleDto.saleNo }));
      } else {
        onDone?.();
        toastSuccessAfterClose(
          (res as { message?: string })?.message || t('dukaan.sale.saved', { saleNo: '' })
        );
      }
    },
    onError: (e: Error) => {
      if (isValidationApiError(e)) {
        setFormApiError(e.message);
        return;
      }
      toast.error(e.message);
    }
  });

  const defaultValues: SaleFormValues = buildQuickSaleDefaults(initialProduct);

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: createSaleFormSchema(t) as never },
    onSubmit: ({ value }: SaleFormSubmitContext) => {
      setFormApiError(null);
      const isStillPrompted =
        belowCostPrompt != null &&
        promptedFingerprint === getSalePricingFingerprint(value.lines, value.discount);

      if (isStillPrompted && !confirmBelowCost) {
        setFormApiError(t('sales.confirmBelowCostRequired'));
        return;
      }
      save.mutate(
        buildCreateSalePayload(
          value.lines,
          value.customer_id,
          Number(value.discount) || 0,
          Number(value.paid_now) || 0,
          value.notes,
          clientRequestId,
          isStillPrompted ? confirmBelowCost : false
        )
      );
    }
  });

  const handleItemResolved = (result: ResponseResolveScanDto) => {
    if (!result.found || !result.product) return;

    const lines = form.getFieldValue('lines');
    const product = result.product;

    if (result.type === 'SERIALIZED' && result.unit) {
      const unit = result.unit;
      const alreadyAdded = lines.some((l) => l.inventory_unit_id === unit.id);
      if (alreadyAdded) {
        toast.warning(t('scanner.imeiAlreadyInCart', { imei: unit.imei1 }));
        return;
      }

      const isFirstLineEmpty =
        lines.length === 1 && !lines[0]?.product_id && !lines[0]?.inventory_unit_id;

      const newLine: SaleLineItem = {
        product_id: product.id,
        product_name: product.name,
        tracking_type: 'SERIALIZED',
        inventory_unit_id: unit.id,
        unit_price: unit.effectivePrice ?? product.defaultSellingPrice,
        quantity: 1,
        unit_condition:
          unit.condition === 'USED' || unit.condition === 'NEW' ? unit.condition : undefined,
        warranty_days: unit.condition === 'USED' ? '30' : undefined
      };

      if (isFirstLineEmpty) {
        form.setFieldValue('lines', [newLine]);
      } else {
        form.setFieldValue('lines', [...lines, newLine]);
      }
      toast.success(t('scanner.itemAdded', { name: `${product.name} (${unit.imei1})` }));
    } else if (result.type === 'QUANTITY') {
      const existingIdx = lines.findIndex(
        (l) => l.product_id === product.id && l.tracking_type === 'QUANTITY'
      );
      if (existingIdx >= 0) {
        const existing = lines[existingIdx];
        const nextQty = (existing.quantity || 1) + 1;
        form.setFieldValue(`lines[${existingIdx}].quantity`, nextQty);
        toast.success(t('scanner.quantityUpdated', { name: product.name, qty: nextQty }));
      } else {
        const isFirstLineEmpty =
          lines.length === 1 && !lines[0]?.product_id && !lines[0]?.inventory_unit_id;

        const newLine: SaleLineItem = {
          product_id: product.id,
          product_name: product.name,
          tracking_type: 'QUANTITY',
          inventory_unit_id: '',
          unit_price: product.defaultSellingPrice,
          quantity: 1
        };

        if (isFirstLineEmpty) {
          form.setFieldValue('lines', [newLine]);
        } else {
          form.setFieldValue('lines', [...lines, newLine]);
        }
        toast.success(t('scanner.itemAdded', { name: product.name }));
      }
    } else if (result.type === 'SERIALIZED_PRODUCT') {
      toast.info(t('scanner.selectPhoneUnitPrompt', { name: product.name }));
      const isFirstLineEmpty =
        lines.length === 1 && !lines[0]?.product_id && !lines[0]?.inventory_unit_id;
      const newLine: SaleLineItem = {
        product_id: product.id,
        product_name: product.name,
        tracking_type: 'SERIALIZED',
        inventory_unit_id: '',
        unit_price: product.defaultSellingPrice,
        quantity: 1
      };
      if (isFirstLineEmpty) {
        form.setFieldValue('lines', [newLine]);
      } else {
        form.setFieldValue('lines', [...lines, newLine]);
      }
    }
  };

  const currentFingerprint = useStore(form.store, (s) =>
    getSalePricingFingerprint(s.values.lines, s.values.discount)
  );

  useEffect(() => {
    if (belowCostPrompt && promptedFingerprint && currentFingerprint !== promptedFingerprint) {
      setBelowCostPrompt(null);
      setConfirmBelowCost(false);
      setFormApiError(null);
      setPromptedFingerprint(null);
    }
  }, [currentFingerprint, promptedFingerprint, belowCostPrompt]);

  const handleConfirmBelowCostChange = (checked: boolean) => {
    setConfirmBelowCost(checked);
    if (checked) setFormApiError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <>
      <form className='space-y-4' onSubmit={handleSubmit}>
        {formApiError ? (
          <Alert variant='destructive'>
            <Icons.warning />
            <AlertDescription>{formApiError}</AlertDescription>
          </Alert>
        ) : null}
        {belowCostPrompt ? (
          <OverdraftAlert
            checked={confirmBelowCost}
            onCheckedChange={handleConfirmBelowCostChange}
            title={belowCostPrompt.message}
            confirmLabel={t('sales.confirmBelowCost')}
            id='confirm-below-cost'
            variant='banner'
          />
        ) : null}
        <form.Subscribe
          selector={(s) => s.values.lines.some((l) => isPhoneSaleLine(l))}
          children={(hasPhone) =>
            hasPhone ? (
              <Alert>
                <Icons.warning />
                <AlertTitle>{t('dukaan.sale.noWarrantyAlertTitle')}</AlertTitle>
                <AlertDescription>{t('dukaan.sale.noWarrantyAlert')}</AlertDescription>
              </Alert>
            ) : null
          }
        />

        <FieldGroup className='max-w-md gap-3'>
          <form.Field
            name='customer_id'
            children={(field) => {
              const isInvalid = isFieldMetaInvalid(field.state.meta);
              return (
                <FormEntitySelect
                  name={field.name}
                  label={t('dukaan.sale.customerRequiredUdhar')}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onValueChange={(id) => field.handleChange(id || '__walkin__')}
                  isInvalid={isInvalid}
                  errors={field.state.meta.errors}
                  queryKey={['customers', 'picker']}
                  fetchPage={(filters) =>
                    listCustomers({ ...filters, isActive: true }).then((res) => ({
                      items: res.items,
                      total: res.total,
                      page: res.page,
                      limit: res.pageSize
                    }))
                  }
                  placeholder={t('dukaan.sale.walkInOrCustomer')}
                  searchPlaceholder={t('dukaan.sale.searchCustomers')}
                  selectedLabel={
                    field.state.value === '__walkin__' ? t('dukaan.sale.walkIn') : undefined
                  }
                  onAddNewClick={() => setAddCustomerOpen(true)}
                  addNewLabel={t('dukaan.party.customerAddTitle')}
                  extraItems={[
                    {
                      id: '__walkin__',
                      name: t('dukaan.sale.walkInCashOnly')
                    },
                    ...extraCustomers
                  ]}
                />
              );
            }}
          />
        </FieldGroup>
        <div className='rounded-xl border border-primary/20 bg-primary/5 p-2.5 sm:p-3'>
          <p className='mb-1.5 text-xs font-semibold text-primary flex items-center gap-1.5'>
            <Icons.scan className='h-3.5 w-3.5' />
            {t('scanner.quickScanSell')}
          </p>
          <SaleScanBar onItemResolved={handleItemResolved} />
        </div>

        <div className='space-y-3'>
          <form.AppField
            name='lines'
            mode='array'
            children={(field) => (
              <>
                {field.state.value.map((_line, idx) => {
                  const excludedUnitIds = field.state.value
                    .map((other, otherIdx) =>
                      otherIdx !== idx ? other.inventory_unit_id : undefined
                    )
                    .filter((id): id is string => !!id);
                  return (
                    <SaleLineCard
                      key={idx}
                      form={form as never}
                      index={idx}
                      canRemove={field.state.value.length > 1}
                      onRemove={() => field.removeValue(idx)}
                      excludedUnitIds={excludedUnitIds}
                    />
                  );
                })}
                <div className='flex justify-end'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => field.pushValue({ ...emptySaleLine })}
                  >
                    <Icons.add className='me-2 h-4 w-4' />
                    {t('dukaan.sale.addItem')}
                  </Button>
                </div>
              </>
            )}
          />
        </div>

        <div className='grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2'>
          <form.AppField
            name='discount'
            children={(field) => (
              <field.TextField
                label={t('dukaan.sale.discount')}
                type='number'
                min={0}
                max={INPUT_LIMITS.amountRupeesMax}
                placeholder={t('dukaan.sale.discountPlaceholder')}
              />
            )}
          />
          <form.AppField
            name='paid_now'
            children={(field) => (
              <field.TextField
                label={t('dukaan.sale.paidNow')}
                type='number'
                min={0}
                max={INPUT_LIMITS.amountRupeesMax}
                required
                placeholder={t('dukaan.sale.paidNowPlaceholder')}
              />
            )}
          />
          <div className='sm:col-span-2'>
            <form.AppField
              name='notes'
              children={(field) => (
                <field.TextField
                  label={t('dukaan.sale.notes')}
                  maxLength={INPUT_LIMITS.notes}
                  placeholder={t('dukaan.sale.notesPlaceholder')}
                />
              )}
            />
          </div>
          <form.Subscribe
            selector={selectSaleTotals}
            children={({ lines, discount, paidNow }) => (
              <SaleTotalsSummary {...calcSaleTotals(lines, discount, paidNow)} />
            )}
          />
        </div>

        <DialogFooter className='mx-0 mb-0 px-0 gap-2 sm:gap-2.5'>
          {onDone ? <DialogCancelButton onClick={onDone} disabled={save.isPending} /> : null}
          <DialogPrimaryButton mode='add' loading={save.isPending} />
        </DialogFooter>

        <SaleWhatsAppShareDialog
          open={savedReceipt != null}
          onOpenChange={(open) => {
            if (!open) {
              setSavedReceipt(null);
              onDone?.();
            }
          }}
          receiptData={savedReceipt}
        />
      </form>
      <CustomerDialog
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        onSuccess={handleCustomerCreated}
      />
    </>
  );
}
