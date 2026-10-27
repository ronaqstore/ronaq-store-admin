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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatPkr, toPaisa } from '@/lib/dukaan/numbers';
import { todayIsoDate } from '@/lib/dates';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { blockInvalidNumberKeys, sanitizeNumberInput } from '@/lib/form-number';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import { cn } from '@/lib/utils';
import { OverdraftAlert } from '@/components/common/overdraft-alert';
import { createExpenseMutation } from '../api/mutations';
import { CategorySelectCombobox } from './category-select';
import { AddCategoryDialog } from './add-category-dialog';
import type {
  ExpenseCategoryDTO,
  RecordExpenseDialogProps,
  RecordExpenseFormErrors
} from '@/types/expense';
import type { OverdraftPrompt } from '@/types';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { EXPENSE_SYNC_DOMAINS } from '@/lib/query/sync-domains';

export function RecordExpenseDialog({
  open,
  onOpenChange,
  defaultCategoryId,
  onSuccess
}: RecordExpenseDialogProps) {
  const t = useT();
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? '');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryDTO | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIsoDate);
  const [description, setDescription] = useState('');
  const [confirmOverdraft, setConfirmOverdraft] = useState(false);
  const [overdraftPrompt, setOverdraftPrompt] = useState<OverdraftPrompt | null>(null);

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [errors, setErrors] = useState<RecordExpenseFormErrors>({});

  const clearError = (key: keyof RecordExpenseFormErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const recordMutation = useMutation({
    ...createExpenseMutation,
    onSuccess: (res) => {
      if (res && res.confirmOverdraft) {
        setOverdraftPrompt({
          shortfall: res.shortfall,
          message: res.message
        });
        setConfirmOverdraft(true);
        toast.warning(
          t('expenses.shortfallWarningDesc', {
            shortfall: formatPkr(res.shortfall ?? 0)
          })
        );
        return;
      }

      onOpenChange(false);
      resetForm();
      invalidateDomains({ queryClient: qc, domains: EXPENSE_SYNC_DOMAINS });
      onSuccess?.();
      toastSuccessAfterClose(t('expenses.recordSuccess', { amount: amountStr }));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('expenses.recordFailed'));
    }
  });

  const resetForm = () => {
    setCategoryId('');
    setSelectedCategory(null);
    setAmountStr('');
    setDescription('');
    setConfirmOverdraft(false);
    setOverdraftPrompt(null);
    setErrors({});
  };

  const handleCategoryCreated = (newCat: ExpenseCategoryDTO) => {
    setSelectedCategory(newCat);
    setCategoryId(newCat.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: RecordExpenseFormErrors = {};
    if (!categoryId) {
      nextErrors.categoryId = t('expenses.categoryRequired');
    }

    const num = parseFloat(amountStr);
    if (!num || num <= 0) {
      nextErrors.amount = t('common.invalidAmount');
    }

    if (!expenseDate.trim()) {
      nextErrors.expenseDate = t('validation.dateRequired');
    }

    if (overdraftPrompt && !confirmOverdraft) {
      nextErrors.confirmOverdraft = t('expenses.confirmOverdraftRequired');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    recordMutation.mutate({
      categoryId,
      amount: toPaisa(num),
      expenseDate,
      description: description.trim() ? description.trim() : undefined,
      confirmOverdraft: confirmOverdraft || !!overdraftPrompt
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleCategorySelect = (cat: ExpenseCategoryDTO | null) => {
    setSelectedCategory(cat);
    setCategoryId(cat?.id ?? '');
    clearError('categoryId');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountStr(
      sanitizeNumberInput(e.target.value, { min: 1, max: INPUT_LIMITS.amountRupeesMax })
    );
    clearError('amount');
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(clampText(e.target.value, INPUT_LIMITS.notes));
  };

  const handleExpenseDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpenseDate(e.target.value);
    clearError('expenseDate');
  };

  const handleConfirmOverdraftChange = (checked: boolean) => {
    setConfirmOverdraft(checked);
    if (checked) clearError('confirmOverdraft');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className='max-h-[92vh] overflow-y-auto w-full sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('expenses.recordExpenseTitle')}</DialogTitle>
            <DialogDescription>{t('expenses.recordExpenseDesc')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
            <div className='space-y-1.5 w-full'>
              <Label className='text-sm font-normal text-foreground'>
                {t('expenses.category')} <span className='text-destructive'>*</span>
              </Label>

              <CategorySelectCombobox
                value={categoryId}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategorySelect}
                placeholder={t('expenses.searchAndSelectCategory')}
                disabled={recordMutation.isPending}
                onAddNewCategoryClick={() => setAddCategoryOpen(true)}
              />
              <DialogFieldError message={errors.categoryId} />
            </div>

            <div className='space-y-1.5 w-full'>
              <Label htmlFor='expense-amount' className='text-sm font-normal text-foreground'>
                {t('expenses.amountPkr')} <span className='text-destructive'>*</span>
              </Label>
              <div className='relative w-full'>
                <span className='absolute inset-s-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                  {t('common.currency')}
                </span>
                <Input
                  id='expense-amount'
                  type='number'
                  min={1}
                  max={INPUT_LIMITS.amountRupeesMax}
                  step='any'
                  placeholder={t('common.amountPlaceholder')}
                  value={amountStr}
                  onChange={handleAmountChange}
                  onKeyDown={(e) => blockInvalidNumberKeys(e)}
                  disabled={recordMutation.isPending}
                  className={cn(
                    'h-10 ps-9 text-sm font-normal text-foreground w-full',
                    errors.amount && 'border-destructive'
                  )}
                  aria-invalid={!!errors.amount}
                  required
                />
              </div>
              <DialogFieldError id='expense-amount-error' message={errors.amount} />
            </div>

            <div className='space-y-1.5 w-full'>
              <Label htmlFor='expense-date' className='text-sm font-normal text-foreground'>
                {t('expenses.expenseDate')} <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='expense-date'
                type='date'
                value={expenseDate}
                onChange={handleExpenseDateChange}
                disabled={recordMutation.isPending}
                className={cn(
                  'h-10 text-sm font-normal text-foreground w-full cursor-pointer',
                  errors.expenseDate && 'border-destructive'
                )}
                aria-invalid={!!errors.expenseDate}
                required
              />
              <DialogFieldError id='expense-date-error' message={errors.expenseDate} />
            </div>

            <div className='space-y-1.5 w-full'>
              <Label htmlFor='expense-description' className='text-sm font-normal text-foreground'>
                {t('expenses.description')}{' '}
                <span className='text-xs text-muted-foreground'>({t('common.optional')})</span>
              </Label>
              <Textarea
                id='expense-description'
                rows={3}
                placeholder={t('expenses.descriptionPlaceholder')}
                value={description}
                onChange={handleDescriptionChange}
                maxLength={INPUT_LIMITS.notes}
                disabled={recordMutation.isPending}
                className='resize-none text-sm font-normal text-foreground w-full'
              />
            </div>

            {overdraftPrompt && (
              <OverdraftAlert
                variant='banner'
                checked={confirmOverdraft}
                onCheckedChange={handleConfirmOverdraftChange}
                title={t('expenses.shortfallWarningTitle')}
                description={t('expenses.shortfallWarningDesc', {
                  shortfall: formatPkr(overdraftPrompt.shortfall ?? 0)
                })}
                confirmLabel={t('expenses.confirmExpenseOverdraft')}
              />
            )}
            {errors.confirmOverdraft ? (
              <DialogFieldError message={errors.confirmOverdraft} />
            ) : null}

            <DialogFooter className='gap-2 sm:gap-2.5 pt-2'>
              <DialogCancelButton
                onClick={() => onOpenChange(false)}
                disabled={recordMutation.isPending}
              />
              <DialogPrimaryButton
                mode='add'
                loading={recordMutation.isPending}
                disabled={recordMutation.isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}
