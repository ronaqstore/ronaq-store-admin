'use client';

import { PartyCellAction } from '@/components/common/party-cell-action';
import type { SimpleEntityCellActionProps } from '@/types/common';

export function SimpleEntityCellAction({
  id,
  isActive,
  editHref,
  deactivateTitle,
  deactivateDescription,
  deactivateSuccess,
  activateTitle,
  activateDescription,
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
      editHref={editHref}
      deactivateTitle={deactivateTitle}
      deactivateDescription={deactivateDescription}
      deactivateSuccess={deactivateSuccess}
      activateTitle={activateTitle}
      activateDescription={activateDescription}
      activateSuccess={activateSuccess}
      onDeactivate={onDeactivate}
      onActivate={onActivate}
      invalidateQueryKey={invalidateQueryKey}
      renderEditDialog={renderDialog}
    />
  );
}
