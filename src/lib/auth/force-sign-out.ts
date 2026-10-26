let signingOut = false;

export function isJwtExpiredOrInvalid(token?: string | null): boolean {
  if (!token) return true;
  const parts = token.split('.');
  if (parts.length < 2 || !parts[1]) return true;
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    if (typeof payload.exp !== 'number') return true;
    return Math.floor(Date.now() / 1000) >= payload.exp;
  } catch {
    return true;
  }
}

export async function forceSignOut(callbackUrl = '/login?reason=session'): Promise<void> {
  if (typeof window === 'undefined' || signingOut) return;

  const path = window.location.pathname;
  if (path.includes('/login') || path.includes('/platform-admin/login')) return;

  signingOut = true;
  try {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl });
  } finally {
    signingOut = false;
  }
}

export async function signOutForUnauthorized(): Promise<void> {
  await forceSignOut('/login?reason=session');
}
