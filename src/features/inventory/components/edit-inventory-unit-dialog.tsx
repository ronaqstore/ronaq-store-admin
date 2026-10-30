'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { isAppleBrandName } from '@/lib/device-family';
import { useT } from '@/i18n/use-t';
import { updateInventoryUnit } from '../api/service';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { INVENTORY_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { InventoryUnitDTO } from '@/lib/api/types';

interface EditInventoryUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: InventoryUnitDTO | null;
  brandName?: string | null;
}

export function EditInventoryUnitDialog({
  open,
  onOpenChange,
  unit,
  brandName
}: EditInventoryUnitDialogProps) {
  const qc = useQueryClient();
  const t = useT();
  const isApple = isAppleBrandName(brandName);

  const [askingPricePkr, setAskingPricePkr] = useState('');
  const [condition, setCondition] = useState<'NEW' | 'USED'>('NEW');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [defectNotes, setDefectNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !unit) return;
    setAskingPricePkr(unit.askingPrice != null ? String(Math.round(unit.askingPrice / 100)) : '');
    setCondition(unit.condition === 'USED' ? 'USED' : 'NEW');
    setBatteryHealth(unit.batteryHealth != null ? String(unit.batteryHealth) : '');
    setDefectNotes(unit.defectNotes ?? '');
    setErrors({});
  }, [open, unit]);

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!unit) throw new Error('No unit selected');

      const askingPriceInPaisa = askingPricePkr.trim()
        ? Math.round(Number(askingPricePkr.trim()) * 100)
        : null;

      const battery = isApple && batteryHealth.trim() ? Number(batteryHealth.trim()) : null;

      return updateInventoryUnit(unit.id, {
        askingPrice: askingPriceInPaisa,
        condition,
        batteryHealth: battery,
        defectNotes: defectNotes.trim() || null
      });
    },
    onSuccess: () => {
      onOpenChange(false);
      invalidateDomains({ queryClient: qc, domains: INVENTORY_SYNC_DOMAINS });
      toastSuccessAfterClose(t('inventory.editUnitSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('inventory.editUnitFailed'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (askingPricePkr.trim()) {
      const price = Number(askingPricePkr.trim());
      if (Number.isNaN(price) || price < 0) {
        nextErrors.askingPrice = t('validation.valueNonNegative');
      }
    }

    if (isApple && batteryHealth.trim()) {
      const bh = Number(batteryHealth.trim());
      if (Number.isNaN(bh) || bh < 1 || bh > 100 || !Number.isInteger(bh)) {
        nextErrors.batteryHealth = t('validation.batteryHealthRange');
      }
    }

    if (defectNotes.length > 500) {
      nextErrors.defectNotes = t('validation.notesTooLong');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    updateMutation.mutate();
  };

  const imeiLabel = unit ? (unit.imei2?.trim() ? `${unit.imei1} · ${unit.imei2}` : unit.imei1) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('inventory.editUnitTitle')}</DialogTitle>
            <DialogDescription>{t('inventory.editUnitDescription')}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4 text-sm'>
            <div className='rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground flex items-center justify-between border border-border/50'>
              <span>{t('inventory.imeiLabel')}:</span>
              <span className='font-mono font-semibold text-foreground'>{imeiLabel}</span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='unit-asking-price'>{t('inventory.askingPrice')} (PKR)</Label>
                <Input
                  id='unit-asking-price'
                  type='text'
                  inputMode='numeric'
                  onKeyDown={blockInvalidNumberKeys}
                  value={askingPricePkr}
                  onChange={(e) => {
                    setAskingPricePkr(sanitizeNumberInput(e.target.value));
                    if (errors.askingPrice) {
                      setErrors((prev) => ({ ...prev, askingPrice: '' }));
                    }
                  }}
                  placeholder={t('inventory.askingPricePlaceholder')}
                />
                <DialogFieldError message={errors.askingPrice} />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='unit-condition'>{t('inventory.condition')}</Label>
                <Select
                  value={condition}
                  onValueChange={(val) => {
                    if (val === 'NEW' || val === 'USED') setCondition(val);
                  }}
                >
                  <SelectTrigger id='unit-condition'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='NEW'>{t('inventory.conditionNew')}</SelectItem>
                    <SelectItem value='USED'>{t('inventory.conditionUsed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isApple ? (
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='unit-battery-health'>{t('inventory.batteryHealth')} (%)</Label>
                  <span className='text-[10px] text-muted-foreground'>1 - 100</span>
                </div>
                <Input
                  id='unit-battery-health'
                  type='text'
                  inputMode='numeric'
                  onKeyDown={blockInvalidNumberKeys}
                  value={batteryHealth}
                  onChange={(e) => {
                    setBatteryHealth(sanitizeNumberInput(e.target.value));
                    if (errors.batteryHealth) {
                      setErrors((prev) => ({ ...prev, batteryHealth: '' }));
                    }
                  }}
                  placeholder={t('inventory.batteryHealthPlaceholder')}
                  maxLength={3}
                />
                <DialogFieldError message={errors.batteryHealth} />
              </div>
            ) : null}

            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='unit-defect-notes'>{t('inventory.defectNotes')}</Label>
                <span className='text-[10px] text-muted-foreground'>{defectNotes.length}/500</span>
              </div>
              <Textarea
                id='unit-defect-notes'
                value={defectNotes}
                onChange={(e) => {
                  setDefectNotes(e.target.value.slice(0, 500));
                  if (errors.defectNotes) {
                    setErrors((prev) => ({ ...prev, defectNotes: '' }));
                  }
                }}
                placeholder={t('inventory.defectNotesPlaceholder')}
                rows={3}
                className='resize-none'
              />
              <DialogFieldError message={errors.defectNotes} />
            </div>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <DialogCancelButton onClick={() => onOpenChange(false)} />
            <DialogPrimaryButton
              mode='save'
              label={t('common.saveChanges')}
              loading={updateMutation.isPending}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
