import type { ReactNode } from 'react';
import type { BrandDTO } from '@/lib/api/types';

export interface BrandListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateBrandInput {
  name?: string;
  isActive?: boolean;
}

export type UpdateBrandArg = string | UpdateBrandInput;

export interface BrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: BrandDTO | null;
}

export interface BrandsHeaderActionProps {
  onAdd?: () => void;
}

export interface BrandCellActionProps {
  data: BrandDTO;
}

export interface BrandsTableProps {
  toolbarAction?: ReactNode;
}
