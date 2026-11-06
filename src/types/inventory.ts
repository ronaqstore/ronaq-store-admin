import type { ReactNode } from 'react';
import type {
  DeadStockAgingBucket,
  DeadStockSummaryDto,
  DeadStockUnitItemDto,
  InventoryItemDTO,
  InventoryUnitDTO
} from '@/lib/api/types';

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

export type SerializedUnitsStatusFilter = 'ALL' | 'IN_STOCK' | 'SOLD' | 'DAMAGED_LOST';
export type SerializedUnitsConditionFilter = 'ALL' | 'NEW' | 'USED';

export interface SerializedUnitsFilterOptions {
  statusFilter: SerializedUnitsStatusFilter;
  conditionFilter: SerializedUnitsConditionFilter;
  batteryMin: string;
  search: string;
}

export interface EditInventoryUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: InventoryUnitDTO | DeadStockUnitItemDto | null;
  brandName?: string | null;
}

export interface AgingBucketMeta {
  bucket: DeadStockAgingBucket;
  label: string;
  badgeLabel: string;
  riskLevel: 'fresh' | 'normal' | 'warning' | 'critical';
  isDeadStock: boolean;
  isSlowMoving: boolean;
  borderClass: string;
  bgLightClass: string;
  textClass: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface DeadStockCalculatedMetrics {
  totalInStockUnits: number;
  totalStockValue: number;
  deadStockCount: number;
  deadStockCostValue: number;
  averageDaysOnShelf: number;
  deadStockCountPercent: number;
  deadStockValuePercent: number;
  isHighRisk: boolean;
}

export interface DiscountMarginInfo {
  hasAskingPrice: boolean;
  askingPricePaisa: number;
  unitCostPaisa: number;
  marginPaisa: number;
  marginPercent: number;
  isAboveCost: boolean;
}

export interface WarrantyBadgeInfo {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  detail?: string;
  isActive: boolean;
}

export interface ProfitDisplayInfo {
  hasSold: boolean;
  profitPaisa: number;
  marginPercent: number;
  isProfitable: boolean;
}

export interface DeadStockKpiCardsProps {
  summary?: DeadStockSummaryDto;
  activeBucket: 'ALL' | DeadStockAgingBucket;
  isLoading: boolean;
  onBucketToggle: (bucket: DeadStockAgingBucket) => void;
  onSelectDeadStock: () => void;
}

export interface ImeiSearchDeviceDetailsProps {
  device: import('@/lib/api/types').ImeiDeviceInfoDto;
  intake?: import('@/lib/api/types').ImeiIntakeInfoDto;
  latestSale?: import('@/lib/api/types').ImeiSaleInfoDto | null;
  onCopyImei: (imei: string) => void;
}

export interface RestoreUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  unit: InventoryUnitDTO | null;
}

export interface SerializedProductUnitsDialogsProps {
  productId: string;
  brandName?: string | null;
  productItemDTO: InventoryItemDTO | null;
  adjustOpen: boolean;
  onAdjustOpenChange: (open: boolean) => void;
  selectedUnitIdForAdjust: string;
  selectedUnitLabelForAdjust: string;
  restoreOpen: boolean;
  onRestoreOpenChange: (open: boolean) => void;
  selectedUnitForRestore: InventoryUnitDTO | null;
  editOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  selectedUnitForEdit: InventoryUnitDTO | null;
}

export interface DeadStockPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPagePrevious: () => void;
  onPageNext: () => void;
}
