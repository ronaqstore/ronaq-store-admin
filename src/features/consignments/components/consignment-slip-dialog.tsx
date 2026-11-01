'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { formatPkr } from '@/lib/dukaan/numbers';
import { formatIsoDate } from '@/lib/dates';
import { useT } from '@/i18n/use-t';
import { storeSettingsQueryOptions } from '@/features/store-settings';
import type { ConsignmentSlipDialogProps } from '@/types/consignments';

export function ConsignmentSlipDialog({
  consignment,
  type,
  open,
  onOpenChange
}: ConsignmentSlipDialogProps) {
  const t = useT();
  const { data: storeSettings } = useQuery(storeSettingsQueryOptions());

  if (!consignment) return null;

  const isIntake = type === 'intake';
  const shopName = storeSettings?.displayName?.trim() || t('common.appName');
  const shopPhone = storeSettings?.phoneNumber || storeSettings?.whatsappNumber || '';
  const shopAddress = storeSettings?.address || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-xl print:m-0 print:max-w-full print:p-0 print:border-0 print:shadow-none'>
        <DialogHeader className='print:hidden'>
          <DialogTitle>
            {isIntake ? t('consignments.intakeSlipTitle') : t('consignments.settlementSlipTitle')}
          </DialogTitle>
        </DialogHeader>

        {/* Printable Slip Content */}
        <div className='rounded-lg border bg-card p-6 text-card-foreground space-y-5 print:border-none print:p-2'>
          {/* Header */}
          <div className='border-b pb-4 text-center space-y-1'>
            <h2 className='text-2xl font-bold tracking-tight'>{shopName}</h2>
            {(shopPhone || shopAddress) && (
              <p className='text-xs text-muted-foreground'>
                {[shopPhone, shopAddress].filter(Boolean).join(' • ')}
              </p>
            )}
            <div className='inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mt-2'>
              {isIntake ? t('consignments.intakeSlipBadge') : t('consignments.settlementSlipBadge')}
            </div>
          </div>

          {/* Meta Info */}
          <div className='grid grid-cols-2 gap-3 text-xs'>
            <div>
              <span className='text-muted-foreground'>{t('consignments.consignmentNo')}: </span>
              <span className='font-mono font-semibold'>{consignment.consignmentNo}</span>
            </div>
            <div className='text-end'>
              <span className='text-muted-foreground'>{t('common.date')}: </span>
              <span className='font-medium'>
                {formatIsoDate(
                  isIntake
                    ? consignment.intakeDate
                    : String(consignment.settledAt ?? consignment.updatedAt)
                )}
              </span>
            </div>
          </div>

          {/* Consignor Details */}
          <div className='rounded border p-3 text-xs space-y-1.5 bg-muted/20'>
            <div className='font-semibold text-foreground mb-1'>
              {t('consignments.sectionConsignor')}
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <span className='text-muted-foreground'>{t('common.name')}: </span>
                <span className='font-medium'>{consignment.consignorName}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>{t('common.phone')}: </span>
                <span>{consignment.consignorPhone}</span>
              </div>
              {consignment.consignorCnic && (
                <div className='col-span-2'>
                  <span className='text-muted-foreground'>CNIC: </span>
                  <span className='font-mono'>{consignment.consignorCnic}</span>
                </div>
              )}
            </div>
          </div>

          {/* Device Details */}
          <div className='rounded border p-3 text-xs space-y-1.5 bg-muted/20'>
            <div className='font-semibold text-foreground mb-1'>
              {t('consignments.sectionDevice')}
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='col-span-2'>
                <span className='text-muted-foreground'>{t('consignments.device')}: </span>
                <span className='font-semibold text-sm'>{consignment.productName}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>IMEI 1: </span>
                <span className='font-mono font-medium'>{consignment.imei1}</span>
              </div>
              {consignment.imei2 && (
                <div>
                  <span className='text-muted-foreground'>IMEI 2: </span>
                  <span className='font-mono font-medium'>{consignment.imei2}</span>
                </div>
              )}
              <div>
                <span className='text-muted-foreground'>{t('consignments.condition')}: </span>
                <span>
                  {consignment.condition === 'NEW'
                    ? t('consignments.conditionNew')
                    : t('consignments.conditionUsed')}
                </span>
              </div>
              {consignment.batteryHealth != null && (
                <div>
                  <span className='text-muted-foreground'>{t('consignments.batteryHealth')}: </span>
                  <span>{consignment.batteryHealth}%</span>
                </div>
              )}
              {consignment.defectNotes && (
                <div className='col-span-2'>
                  <span className='text-muted-foreground'>{t('consignments.defectNotes')}: </span>
                  <span>{consignment.defectNotes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className='rounded border p-3 space-y-2 bg-muted/30'>
            <div className='flex justify-between items-center text-sm font-semibold'>
              <span>
                {isIntake ? t('consignments.agreedPayout') : t('consignments.payoutAmount')}
              </span>
              <span className='text-lg font-bold text-primary'>
                {formatPkr(
                  isIntake
                    ? (consignment.agreedPayout ?? 0)
                    : (consignment.settledAmount ?? consignment.agreedPayout ?? 0)
                )}
              </span>
            </div>

            {isIntake && consignment.targetSellingPrice != null && (
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>{t('consignments.targetSellingPrice')}</span>
                <span>{formatPkr(consignment.targetSellingPrice)}</span>
              </div>
            )}

            {!isIntake && (
              <div className='text-xs space-y-1 pt-1 border-t'>
                <div className='flex justify-between text-muted-foreground'>
                  <span>{t('consignments.payoutMethod')}:</span>
                  <span className='font-medium text-foreground'>
                    {consignment.payoutMethod ?? 'CASH'}
                  </span>
                </div>
                {consignment.payoutReference && (
                  <div className='flex justify-between text-muted-foreground'>
                    <span>{t('consignments.payoutReference')}:</span>
                    <span className='font-mono text-foreground'>{consignment.payoutReference}</span>
                  </div>
                )}
                {consignment.soldPrice != null && (
                  <div className='flex justify-between text-muted-foreground'>
                    <span>{t('consignments.soldPrice')}:</span>
                    <span>{formatPkr(consignment.soldPrice)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legal / Amanat Terms Box */}
          <div className='rounded border p-2.5 text-[11px] leading-relaxed text-muted-foreground bg-muted/10'>
            {isIntake ? (
              <p>
                مذکورہ موبائل فون مالک کی رضامندی سے دکان پر برائے فروخت امانت کے طور پر رکھوایا گیا
                ہے۔ فروخت ہونے کی صورت میں متفقہ رقم ادا کی جائے گی۔ واپسی کی صورت میں بغیر کسی
                کٹوتی کے فون واپس دیا جائے گا۔
              </p>
            ) : (
              <p>
                میں اقرار کرتا ہوں کہ میں نے اپنے مذکورہ موبائل فون کی متفقہ رقم مکمل وصول کر لی ہے
                اور اب اس فون کے حوالے سے میرا کوئی مطالبہ باقی نہیں ہے۔
              </p>
            )}
          </div>

          {/* Signatures */}
          <div className='grid grid-cols-2 gap-8 pt-8 text-xs text-center'>
            <div className='border-t border-dashed pt-2'>
              <span className='text-muted-foreground'>
                {isIntake ? t('consignments.consignorSign') : t('consignments.receiverSign')}
              </span>
            </div>
            <div className='border-t border-dashed pt-2'>
              <span className='text-muted-foreground'>{t('consignments.shopSign')}</span>
            </div>
          </div>
        </div>

        <DialogFooter className='print:hidden gap-2 sm:gap-0'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          <Button onClick={handlePrint} className='gap-1.5'>
            <Icons.print className='h-4 w-4' />
            {t('common.print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
