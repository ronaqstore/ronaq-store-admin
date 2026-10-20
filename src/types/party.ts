import type { ReactNode } from 'react';
import type { FormNumber } from './common';

export interface BasePartyRecord {
  id: string;
  name: string;
  phone?: string | null;
  cnic?: string | null;
  address?: string | null;
  notes?: string | null;
  openingBalance: number;
  currentBalance?: number;
  isActive: boolean;
  createdAt: string;
}

export interface PartyDetailLabels {
  partyName: string;
  balance: string;
  openingBalance: string;
  currentBalance?: string;
}

export interface PartyNameColumnOptions<T extends { name: string }> {
  placeholderKey?: string;
  size?: number;
  cellExtra?: (row: T) => ReactNode;
}

export type PartyApiField = 'phone' | 'cnic';

export interface MappedPartyApiError {
  field?: PartyApiField;
  message: string;
}

export type PartyErrorTranslator = (key: string) => string;

export interface BasePartyEntity {
  id: string;
  name: string;
  phone?: string | null;
  cnic?: string | null;
  address?: string | null;
  notes?: string | null;
  openingBalance: number;
  isSystem?: boolean;
}

export interface BasePartyPayload {
  name: string;
  phone?: string;
  cnic?: string;
  address?: string;
  notes?: string;
  openingBalance: number;
  isActive: boolean;
}

export interface BasePartyFormState {
  name: string;
  phone?: string;
  cnic?: string;
  address?: string;
  notes?: string;
  opening_balance: FormNumber;
}

export interface BasePartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party?: BasePartyEntity | null;
  titleAdd: string;
  titleEdit: string;
  descriptionAdd: string;
  descriptionEdit: string;
  openingBalanceLabel: string;
  namePlaceholder?: string;
  successCreated: string;
  successUpdated: string;
  primaryButtonMode?: 'add' | 'edit' | 'save';
  showCnic?: boolean;
  onSave: (payload: BasePartyPayload, id?: string) => Promise<unknown>;
  invalidateQueryKey: readonly unknown[];
  schema?: unknown;
}

export interface BasePartyDialogBodyProps extends BasePartyDialogProps {}

export interface PartyCellActionProps {
  id: string;
  isActive: boolean;
  isSystem?: boolean;
  ledgerHref?: string;
  editHref?: string;
  deactivateTitle: string;
  deactivateDescription: string;
  deactivateConfirmLabel?: string;
  deactivateSuccess: string;
  activateTitle: string;
  activateDescription: string;
  activateConfirmLabel?: string;
  activateSuccess: string;
  onDeactivate: (id: string) => Promise<unknown>;
  onActivate: (id: string) => Promise<unknown>;
  invalidateQueryKey: readonly unknown[];
  renderEditDialog?: (open: boolean, onOpenChange: (open: boolean) => void) => ReactNode;
}
