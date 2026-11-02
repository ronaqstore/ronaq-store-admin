'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DialogCancelButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { formatPkr } from '@/lib/dukaan/numbers';
import { useT } from '@/i18n/use-t';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CONSIGNMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { ReturnConsignmentDialogProps } from '@/types/consignments';
import { returnConsignmentMutation } from '../api/mutations';
import { returnConsignmentFormSchema } from '../schemas/consignment-schema';

export function ReturnConsignmentDialog({
  consignment,
  open,
  onOpenChange,
  onSuccess
}: ReturnConsignmentDialogProps) {
  const t = useT();
  const qc = useQueryClient();
  const [returnReason, setReturnReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    ...returnConsignmentMutation,
    onSuccess: () => {
      onOpenChange(false);
      setReturnReason('');
      setNotes('');
      setError('');
      invalidateDomains({ queryClient: qc, domains: CONSIGNMENT_SYNC_DOMAINS });
      toastSuccessAfterClose(
        t('consignments.returnSuccess', {
          consignmentNo: consignment?.consignmentNo ?? ''
        })
      );
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('consignments.returnFailed'));
    }
  });

  if (!consignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const schema = returnConsignmentFormSchema(t);
    const parsed = schema.safeParse({ returnReason, notes });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('validation.reasonRequired'));
      return;
    }
    setError('');

    mutation.mutate({
      id: consignment.id,
      input: {
        returnReason: returnReason.trim(),
        notes: notes.trim() || undefined
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('consignments.returnTitle')}</DialogTitle>
          <DialogDescription>{t('consignments.returnDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='rounded-md border p-3 bg-muted/40 text-sm space-y-1.5'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('consignments.consignmentNo')}:</span>
              <span className='font-medium'>{consignment.consignmentNo}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('consignments.device')}:</span>
              <span className='font-medium'>{consignment.productName}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('dukaan.inventory.imeiLabel')}</span>
              <span className='font-mono text-xs'>{consignment.imei1}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('consignments.consignor')}:</span>
              <span>
                {consignment.consignorName} ({consignment.consignorPhone})
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('consignments.agreedPayout')}:</span>
              <span className='font-semibold'>{formatPkr(consignment.agreedPayout)}</span>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='return-reason'>
              {t('consignments.returnReasonLabel')} <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='return-reason'
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder={t('consignments.returnReasonPlaceholder')}
            />
            <DialogFieldError message={error} />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='return-notes'>{t('common.notes')}</Label>
            <Textarea
              id='return-notes'
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('consignments.notesPlaceholder')}
            />
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <DialogCancelButton onClick={() => onOpenChange(false)} />
            <Button type='submit' variant='destructive' isLoading={mutation.isPending}>
              {t('consignments.confirmReturn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
