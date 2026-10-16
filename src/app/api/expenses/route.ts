import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

const EXPENSE_FILTER_PARAMS = [
  'page',
  'pageSize',
  'search',
  'categoryId',
  'status',
  'from',
  'to',
  'sortBy',
  'sortOrder'
];

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/expenses', {
    allowedParams: EXPENSE_FILTER_PARAMS
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/expenses');
}
