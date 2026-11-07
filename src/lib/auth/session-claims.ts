import type { AuthAccountRole } from '@/lib/auth/accounts';

export function readAuthRole(value: unknown): AuthAccountRole | undefined {
  if (
    value === 'SUPER_ADMIN' ||
    value === 'OWNER' ||
    value === 'MANAGER' ||
    value === 'SALESMAN' ||
    value === 'ADMIN'
  ) {
    return value;
  }
  return undefined;
}

export function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function readRequiredString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function extractRoleFromAccessToken(token: string): AuthAccountRole | undefined {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    const json = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      role?: unknown;
    };
    return readAuthRole(json?.role);
  } catch {
    return undefined;
  }
}
