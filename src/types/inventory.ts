import type { ReactNode } from 'react';
import type { InventoryItemDTO, InventoryUnitDTO } from '@/lib/api/types';

export interface InventoryStockFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  productId?: string;
  sortBy?: 'name' | 'inStock' | 'stockValue';
  sortOrder?: 'asc' | 'desc';
  trackingType?: 'QUANTITY' | 'SERIALIZED';
  lowStock?: boolean | string;
  minStockValue?: number;
  maxStockValue?: number;
  inStock?: number;
}

export interface InventoryStockValueRangeFilter {
  minStockValue?: number;
  maxStockValue?: number;
}

export interface ListInventoryUnitsExtraOptions {
  condition?: 'NEW' | 'USED';
  batteryMin?: number;
}

export interface InventoryUnitsListFilters {
  page?: number;
  pageSize?: number;
}

export type InventoryLedgerScope = 'manual' | 'all';

export type InventoryMovementTypeFilter =
  | 'ADJUSTMENT'
  | 'DAMAGED'
  | 'LOST'
  | 'PURCHASE'
  | 'SALE'
  | 'SALE_CANCEL'
  | 'PURCHASE_CANCEL'
  | 'CUSTOMER_RETURN';

export interface InventoryAdjustmentsFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  productId?: string;
  type?: InventoryMovementTypeFilter;
  quantityChange?: number;
  reason?: string;
  scope?: InventoryLedgerScope;
  from?: string;
  to?: string;
  sortBy?: 'createdAt' | 'quantityChange';
  sortOrder?: 'asc' | 'desc';
}

export type AdjustmentsTableMode = 'adjustments' | 'movements';

export interface AdjustmentsTableProps {
  toolbarAction?: ReactNode;
  mode?: AdjustmentsTableMode;
}

export interface InventoryRowActionsProps {
  item: InventoryItemDTO;
  onAdjust: (item: InventoryItemDTO) => void;
  onViewUnits?: (item: InventoryItemDTO) => void;
}

export interface InventoryTableProps {
  toolbarAction?: ReactNode;
}

export interface StockAdjustProductOption {
  id: string;
  name: string;
  productName: string;
  trackingType: 'QUANTITY' | 'SERIALIZED';
  inStock: number;
}

export interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProduct?: InventoryItemDTO | null;
  initialUnitId?: string;
  initialUnitLabel?: string;
}

export interface StockAdjustFormErrors {
  productId?: string;
  reason?: string;
  imei?: string;
  quantity?: string;
}

export interface SerializedProductUnitsPageProps {
  productId: string;
}

export interface SerializedUnitsListProps {
  units: InventoryUnitDTO[];
  copiedImei: string | null;
  onCopyImei: (imei: string) => void;
  onOpenWriteOff: (unitId: string, imeiLabel: string) => void;
  onOpenRestore?: (unit: InventoryUnitDTO) => void;
  onOpenEdit?: (unit: InventoryUnitDTO) => void;
}

export interface SerializedUnitsKpiCardsProps {
  totalCount: number;
  inStockCount: number;
  soldCount: number;
  damagedCount: number;
  totalStockValue: number;
  avgUnitCost: number;
}
