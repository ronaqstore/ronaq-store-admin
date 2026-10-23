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
      'payStatus',
      'isOpeningStock',
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
  return proxyToBackend(request, '/purchases');
}
