import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/inventory/units', {
    allowedParams: [
      'productId',
      'status',
      'search',
      'condition',
      'batteryMin',
      'page',
      'pageSize'
    ]
  });
}
