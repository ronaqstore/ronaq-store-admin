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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import { createInventoryAdjustment } from '../api/service';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { INVENTORY_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { InventoryUnitDTO } from '@/lib/api/types';

interface RestoreUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  unit: InventoryUnitDTO | null;
}

export function RestoreUnitDialog({ open, onOpenChange, productId, unit }: RestoreUnitDialogProps) {
  const qc = useQueryClient();
  const t = useT();

  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const restoreMutation = useMutation({
    mutationFn: () =>
      createInventoryAdjustment({
        productId,
        type: 'RESTORE',
        inventoryUnitId: unit?.id,
        reason: reason.trim()
      }),
    onSuccess: (res) => {
      const message = res?.message || t('inventory.restoreSuccess');
      onOpenChange(false);
      setReason('');
      setError(null);
      invalidateDomains({ queryClient: qc, domains: INVENTORY_SYNC_DOMAINS });
      toastSuccessAfterClose(message);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('inventory.restoreFailed'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(t('validation.reasonRequired'));
      return;
    }
    setError(null);
    restoreMutation.mutate();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason('');
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const imeiLabel = unit ? (unit.imei2?.trim() ? `${unit.imei1} · ${unit.imei2}` : unit.imei1) : '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('inventory.restoreTitle')}</DialogTitle>
            <DialogDescription>{t('inventory.restoreDescription')}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4 text-sm'>
            <div className='rounded-md bg-muted/50 p-3 space-y-1.5 border border-border/50'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>{t('inventory.imeiLabel')}:</span>
                <span className='font-mono font-semibold text-foreground'>{imeiLabel}</span>
              </div>
              {unit?.status ? (
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>{t('dukaan.status')}:</span>
                  <span className='font-semibold text-rose-600 dark:text-rose-400'>
                    {unit.status}
                  </span>
                </div>
              ) : null}
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='restore-reason'>
                {t('inventory.reasonMandatory')} <span className='text-destructive'>*</span>
              </Label>
              <Textarea
                id='restore-reason'
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t('inventory.reasonPlaceholder')}
                rows={3}
                className='resize-none'
                autoFocus
              />
              <DialogFieldError message={error ?? undefined} />
            </div>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <DialogCancelButton onClick={() => handleOpenChange(false)} />
            <DialogPrimaryButton
              mode='save'
              label={t('inventory.restoreConfirm')}
              loading={restoreMutation.isPending}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
