'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import {
  buildWhatsAppReceiptText,
  buildWhatsAppReceiptUrl,
  type WhatsAppReceiptData
} from '../helpers/whatsapp-receipt-formatter';

export interface SaleWhatsAppShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: WhatsAppReceiptData | null;
}

export function SaleWhatsAppShareDialog({
  open,
  onOpenChange,
  receiptData
}: SaleWhatsAppShareDialogProps) {
  const t = useT();
  const [phone, setPhone] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (receiptData?.customerPhone) {
      setPhone(receiptData.customerPhone);
    } else {
      setPhone('');
    }
    setCopied(false);
  }, [receiptData]);

  if (!receiptData) return null;

  const receiptText = buildWhatsAppReceiptText({
    ...receiptData,
    customerPhone: phone || receiptData.customerPhone
  });

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(receiptText);
      setCopied(true);
      toast.success(t('scanner.receiptCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      toast.error(t('scanner.phoneRequiredForWhatsApp'));
      return;
    }
    const url = buildWhatsAppReceiptUrl(cleanPhone, receiptText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400'>
            <Icons.chat className='h-5 w-5' />
            {t('scanner.whatsappReceiptTitle')}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            {t('scanner.whatsappReceiptDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className='mt-2 space-y-3'>
          <div className='space-y-1.5'>
            <Label htmlFor='wa-phone'>{t('scanner.customerWhatsAppNumber')}</Label>
            <Input
              id='wa-phone'
              placeholder={t('scanner.customerWhatsAppPlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className='font-mono'
            />
          </div>

          <div className='space-y-1.5'>
            <Label>{t('scanner.receiptPreview')}</Label>
            <pre className='max-h-48 overflow-y-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap text-foreground select-all'>
              {receiptText}
            </pre>
          </div>
        </div>

        <DialogFooter className='mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleCopy}
            className='gap-1.5'
          >
            {copied ? <Icons.check className='h-4 w-4' /> : <Icons.clipboard className='h-4 w-4' />}
            {copied ? t('common.copied') : t('scanner.copyReceipt')}
          </Button>

          <Button
            type='button'
            size='sm'
            onClick={handleOpenWhatsApp}
            className='gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white'
          >
            <Icons.send className='h-4 w-4' />
            {t('scanner.sendOnWhatsApp')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
