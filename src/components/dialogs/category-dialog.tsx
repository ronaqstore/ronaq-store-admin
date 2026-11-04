'use client';

import { useT } from '@/i18n/use-t';
import { SimpleEntityDialog } from '@/components/common/simple-entity-dialog';
import type { CategoryDialogProps } from '@/types';
import { categoryKeys } from '@/features/categories/api/queries';
import { createCategory, updateCategory } from '@/features/categories/api/service';
import { createCategoryFormSchema } from '@/features/categories/schemas/category-schema';

export function CategoryDialog({ open, onOpenChange, category, onSuccess }: CategoryDialogProps) {
  const t = useT();

  return (
    <SimpleEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      entity={category}
      titleAdd={t('dukaan.category.addTitle')}
      titleEdit={t('dukaan.category.editTitle')}
      descriptionAdd={t('dukaan.category.addDescription')}
      descriptionEdit={t('dukaan.category.editDescription')}
      nameLabel={t('dukaan.party.name')}
      namePlaceholder={t('dukaan.category.namePlaceholder')}
      successCreated={t('dukaan.category.created')}
      successUpdated={t('dukaan.category.updated')}
      onSave={(id, name) => (id ? updateCategory(id, name) : createCategory(name))}
      invalidateQueryKey={categoryKeys.all}
      schema={createCategoryFormSchema(t)}
      onSuccess={(created) => onSuccess?.(created as never)}
    />
  );
}
