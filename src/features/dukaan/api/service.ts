import { apiRequest } from '@/lib/api/client';
import { appFetch } from '@/lib/api/app-fetch';
import type {
  AttentionResponse,
  CashFlowResponse,
  DashboardRangeParams,
  ExpensesByCategoryResponse,
  InventoryAgingResponse,
  ProfitWaterfallResponse,
  ReceivablesAgingResponse,
  SalesMixResponse,
  SalesTrendResponse,
  ShopKpisResponse,
  TopProductsParams,
  TopProductsResponse,
} from '@/types/dashboard';

function buildParams(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      sp.set(key, String(val));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function fetchShopEndpoint<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  token?: string,
): Promise<T> {
  const qs = buildParams(params);
  const path = `/dashboard/shop/${endpoint}${qs}`;
  if (token) {
    return apiRequest<T>(path, undefined, token);
  }
  return appFetch<T>(`/api${path}`);
}

export async function getShopKpis(
  params?: DashboardRangeParams,
  token?: string,
): Promise<ShopKpisResponse> {
  return fetchShopEndpoint<ShopKpisResponse>('kpis', params, token);
}

export async function getShopSalesTrend(
  params?: DashboardRangeParams,
  token?: string,
): Promise<SalesTrendResponse> {
  return fetchShopEndpoint<SalesTrendResponse>('sales-trend', params, token);
}

export async function getShopProfitWaterfall(
  params?: DashboardRangeParams,
  token?: string,
): Promise<ProfitWaterfallResponse> {
  return fetchShopEndpoint<ProfitWaterfallResponse>(
    'profit-waterfall',
    params,
    token,
  );
}

export async function getShopCashFlow(
  params?: DashboardRangeParams,
  token?: string,
): Promise<CashFlowResponse> {
  return fetchShopEndpoint<CashFlowResponse>('cash-flow', params, token);
}

export async function getShopReceivablesAging(
  token?: string,
): Promise<ReceivablesAgingResponse> {
  return fetchShopEndpoint<ReceivablesAgingResponse>(
    'receivables-aging',
    undefined,
    token,
  );
}

export async function getShopTopProducts(
  params?: TopProductsParams,
  token?: string,
): Promise<TopProductsResponse> {
  return fetchShopEndpoint<TopProductsResponse>('top-products', params, token);
}

export async function getShopSalesMix(
  params?: DashboardRangeParams,
  token?: string,
): Promise<SalesMixResponse> {
  return fetchShopEndpoint<SalesMixResponse>('sales-mix', params, token);
}

export async function getShopExpensesByCategory(
  params?: DashboardRangeParams,
  token?: string,
): Promise<ExpensesByCategoryResponse> {
  return fetchShopEndpoint<ExpensesByCategoryResponse>(
    'expenses-by-category',
    params,
    token,
  );
}

export async function getShopInventoryAging(
  token?: string,
): Promise<InventoryAgingResponse> {
  return fetchShopEndpoint<InventoryAgingResponse>(
    'inventory-aging',
    undefined,
    token,
  );
}

export async function getShopAttention(
  token?: string,
): Promise<AttentionResponse> {
  return fetchShopEndpoint<AttentionResponse>('attention', undefined, token);
}
