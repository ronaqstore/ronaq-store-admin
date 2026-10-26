'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPkr } from '@/lib/dukaan/numbers';
import { dashboardQueryOptions } from '../api/queries';
import { productsQueryOptions } from '@/features/products/api/queries';
import { authMeQueryOptions } from '@/features/auth/api/queries';
import { ShopVisibilityAlerts } from './shop-visibility-alerts';
import { useT } from '@/i18n/use-t';
import type { DashboardKpiLink } from '@/types/dukaan';

const KPI_LINKS: DashboardKpiLink[] = [
  { key: 'today_sales', labelKey: 'dashboard.todaySales', href: '/dashboard/sales' },
  { key: 'today_net_profit', labelKey: 'dashboard.todayNetProfit', href: '/dashboard/overview' },
  { key: 'customer_udhar', labelKey: 'dashboard.customerUdhar', href: '/dashboard/customers' },
  { key: 'supplier_payable', labelKey: 'dashboard.supplierPayable', href: '/dashboard/suppliers' },
  { key: 'today_expenses', labelKey: 'dashboard.todayExpenses', href: '/dashboard/expenses' },
  { key: 'low_stock_count', labelKey: 'dashboard.lowStock', href: '/dashboard/inventory' },
  { key: 'cash_position', labelKey: 'dashboard.cashPosition', href: '/dashboard/cash' }
];

export function DukaanDashboard() {
  const t = useT();
  const { data: session } = useSession();
  const { data: kpis } = useSuspenseQuery(dashboardQueryOptions());
  const { data: publishedProducts } = useSuspenseQuery(
    productsQueryOptions({
      page: 1,
      pageSize: 1,
      isPublished: true,
      isActive: true
    })
  );
  const { data: me } = useQuery({
    ...authMeQueryOptions(),
    enabled: Boolean(session?.user?.role) && session?.user?.role !== 'SUPER_ADMIN',
    staleTime: 60_000
  });
  const userName = session?.user?.name ?? '';
  const shopName = session?.user?.shopName ?? '';
  const firstName = userName.split(' ')[0] || userName || t('user.user');
  const subscriptionEndsAt =
    me?.shop?.subscriptionEndsAt ?? session?.user?.subscriptionEndsAt ?? null;

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>
          {t('dashboard.hi', { name: firstName })}
        </h2>
        <p className='text-muted-foreground text-sm'>
          {t('dashboard.snapshot', { shop: shopName })}
        </p>
      </div>

      <ShopVisibilityAlerts
        publishedProductTotal={publishedProducts.total ?? 0}
        subscriptionEndsAt={subscriptionEndsAt}
      />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {KPI_LINKS.map((item) => {
          const value = kpis[item.key];
          const label = t(item.labelKey);
          const display = item.key === 'low_stock_count' ? String(value) : formatPkr(value);
          return (
            <Link
              key={item.key}
              href={item.href}
              className='block'
              aria-label={`${label}: ${display}`}
            >
              <Card className='hover:bg-muted/40 cursor-pointer transition-colors'>
                <CardHeader>
                  <CardDescription>{label}</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums'>{display}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
