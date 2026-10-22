import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/platform-admin/shops', {
    allowedParams: [
      'page',
      'pageSize',
      'search',
      'accessStatus',
      'subscriptionFrom',
      'subscriptionTo',
      'createdFrom',
      'createdTo',
      'sortBy',
      'sortOrder'
    ]
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/platform-admin/shops');
}
