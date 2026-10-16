import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/purchases', {
    allowedParams: [
      'page',
      'pageSize',
      'search',
      'supplierId',
      'status',
      'isOpeningStock',
      'from',
      'to',
      'sortBy',
      'sortOrder'
    ]
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/purchases');
}
