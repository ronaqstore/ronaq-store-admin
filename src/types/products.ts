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

export interface ProductFormPageProps {
  productId?: string;
}

export interface ProductFormBodyProps {
  productId?: string;
  product: ProductDTO | null;
}

export interface EditProductPageParams {
  id: string;
}

export interface EditProductPageProps {
  params: Promise<EditProductPageParams>;
}

export interface ProductFormSidebarLabels {
  images: string;
  onlineStoreSettings: string;
  add: string;
  save: string;
  cancel: string;
}

export interface ProductFormSidebarFields {
  isPublished: ReactNode;
  publicDescription: ReactNode;
}

export interface ProductFormSidebarProps {
  productId?: string;
  images: ProductImageDTO[];
  onImagesChange: (images: ProductImageDTO[]) => void;
  onAddPendingFile: (file: File, id: string) => void;
  onRemovePendingFile: (id: string) => void;
  saving: boolean;
  isEdit: boolean;
  onCancel: () => void;
  labels: ProductFormSidebarLabels;
  fields: ProductFormSidebarFields;
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

export interface ProductSellingPriceRangeFilter {
  minSellingPrice?: number;
  maxSellingPrice?: number;
}

export interface PtaOptionsArgs {
  apple?: boolean;
}

export interface ProductFormValues {
  name: string;
  categoryId: string;
  brandId: string;
  trackingType: 'QUANTITY' | 'SERIALIZED';
  model?: string | null;
  color?: string | null;
  ram?: string | null;
  storage?: string | null;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  defaultPurchasePrice?: number | '' | null;
  defaultSellingPrice?: number | '' | null;
  lowStockThreshold?: number | '' | null;
  isActive?: boolean;
  isPublished?: boolean;
  publicDescription?: string | null;
  ptaStatus?: 'PTA_APPROVED' | 'NON_PTA' | 'JV' | 'BYPASS' | 'MDM_BYPASS' | null;
  authenticity?: 'ORIGINAL' | 'COPY' | '' | null;
}
