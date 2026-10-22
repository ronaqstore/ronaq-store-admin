import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/customers', {
    allowedParams: [
      'page',
      'pageSize',
      'search',
      'phone',
      'address',
      'minOpeningBalance',
      'maxOpeningBalance',
      'minCurrentBalance',
      'maxCurrentBalance',
      'isActive',
      'sortBy',
      'sortOrder'
    ]
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/customers');
}
