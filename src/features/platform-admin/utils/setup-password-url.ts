import { APP_BASE_URL } from '@/constants/api';

export function resolveSetupPasswordUrl(backendSetupUrl: string): string {
  try {
    const parsed = new URL(backendSetupUrl);
    const origin = typeof window !== 'undefined' ? window.location.origin : APP_BASE_URL;
    return `${origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return backendSetupUrl;
  }
}
