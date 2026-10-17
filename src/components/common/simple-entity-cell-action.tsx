'use client';

import { PartyCellAction } from '@/components/common/party-cell-action';
import type { SimpleEntityCellActionProps } from '@/types/common';

export function SimpleEntityCellAction({
  id,
  isActive,
  deactivateTitle,
  deactivateDescription,
  deactivateSuccess,
  activateSuccess,
  onDeactivate,
  onActivate,
  invalidateQueryKey,
  renderDialog
}: SimpleEntityCellActionProps) {
  return (
    <PartyCellAction
      id={id}
      isActive={isActive}
      deactivateTitle={deactivateTitle}
      deactivateDescription={deactivateDescription}
      deactivateSuccess={deactivateSuccess}
      activateSuccess={activateSuccess}
      onDeactivate={onDeactivate}
      onActivate={onActivate}
      invalidateQueryKey={invalidateQueryKey}
      renderEditDialog={renderDialog}
    />
  );
}
