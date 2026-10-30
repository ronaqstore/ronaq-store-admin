import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/payments', {
    allowedParams: [
      'page',
      'pageSize',
      'search',
      'customerId',
      'saleId',
      'receiptGroupId',
      'method',
      'minAmount',
      'maxAmount',
      'status',
      'from',
      'to',
      'sortBy',
      'sortOrder'
    ]
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/payments', {
    body: await request.json().catch(() => ({}))
  });
}
