'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
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
import type { ConsignmentWhatsAppShareDialogProps } from '@/types/consignments';
import {
  buildConsignmentWhatsAppText,
  buildConsignmentWhatsAppUrl
} from '../helpers/consignment-whatsapp-formatter';

export function ConsignmentWhatsAppShareDialog({
  open,
  onOpenChange,
  consignment,
  type = 'intake'
}: ConsignmentWhatsAppShareDialogProps) {
  const t = useT();
  const { data: session } = useSession();
  const [phone, setPhone] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const shopName = session?.user?.shopName ?? 'Ronaq Store';

  React.useEffect(() => {
    if (consignment?.consignorPhone) {
      setPhone(consignment.consignorPhone);
    } else {
      setPhone('');
    }
    setCopied(false);
  }, [consignment]);

  if (!consignment) return null;

  const receiptText = buildConsignmentWhatsAppText({
    consignment,
    shopName,
    type
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
    const url = buildConsignmentWhatsAppUrl(cleanPhone, receiptText);
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
            <Label htmlFor='consignment-wa-phone'>{t('scanner.customerWhatsAppNumber')}</Label>
            <Input
              id='consignment-wa-phone'
              placeholder={t('scanner.customerWhatsAppPlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className='font-mono'
            />
          </div>

          <div className='space-y-1.5'>
            <Label>{t('scanner.receiptPreview')}</Label>
            <div className='max-h-56 overflow-y-auto rounded-md border bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all'>
              {receiptText}
            </div>
          </div>
        </div>

        <DialogFooter className='mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={handleCopy}
            className='gap-1.5 w-full sm:w-auto'
          >
            {copied ? (
              <Icons.check className='h-4 w-4 text-emerald-600' />
            ) : (
              <Icons.copy className='h-4 w-4' />
            )}
            {copied ? t('scanner.receiptCopied') : t('scanner.copyReceipt')}
          </Button>
          <Button
            type='button'
            onClick={handleOpenWhatsApp}
            className='gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto'
          >
            <Icons.chat className='h-4 w-4' />
            {t('scanner.sendOnWhatsApp')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
