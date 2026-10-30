'use client';

import { StockAdjustDialog } from './stock-adjust-dialog';
import { RestoreUnitDialog } from './restore-unit-dialog';
import { EditInventoryUnitDialog } from './edit-inventory-unit-dialog';
import type { SerializedProductUnitsDialogsProps } from '@/types/inventory';

export function SerializedProductUnitsDialogs({
  productId,
  brandName,
  productItemDTO,
  adjustOpen,
  onAdjustOpenChange,
  selectedUnitIdForAdjust,
  selectedUnitLabelForAdjust,
  restoreOpen,
  onRestoreOpenChange,
  selectedUnitForRestore,
  editOpen,
  onEditOpenChange,
  selectedUnitForEdit
}: SerializedProductUnitsDialogsProps) {
  return (
    <>
      {adjustOpen && productItemDTO ? (
        <StockAdjustDialog
          open={adjustOpen}
          onOpenChange={onAdjustOpenChange}
          initialProduct={productItemDTO}
          initialUnitId={selectedUnitIdForAdjust}
          initialUnitLabel={selectedUnitLabelForAdjust}
        />
      ) : null}

      <RestoreUnitDialog
        open={restoreOpen}
        onOpenChange={onRestoreOpenChange}
        productId={productId}
        unit={selectedUnitForRestore}
      />

      <EditInventoryUnitDialog
        open={editOpen}
        onOpenChange={onEditOpenChange}
        unit={selectedUnitForEdit}
        brandName={brandName}
      />
    </>
  );
}
