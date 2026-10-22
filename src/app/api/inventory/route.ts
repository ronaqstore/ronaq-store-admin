import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/reports/inventory', {
    allowedParams: [
      'page',
      'pageSize',
      'search',
      'sortBy',
      'sortOrder',
      'trackingType',
      'lowStock',
      'minStockValue',
      'maxStockValue',
      'inStock'
    ]
  });
}
