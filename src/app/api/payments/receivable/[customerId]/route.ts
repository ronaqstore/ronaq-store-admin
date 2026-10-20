import { NextRequest } from 'next/server';
import { proxyToBackend, type RouteCustomerIdContext } from '@/lib/api/proxy';

export async function GET(request: NextRequest, { params }: RouteCustomerIdContext) {
  const { customerId } = await params;
  return proxyToBackend(request, `/payments/receivable/${customerId}`);
}
