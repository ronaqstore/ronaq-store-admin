import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/store/settings/banner', {
    forwardFormData: true
  });
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, '/store/settings/banner', {
    method: 'DELETE'
  });
}
