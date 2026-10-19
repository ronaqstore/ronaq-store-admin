import type { ReactNode } from 'react';
import type { InventoryItemDTO, InventoryUnitDTO } from '@/lib/api/types';

export interface InventoryStockFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'inStock' | 'stockValue' | 'trackingType' | 'lowStock';
  sortOrder?: 'asc' | 'desc';
  trackingType?: 'QUANTITY' | 'SERIALIZED';
  lowStock?: boolean | string;
}

export interface ListInventoryUnitsExtraOptions {
  condition?: 'NEW' | 'USED';
  batteryMin?: number;
}

export interface InventoryAdjustmentsFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  productId?: string;
  type?: 'ADJUSTMENT' | 'DAMAGED' | 'LOST';
  from?: string;
  to?: string;
  sortBy?: 'createdAt' | 'quantityChange';
  sortOrder?: 'asc' | 'desc';
}

export interface AdjustmentsTableProps {
  toolbarAction?: ReactNode;
}

export interface InventoryRowActionsProps {
  item: InventoryItemDTO;
  onAdjust: (item: InventoryItemDTO) => void;
  onViewUnits?: (item: InventoryItemDTO) => void;
}

export interface InventoryTableProps {
  toolbarAction?: ReactNode;
}

export interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProduct?: InventoryItemDTO | null;
  initialImei?: string;
}

export interface StockAdjustFormErrors {
  productId?: string;
  reason?: string;
  imei?: string;
}

export interface SerializedProductUnitsPageProps {
  productId: string;
}

export interface SerializedUnitsListProps {
  units: InventoryUnitDTO[];
  copiedImei: string | null;
  onCopyImei: (imei: string) => void;
  onOpenWriteOff: (imei: string) => void;
}

export interface SerializedUnitsKpiCardsProps {
  totalCount: number;
  inStockCount: number;
  soldCount: number;
  damagedCount: number;
  totalStockValue: number;
  avgUnitCost: number;
}
