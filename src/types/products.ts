import type { ReactNode } from 'react';
import type { ProductDTO, ProductImageDTO } from '@/lib/api/types';

export interface ProductImageListResponse {
  items: ProductImageDTO[];
}

export interface ProductImageReorderItem {
  id: string;
  sortOrder: number;
}

export interface ProductImageQueryExtraOptions {
  enabled?: boolean;
}

export interface CreateProductResult {
  id?: string;
  message?: string;
}

export interface CreateProductApiResponse {
  data?: { id?: string };
  id?: string;
  message?: string;
}

export interface PendingProductImageFile {
  id: string;
  file: File;
}

export interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductDTO | null;
}

export interface ProductDialogBodyProps {
  product?: ProductDTO | null;
  onOpenChange: (open: boolean) => void;
}

export interface ProductPhotoManagerProps {
  productId?: string;
  images: ProductImageDTO[];
  onChange: (images: ProductImageDTO[]) => void;
  onAddPendingFile?: (file: File, id: string) => void;
  onRemovePendingFile?: (imageId: string) => void;
}

export interface ProductsHeaderActionProps {
  onAdd?: () => void;
}

export interface ProductCellActionProps {
  data: ProductDTO;
}

export interface ProductImagesFieldProps {
  row: ProductDTO;
}

export interface ProductsTableProps {
  toolbarAction?: ReactNode;
}
