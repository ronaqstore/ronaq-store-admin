import type { TrackingType } from '@/lib/api/types';
import type { ListFilters } from '@/lib/dukaan';

export type PickerFetchFilters = ListFilters;

export interface ProductPickerItem {
  id: string;
  name: string;
  is_active: boolean;
  tracking_type: TrackingType;
  default_selling_price: number;
  default_purchase_price: number;
}

export interface SupplierPickerItem {
  id: string;
  name: string;
  is_active: boolean;
}

