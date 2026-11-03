'use client';

import { PartyCellAction } from '@/components/common/party-cell-action';
import type { SimpleEntityCellActionProps } from '@/types/common';

export function SimpleEntityCellAction({
  id,
  isActive,
  editHref,
  deactivateTitle,
  deactivateDescription,
  deactivateConfirmLabel,
  deactivateSuccess,
  activateTitle,
  activateDescription,
  activateConfirmLabel,
  activateSuccess,
  onDeactivate,
  onActivate,
  invalidateQueryKey,
  renderDialog,
  extraActions
}: SimpleEntityCellActionProps) {
  return (
    <PartyCellAction
      id={id}
      isActive={isActive}
      editHref={editHref}
      deactivateTitle={deactivateTitle}
      deactivateDescription={deactivateDescription}
      deactivateConfirmLabel={deactivateConfirmLabel}
      deactivateSuccess={deactivateSuccess}
      activateTitle={activateTitle}
      activateDescription={activateDescription}
      activateConfirmLabel={activateConfirmLabel}
      activateSuccess={activateSuccess}
      onDeactivate={onDeactivate}
      onActivate={onActivate}
      invalidateQueryKey={invalidateQueryKey}
      renderEditDialog={renderDialog}
      extraActions={extraActions}
    />
  );
}
