'use client';

import { useT } from '@/i18n/use-t';
import { SimpleEntityDialog } from '@/components/common/simple-entity-dialog';
import type { BrandDialogProps } from '@/types';
import { brandKeys } from '@/features/brands/api/queries';
import { createBrand, updateBrand } from '@/features/brands/api/service';
import { createBrandFormSchema } from '@/features/brands/schemas/brand-schema';

export function BrandDialog({ open, onOpenChange, brand, onSuccess }: BrandDialogProps) {
  const t = useT();

  return (
    <SimpleEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      entity={brand}
      titleAdd={t('dukaan.brand.addTitle')}
      titleEdit={t('dukaan.brand.editTitle')}
      descriptionAdd={t('dukaan.brand.addDescription')}
      descriptionEdit={t('dukaan.brand.editDescription')}
      nameLabel={t('dukaan.party.name')}
      namePlaceholder={t('dukaan.brand.namePlaceholder')}
      successCreated={t('dukaan.brand.created')}
      successUpdated={t('dukaan.brand.updated')}
      onSave={(id, name) => (id ? updateBrand(id, name) : createBrand(name))}
      invalidateQueryKey={brandKeys.all}
      schema={createBrandFormSchema(t)}
      onSuccess={(created) => onSuccess?.(created as never)}
    />
  );
}
