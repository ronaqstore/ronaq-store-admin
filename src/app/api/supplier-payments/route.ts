import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

const SUPPLIER_PAYMENT_FILTER_PARAMS = [
  'page',
  'pageSize',
  'search',
  'supplierId',
  'purchaseId',
  'purchaseNo',
  'notes',
  'minAmount',
  'maxAmount',
  'status',
  'from',
  'to',
  'sortBy',
  'sortOrder'
];

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/supplier-payments', {
    allowedParams: SUPPLIER_PAYMENT_FILTER_PARAMS
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/supplier-payments');
}
