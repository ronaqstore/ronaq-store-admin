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
import { Switch } from '@/components/ui/switch';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { cn } from '@/lib/utils';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { useT } from '@/i18n/use-t';
import { createExpenseCategoryMutation, updateExpenseCategoryMutation } from '../api/mutations';
import { expenseKeys } from '../api/queries';
import { listExpenseCategories } from '../api/service';
import type {
  ExpenseCategoryDTO,
  ExpenseCategoryDialogProps,
  ExpenseCategoryDialogBodyProps
} from '@/types/expense';

function ExpenseCategoryDialogBody({
  category,
  onOpenChange,
  onCategoryCreated
}: ExpenseCategoryDialogBodyProps) {
  const t = useT();
  const qc = useQueryClient();
  const isEdit = Boolean(category);

  const [name, setName] = useState(category?.name ?? '');
  const [isActive, setIsActive] = useState(category ? category.isActive : true);
  const [nameError, setNameError] = useState('');

  const createMutation = useMutation({
    ...createExpenseCategoryMutation,
    onSuccess: async () => {
      const message = t('expenses.categoryCreated', { name: name.trim() });
      void qc.invalidateQueries({ queryKey: expenseKeys.all });

      if (onCategoryCreated) {
        try {
          const fresh = await listExpenseCategories({ search: name.trim(), isActive: true });
          const found = fresh.items.find(
            (c: ExpenseCategoryDTO) => c.name.toLowerCase() === name.trim().toLowerCase()
          );
          if (found) {
            onCategoryCreated(found);
          }
        } catch (lookupErr) {
          toast.error(
            lookupErr instanceof Error ? lookupErr.message : t('expenses.categoryCreateFailed')
          );
        }
      }

      onOpenChange(false);
      toastSuccessAfterClose(message);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('expenses.categoryCreateFailed'));
    }
  });

  const updateMutation = useMutation({
    ...updateExpenseCategoryMutation,
    onSuccess: () => {
      const message = t('expenses.categoryUpdated', { name: name.trim() });
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: expenseKeys.all });
      toastSuccessAfterClose(message);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('expenses.categoryUpdateFailed'));
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('expenses.nameRequired'));
      return;
    }
    if (trimmed.length < 2) {
      setNameError(t('expenses.nameMinLength'));
      return;
    }
    setNameError('');

    if (isEdit && category) {
      updateMutation.mutate({
        id: category.id,
        input: {
          name: trimmed,
          isActive
        }
      });
    } else {
      createMutation.mutate({
        name: trimmed,
        isActive
      });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(clampText(e.target.value, INPUT_LIMITS.name));
    setNameError('');
  };

  return (
    <DialogContent className='w-full sm:max-w-md'>
      <DialogHeader>
        <DialogTitle>{isEdit ? t('common.edit') : t('expenses.addCategory')}</DialogTitle>
        <DialogDescription>
          {isEdit ? t('expenses.deactivateDesc', { name }) : t('expenses.recordExpenseDesc')}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='category-name' className='text-sm font-normal text-foreground'>
            {t('expenses.categoryName')} <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='category-name'
            value={name}
            onChange={handleNameChange}
            placeholder={t('expenses.categoryPlaceholder')}
            disabled={isPending}
            className={cn(
              'h-10 text-sm font-normal text-foreground w-full',
              nameError && 'border-destructive'
            )}
            aria-invalid={!!nameError}
            maxLength={INPUT_LIMITS.name}
            autoFocus
            required
          />
          <DialogFieldError id='category-name-error' message={nameError} />
        </div>

        {isEdit && (
          <div className='flex items-center justify-between rounded-lg border border-border p-3'>
            <div className='space-y-0.5'>
              <Label
                htmlFor='category-status'
                className='text-sm font-medium text-foreground cursor-pointer'
              >
                {t('expenses.activeStatus')}
              </Label>
              <p className='text-xs text-muted-foreground'>
                {isActive
                  ? 'Category is active and available for expenses'
                  : 'Category is inactive and hidden from new expense entries'}
              </p>
            </div>
            <Switch
              id='category-status'
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isPending}
            />
          </div>
        )}

        <DialogFooter className='gap-2 sm:gap-2.5 pt-2'>
          <DialogCancelButton onClick={() => onOpenChange(false)} disabled={isPending} />
          <DialogPrimaryButton
            mode={isEdit ? 'edit' : 'add'}
            loading={isPending}
            disabled={isPending}
          />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function ExpenseCategoryDialog({
  open,
  onOpenChange,
  category,
  onCategoryCreated
}: ExpenseCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <ExpenseCategoryDialogBody
          key={category?.id ?? 'new'}
          category={category}
          onOpenChange={onOpenChange}
          onCategoryCreated={onCategoryCreated}
        />
      ) : null}
    </Dialog>
  );
}
