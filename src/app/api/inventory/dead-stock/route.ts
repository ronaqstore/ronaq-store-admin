import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/inventory/dead-stock', {
    allowedParams: ['bucket', 'condition', 'brandId', 'search', 'sortBy', 'page', 'pageSize']
  });
}
