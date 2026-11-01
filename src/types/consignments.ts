import type { ReactNode } from 'react';
import type { ConsignmentDTO } from '@/lib/api/types';

export interface ConsignmentsTableProps {
  toolbarAction?: ReactNode;
  onOpenAdd?: () => void;
}

export interface ConsignmentRowActionsProps {
  consignment: ConsignmentDTO;
  onPrintIntakeSlip: (consignment: ConsignmentDTO) => void;
  onPrintSettlementSlip: (consignment: ConsignmentDTO) => void;
  onReturn: (consignment: ConsignmentDTO) => void;
  onSettle: (consignment: ConsignmentDTO) => void;
  onCancel: (consignment: ConsignmentDTO) => void;
}

export interface ConsignmentIntakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (created: ConsignmentDTO) => void;
}

export interface ReturnConsignmentDialogProps {
  consignment: ConsignmentDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface SettleConsignmentDialogProps {
  consignment: ConsignmentDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (settled: ConsignmentDTO) => void;
}

export interface CancelConsignmentDialogProps {
  consignment: ConsignmentDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface ConsignmentSlipDialogProps {
  consignment: ConsignmentDTO | null;
  type: 'intake' | 'settlement';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface ConsignmentsListClientProps {
  defaultOpenAdd?: boolean;
}
