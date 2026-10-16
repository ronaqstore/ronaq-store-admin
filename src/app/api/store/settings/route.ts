import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/store/settings');
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, '/store/settings');
}
