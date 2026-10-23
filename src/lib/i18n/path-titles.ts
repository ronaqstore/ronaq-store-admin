import { delocalize } from '@/lib/auth/routes';

const PATH_TITLE_KEYS: Record<string, string> = {
  overview: 'pages.dashboard.title',
  products: 'pages.products.title',
  product: 'pages.product.title',
  categories: 'pages.categories.title',
  brands: 'pages.brands.title',
  purchases: 'pages.purchases.title',
  inventory: 'pages.inventory.title',
  'stock-adjustments': 'pages.adjustments.title',
  'inventory-movements': 'pages.movements.title',
  sales: 'pages.sales.title',
  customers: 'pages.customers.title',
  payments: 'pages.payments.title',
  'supplier-payments': 'pages.supplierPayments.title',
  expenses: 'pages.expenses.title',
  'expense-categories': 'pages.expenseCategories.title',
  cash: 'pages.cash.title',
  suppliers: 'pages.suppliers.title',
  appearance: 'pages.appearance.title',
  platform: 'pages.platform.title',
  shops: 'pages.shops.title',
  subscriptions: 'pages.subscriptions.title',
  forms: 'pages.forms.title',
  users: 'pages.users.title',
  'react-query': 'pages.reactQuery.title',
  icons: 'pages.icons.title',
  kanban: 'pages.kanban.title',
  notifications: 'pages.notifications.title'
};

function isDynamicPathSegment(seg: string): boolean {
  return (
    /^\d+$/.test(seg) ||
    seg === 'new' ||
    seg === 'receipt' ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg) ||
    /^[0-9a-f-]{20,}$/i.test(seg)
  );
}

export function pageTitleKeyFromPath(pathname: string): string | null {
  const clean = delocalize(pathname);
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] !== 'dashboard') return null;

  if (parts[1] === 'customers' && parts.length >= 3 && isDynamicPathSegment(parts[2])) {
    return 'pages.customerLedger.title';
  }
  if (parts[1] === 'suppliers' && parts.length >= 3 && isDynamicPathSegment(parts[2])) {
    return 'pages.supplierLedger.title';
  }

  for (let i = parts.length - 1; i >= 1; i--) {
    const seg = parts[i];
    if (isDynamicPathSegment(seg)) continue;
    if (seg in PATH_TITLE_KEYS) return PATH_TITLE_KEYS[seg];
  }
  return 'pages.dashboard.title';
}
