import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/cash-reconciliations', {
    allowedParams: ['page', 'pageSize', 'search', 'from', 'to', 'sortBy', 'sortOrder']
  });
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  if (json && typeof json === 'object') {
    const { clientRequestId, countedCash, reason, notes } = json as Record<string, unknown>;
    const body: Record<string, unknown> = {
      clientRequestId,
      countedCash
    };
    const effectiveReason = reason ?? notes;
    if (effectiveReason !== undefined) {
      body.reason = effectiveReason;
    }
    return proxyToBackend(request, '/cash-reconciliations', { body });
  }
  return proxyToBackend(request, '/cash-reconciliations');
}
