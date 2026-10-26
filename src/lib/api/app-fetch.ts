import { ApiError, type ApiErrorBody, type ApiResponseBodyError } from '@/lib/api/types';
import { APP_BASE_URL } from '@/constants/api';
import {
  isAccessRevokedError,
  signOutForAccessRevoked
} from '@/lib/auth/access-revoked';
import { signOutForUnauthorized } from '@/lib/auth/force-sign-out';

export async function appFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${APP_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader);
    }
  }

  const res = await fetch(url, { ...init, headers, cache: 'no-store' });

  const text = await res.text();
  let body: (T & ApiResponseBodyError & ApiErrorBody) | null = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const rawMessage =
      body?.message ?? body?.error ?? (text || `Request failed with status ${res.status}`);
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : String(rawMessage);
    if (res.status === 401 && typeof window !== 'undefined') {
      void signOutForUnauthorized();
    } else if (isAccessRevokedError(res.status, body, message)) {
      void signOutForAccessRevoked();
    }
    throw new ApiError(res.status, message, body ?? undefined);
  }

  return (body ?? ({} as T)) as T;
}
