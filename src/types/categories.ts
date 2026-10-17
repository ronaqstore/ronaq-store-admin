import type { ReactNode } from 'react';
import type { CategoryDTO } from '@/lib/api/types';

export interface CategoryListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateCategoryInput {
  name?: string;
  isActive?: boolean;
}

export type UpdateCategoryArg = string | UpdateCategoryInput;

export interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryDTO | null;
}

export interface CategoriesHeaderActionProps {
  onAdd?: () => void;
}

export interface CategoryCellActionProps {
  data: CategoryDTO;
}

export interface CategoriesTableProps {
  toolbarAction?: ReactNode;
}
