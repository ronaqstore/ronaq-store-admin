import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

import type { ShopDashboardRouteContext } from '@/types/dashboard';

export async function GET(
  request: NextRequest,
  context: ShopDashboardRouteContext,
) {
  const { slug } = await context.params;
  const subpath = slug.join('/');
  return proxyToBackend(request, `/dashboard/shop/${subpath}`, {
    allowedParams: [
      'period',
      'from',
      'to',
      'compare',
      'granularity',
      'metric',
      'limit',
    ],
  });
}
