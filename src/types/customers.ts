import type { ReactNode } from 'react';
import type { CustomerDTO } from '@/lib/api/types';

export interface CustomerListFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'phone' | 'isActive' | 'openingBalance' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  openingBalance?: number;
  isActive?: boolean;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  openingBalance?: number;
  isActive?: boolean;
}

export interface CustomerMutationResult {
  status: boolean;
  message: string;
}

export interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerDTO | null;
}

export interface CustomerCellActionProps {
  data: CustomerDTO;
}

export interface CustomersTableProps {
  toolbarAction?: ReactNode;
}

export interface CustomersHeaderActionProps {
  onAdd?: () => void;
}

export interface CustomerLedgerClientProps {
  id: string;
}

export interface CustomerLedgerEntryDTO {
  id: string;
  type: string;
  date: string;
  reference?: string | null;
  notes?: string | null;
  amount: number;
  delta: number;
  balance: number;
  status: string;
}

export interface CustomerLedgerDTO {
  customerId: string;
  customerName: string;
  openingBalance: number;
  balance: number;
  page: number;
  pageSize: number;
  total: number;
  items: CustomerLedgerEntryDTO[];
}

export interface CustomerLedgerView {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  openingBalance: number;
  udhar: number;
  ledger: Array<{
    id: string;
    date: string;
    type: string;
    reference?: string | null;
    status?: string;
    label: string;
    amount: number;
    running_balance: number;
  }>;
}

