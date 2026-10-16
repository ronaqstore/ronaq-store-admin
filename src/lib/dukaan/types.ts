export type SessionRole = 'OWNER' | 'ADMIN' | 'SUPER_ADMIN';

export interface ListFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  status?: string;
  category_id?: string;
  brand_id?: string;
  tracking_type?: string;
  type?: string;
  direction?: string;
  method?: string;
  low_stock?: string;
  is_active?: string;
  udhar_state?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardKpis {
  today_sales: number;
  today_net_profit: number;
  customer_udhar: number;
  supplier_payable: number;
  today_expenses: number;
  low_stock_count: number;
  cash_position: number;
}
