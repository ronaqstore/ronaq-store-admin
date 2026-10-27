import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';
import type { ShopDashboardRouteContext } from '@/types/dashboard';

export async function GET(request: NextRequest, context: ShopDashboardRouteContext) {
  const { slug } = await context.params;
  const path = Array.isArray(slug) ? slug.join('/') : String(slug ?? '');
  return proxyToBackend(request, `/platform/dashboard/${path}`, {
    allowedParams: ['months', 'weeks', 'limit', 'days', 'page', 'pageSize']
  });
}
