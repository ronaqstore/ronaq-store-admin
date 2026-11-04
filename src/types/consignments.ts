import type { ReactNode } from 'react';
import type {
  CancelConsignmentInput,
  ConsignmentDTO,
  ConsignmentStatus,
  CustomerDTO,
  ProductDTO,
  ReturnConsignmentInput,
  SettleConsignmentInput
} from '@/lib/api/types';
import type { StatusTone } from '@/components/data-table';
import type { OverdraftPrompt } from '@/types';

export interface ConsignmentsTableProps {
  toolbarAction?: ReactNode;
  onOpenAdd?: () => void;
}

export interface ConsignmentRowActionsProps {
  consignment: ConsignmentDTO;
  onPrintIntakeSlip: (consignment: ConsignmentDTO) => void;
  onPrintSettlementSlip: (consignment: ConsignmentDTO) => void;
  onWhatsAppShare?: (consignment: ConsignmentDTO, type?: 'intake' | 'settlement') => void;
  onReturn: (consignment: ConsignmentDTO) => void;
  onSettle: (consignment: ConsignmentDTO) => void;
  onCancel: (consignment: ConsignmentDTO) => void;
}

export interface ConsignmentIntakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (created: ConsignmentDTO) => void;
  initialProduct?: ProductDTO | null;
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

export interface ReturnConsignmentMutationVariables {
  id: string;
  input: ReturnConsignmentInput;
}

export interface SettleConsignmentMutationVariables {
  id: string;
  input: SettleConsignmentInput;
}

export interface CancelConsignmentMutationVariables {
  id: string;
  input: CancelConsignmentInput;
}

export type SettleConsignmentResult =
  | ConsignmentDTO
  | (OverdraftPrompt & { confirmOverdraft?: boolean });

export interface ConsignmentStatusBadgeProps {
  status: ConsignmentStatus;
}

export interface ConsignmentStatusBadgeConfig {
  tone: StatusTone;
  label: string;
}

export interface ConsignmentSlipModalState {
  open: boolean;
  consignment: ConsignmentDTO | null;
  type: 'intake' | 'settlement';
}

export interface ConsignmentWhatsAppModalState {
  open: boolean;
  consignment: ConsignmentDTO | null;
  type: 'intake' | 'settlement';
}

export interface ConsignmentsHeaderActionProps {
  className?: string;
  onAdd: () => void;
}

export interface ConsignmentConsignorSectionProps {
  customerId: string;
  consignorName: string;
  consignorPhone: string;
  consignorCnic: string;
  errors: Record<string, string>;
  onCustomerSelect: (id: string, customer?: CustomerDTO | null) => void;
  onConsignorNameChange: (val: string) => void;
  onConsignorPhoneChange: (val: string) => void;
  onConsignorCnicChange: (val: string) => void;
  onAddNewCustomerClick?: () => void;
  extraCustomers?: CustomerDTO[];
}

export interface ConsignmentWhatsAppShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consignment: ConsignmentDTO | null;
  type?: 'intake' | 'settlement';
}

export interface ConsignmentWhatsAppOptions {
  consignment: ConsignmentDTO;
  shopName?: string;
  shopPhone?: string;
  type: 'intake' | 'settlement';
}

export interface BuildConsignmentDetailOptions {
  t: (key: string) => string;
  onPrintIntakeSlip: (consignment: ConsignmentDTO) => void;
  onPrintSettlementSlip: (consignment: ConsignmentDTO) => void;
  onSettle: (consignment: ConsignmentDTO) => void;
  onReturn: (consignment: ConsignmentDTO) => void;
  onCancel: (consignment: ConsignmentDTO) => void;
}

export interface ConsignmentTermsSectionProps {
  agreedPayoutRupees: string;
  targetSellingPriceRupees: string;
  intakeDate: string;
  notes: string;
  errors: Record<string, string>;
  onAgreedPayoutChange: (val: string) => void;
  onTargetSellingPriceChange: (val: string) => void;
  onIntakeDateChange: (val: string) => void;
  onNotesChange: (val: string) => void;
}
