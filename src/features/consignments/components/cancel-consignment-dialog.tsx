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
import { Button } from '@/components/ui/button';
import { DialogCancelButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CONSIGNMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { CancelConsignmentDialogProps } from '@/types/consignments';
import { cancelConsignmentMutation } from '../api/mutations';
import { cancelConsignmentFormSchema } from '../schemas/consignment-schema';

export function CancelConsignmentDialog({
  consignment,
  open,
  onOpenChange,
  onSuccess
}: CancelConsignmentDialogProps) {
  const t = useT();
  const qc = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    ...cancelConsignmentMutation,
    onSuccess: () => {
      onOpenChange(false);
      setCancelReason('');
      setError('');
      invalidateDomains({ queryClient: qc, domains: CONSIGNMENT_SYNC_DOMAINS });
      toastSuccessAfterClose(
        t('consignments.cancelSuccess', {
          consignmentNo: consignment?.consignmentNo ?? ''
        })
      );
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('consignments.cancelFailed'));
    }
  });

  if (!consignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const schema = cancelConsignmentFormSchema(t);
    const parsed = schema.safeParse({ cancelReason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('validation.reasonRequired'));
      return;
    }
    setError('');

    mutation.mutate({
      id: consignment.id,
      input: { cancelReason: cancelReason.trim() }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('consignments.cancelTitle')}</DialogTitle>
          <DialogDescription>{t('consignments.cancelDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='rounded-md border p-3 bg-muted/40 text-sm space-y-1'>
            <div className='font-medium'>
              {consignment.consignmentNo} - {consignment.productName}
            </div>
            <div className='text-xs text-muted-foreground'>
              {t('dukaan.inventory.imeiLabel')} {consignment.imei1} | {consignment.consignorName}
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='cancel-reason'>
              {t('validation.reasonRequired')} <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='cancel-reason'
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('consignments.cancelReasonPlaceholder')}
            />
            <DialogFieldError message={error} />
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <DialogCancelButton onClick={() => onOpenChange(false)} />
            <Button type='submit' variant='destructive' isLoading={mutation.isPending}>
              {t('consignments.cancelTitle')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
