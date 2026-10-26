import type { AuthAccountRole } from '@/lib/auth/accounts';

export function readAuthRole(value: unknown): AuthAccountRole | undefined {
  if (value === 'SUPER_ADMIN' || value === 'OWNER' || value === 'ADMIN') {
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
