import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';
import type { PaymentCreateBody } from '@/types/payment';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/payments', {
    allowedParams: [
      'page',
      'pageSize',
      'search',
      'customerId',
      'saleId',
      'receiptGroupId',
      'status',
      'from',
      'to',
      'sortBy',
      'sortOrder'
    ]
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as PaymentCreateBody;
  let upstreamNotes = body.notes;
  let upstreamMethod = body.method;

  if (body.method && body.method !== 'CASH') {
    const methodLabels: Record<string, string> = {
      JAZZCASH: 'JazzCash',
      EASYPAISA: 'EasyPaisa',
      BANK: 'Bank Transfer',
      BANK_TRANSFER: 'Bank Transfer'
    };
    const label = methodLabels[body.method] ?? body.method;
    upstreamNotes = upstreamNotes ? `[Method: ${label}] ${upstreamNotes}` : `[Method: ${label}]`;
    upstreamMethod = 'CASH';
  }

  const payload: PaymentCreateBody = {
    ...body,
    method: upstreamMethod,
    ...(upstreamNotes !== undefined ? { notes: upstreamNotes } : {})
  };

  return proxyToBackend(request, '/payments', { body: payload });
}
