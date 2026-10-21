import type { ReactNode } from 'react';
import type { SupplierDTO } from '@/lib/api/types';

export interface SupplierListFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'phone' | 'createdAt' | 'updatedAt' | 'openingBalance';
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierDTO | null;
}

export interface SuppliersHeaderActionProps {
  onAdd?: () => void;
}

export interface SupplierCellActionProps {
  data: SupplierDTO;
}

export interface SuppliersTableProps {
  toolbarAction?: ReactNode;
}

export interface SupplierLedgerClientProps {
  id: string;
}

export interface SupplierLedgerEntryDTO {
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

export interface SupplierLedgerDTO {
  supplierId: string;
  supplierName: string;
  openingBalance: number;
  balance: number;
  page: number;
  pageSize: number;
  total: number;
  items: SupplierLedgerEntryDTO[];
}

export interface SupplierLedgerView {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  openingBalance: number;
  payable: number;
  ledger: Array<{
    id: string;
    date: string;
    type: string;
    reference?: string | null;
    status?: string;
    amount: number;
    running_balance: number;
  }>;
}
