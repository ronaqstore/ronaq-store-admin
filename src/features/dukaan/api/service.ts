import { apiRequest } from '@/lib/api/client';
import { appFetch } from '@/lib/api/app-fetch';
import type { DashboardKpis } from '@/lib/dukaan/types';
import type { DashboardApiResponse } from '@/types/dashboard';

function mapDashboard(dto: DashboardApiResponse): DashboardKpis {
  return {
    today_sales: dto.todaySales,
    today_net_profit: dto.todayNetProfit,
    customer_udhar: dto.customerUdhar,
    supplier_payable: dto.supplierPayable,
    today_expenses: dto.todayExpenses,
    low_stock_count: dto.lowStockProducts,
    cash_position: dto.cashPosition
  };
}

export async function getDashboardKpis(
  period: 'today' = 'today',
  token?: string
): Promise<DashboardKpis> {
  const path = `/dashboard?period=${period}`;
  const dto = token
    ? await apiRequest<DashboardApiResponse>(path, undefined, token)
    : await appFetch<DashboardApiResponse>(`/api${path}`);
  return mapDashboard(dto);
}
