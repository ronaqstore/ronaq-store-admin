import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/consignments', {
    allowedParams: [
      'page',
      'pageSize',
      'search',
      'status',
      'customerId',
      'productId',
      'fromDate',
      'toDate',
      'startDate',
      'endDate',
      'sortOrder'
    ]
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/consignments');
}
