import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/sales', {
    allowedParams: [
      'page',
      'pageSize',
      'search',
      'customerId',
      'status',
      'payStatus',
      'from',
      'to',
      'minTotalAmount',
      'maxTotalAmount',
      'minPaidAmount',
      'maxPaidAmount',
      'minOutstandingAmount',
      'maxOutstandingAmount',
      'sortBy',
      'sortOrder'
    ]
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/sales');
}
