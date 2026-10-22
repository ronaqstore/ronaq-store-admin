import type { QuerySyncDomain } from '@/types/query-sync';

export const SALE_SYNC_DOMAINS = [
  'sales',
  'inventory',
  'products',
  'payments',
  'customers',
  'cash',
  'dashboard'
] as const satisfies readonly QuerySyncDomain[];

export const PURCHASE_SYNC_DOMAINS = [
  'purchases',
  'inventory',
  'products',
  'supplierPayments',
  'suppliers',
  'cash',
  'dashboard'
] as const satisfies readonly QuerySyncDomain[];

export const PAYMENT_SYNC_DOMAINS = [
  'payments',
  'customers',
  'sales',
  'cash',
  'dashboard'
] as const satisfies readonly QuerySyncDomain[];

export const SUPPLIER_PAYMENT_SYNC_DOMAINS = [
  'supplierPayments',
  'suppliers',
  'purchases',
  'cash',
  'dashboard'
] as const satisfies readonly QuerySyncDomain[];

export const EXPENSE_SYNC_DOMAINS = [
  'expenses',
  'cash',
  'dashboard'
] as const satisfies readonly QuerySyncDomain[];

export const EXPENSE_CATEGORY_SYNC_DOMAINS = [
  'expenses'
] as const satisfies readonly QuerySyncDomain[];

export const CASH_SYNC_DOMAINS = [
  'cash',
  'dashboard'
] as const satisfies readonly QuerySyncDomain[];

export const INVENTORY_SYNC_DOMAINS = [
  'inventory',
  'products',
  'dashboard'
] as const satisfies readonly QuerySyncDomain[];

export const PRODUCT_SYNC_DOMAINS = [
  'products',
  'inventory'
] as const satisfies readonly QuerySyncDomain[];

export const CUSTOMER_SYNC_DOMAINS = [
  'customers',
  'payments',
  'sales',
  'dashboard'
] as const satisfies readonly QuerySyncDomain[];

export const SUPPLIER_SYNC_DOMAINS = [
  'suppliers',
  'supplierPayments',
  'purchases',
  'dashboard'
] as const satisfies readonly QuerySyncDomain[];

export const PLATFORM_SYNC_DOMAINS = ['platform'] as const satisfies readonly QuerySyncDomain[];

export const STORE_SETTINGS_SYNC_DOMAINS = [
  'storeSettings'
] as const satisfies readonly QuerySyncDomain[];
