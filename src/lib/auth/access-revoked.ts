import type { ApiErrorBody } from '@/lib/api/types';
import { forceSignOut } from '@/lib/auth/force-sign-out';

const ACCESS_REVOKED_ERRORS = new Set(['Shop is suspended', 'User account is disabled']);

function collectText(body?: ApiErrorBody | null, fallbackMessage?: string): string {
  const parts: string[] = [];
  if (body?.error) parts.push(String(body.error));
  if (Array.isArray(body?.message)) {
    parts.push(...body.message.map(String));
  } else if (typeof body?.message === 'string') {
    parts.push(body.message);
  }
  if (fallbackMessage) parts.push(fallbackMessage);
  return parts.join(' ').toLowerCase();
}

export function isSubscriptionEndedError(
  statusCode: number,
  body?: ApiErrorBody | null,
  message?: string
): boolean {
  if (statusCode !== 403) return false;
  const text = collectText(body, message);
  return text.includes('subscription has ended');
}

export function isAccessRevokedError(
  statusCode: number,
  body?: ApiErrorBody | null,
  message?: string
): boolean {
  if (statusCode !== 403) return false;
  if (body?.error && ACCESS_REVOKED_ERRORS.has(body.error)) return true;
  const text = collectText(body, message);
  return (
    text.includes('shop is suspended') ||
    text.includes('subscription has ended') ||
    text.includes('user account is disabled') ||
    text.includes('been suspended')
  );
}

export async function signOutForSubscriptionExpired(): Promise<void> {
  let shopParam = '';
  if (typeof window !== 'undefined') {
    try {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      if (session?.user?.shopName) {
        shopParam = `?shop=${encodeURIComponent(session.user.shopName)}`;
      }
    } catch {
      // ignore
    }
  }
  await forceSignOut(`/subscription-expired${shopParam}`);
}

export async function signOutForAccessRevoked(): Promise<void> {
  await forceSignOut('/login?reason=suspended');
}
