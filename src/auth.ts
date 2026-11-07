import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from '@/auth.config';
import { isValidPkMobile, normalizePhone } from '@/lib/auth/phone';
import { sessionTtlSeconds } from '@/lib/auth/session-ttl';
import { AUTH_ERROR_CODES, type AuthFailureCode } from '@/lib/auth/auth-error-codes';
import type { LoginResult, AuthResponseData, AuthResponseBody } from '@/types/auth';
import type { AuthAccountRole } from '@/lib/auth/accounts';
import { API_BASE_URL } from '@/constants/api';

class AuthFailureError extends CredentialsSignin {
  constructor(code: AuthFailureCode) {
    super();
    this.code = code;
  }
}

async function executeAuthPost(
  endpoint: string,
  phone: string,
  password: string,
  rememberMe: boolean,
  turnstileToken: string
): Promise<AuthResponseData> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        password,
        rememberMe,
        ...(turnstileToken ? { turnstileToken } : {})
      }),
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    throw new AuthFailureError(AUTH_ERROR_CODES.SERVER_WAKING_UP);
  }

  if (!res.ok) {
    if (res.status === 429) {
      throw new AuthFailureError(AUTH_ERROR_CODES.RATE_LIMITED);
    }
    if (res.status === 401) {
      throw new AuthFailureError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }
    if (res.status >= 500) {
      throw new AuthFailureError(AUTH_ERROR_CODES.SERVER_WAKING_UP);
    }
    if (res.status === 403) {
      try {
        const json = (await res.json()) as { error?: string; message?: string | string[] };
        const text =
          `${json?.error ?? ''} ${Array.isArray(json?.message) ? json.message.join(' ') : (json?.message ?? '')}`.toLowerCase();
        if (text.includes('shop') || text.includes('subscription')) {
          throw new AuthFailureError(AUTH_ERROR_CODES.SHOP_SUSPENDED);
        }
        if (text.includes('platform admin') || text.includes('staff') || text.includes('admin')) {
          throw new AuthFailureError(AUTH_ERROR_CODES.ADMIN_DISABLED);
        }
        throw new AuthFailureError(AUTH_ERROR_CODES.ACCOUNT_SUSPENDED);
      } catch (err) {
        if (err instanceof AuthFailureError) throw err;
        throw new AuthFailureError(AUTH_ERROR_CODES.SHOP_SUSPENDED);
      }
    }
    if (res.status === 400) {
      try {
        const json = (await res.json()) as { error?: string; message?: string | string[] };
        const text =
          `${json?.error ?? ''} ${Array.isArray(json?.message) ? json.message.join(' ') : (json?.message ?? '')}`.toLowerCase();
        if (text.includes('turnstile') || text.includes('human verification')) {
          throw new AuthFailureError(AUTH_ERROR_CODES.TURNSTILE_FAILED);
        }
        throw new AuthFailureError(AUTH_ERROR_CODES.VALIDATION_ERROR);
      } catch (err) {
        if (err instanceof AuthFailureError) throw err;
        throw new AuthFailureError(AUTH_ERROR_CODES.VALIDATION_ERROR);
      }
    }
    throw new AuthFailureError(AUTH_ERROR_CODES.UNKNOWN_ERROR);
  }

  const json = (await res.json()) as AuthResponseBody;
  const data = json?.data;
  if (!data?.accessToken) {
    throw new AuthFailureError(AUTH_ERROR_CODES.SERVER_WAKING_UP);
  }
  return data;
}

async function tryOwnerLogin(
  phone: string,
  password: string,
  rememberMe: boolean,
  turnstileToken: string
): Promise<LoginResult> {
  const data = await executeAuthPost('/auth/login', phone, password, rememberMe, turnstileToken);
  if (!data.accessToken || !data.user) {
    throw new AuthFailureError(AUTH_ERROR_CODES.SERVER_WAKING_UP);
  }

  return {
    id: data.user.id,
    name: data.user.name,
    phone: data.user.phone,
    role: (data.user.role as AuthAccountRole) ?? 'OWNER',
    shopId: data.shopId ?? null,
    shopName: data.shop?.name ?? null,
    accessToken: data.accessToken,
    subscriptionEndsAt: data.shop?.subscriptionEndsAt ?? null,
    subscriptionStatus: data.shop?.subscriptionStatus ?? null,
    rememberMe,
    sessionExpiresAt: Math.floor(Date.now() / 1000) + sessionTtlSeconds(rememberMe)
  };
}

async function tryPlatformAdminLogin(
  phone: string,
  password: string,
  rememberMe: boolean,
  turnstileToken: string
): Promise<LoginResult> {
  const data = await executeAuthPost(
    '/auth/platform-admin/login',
    phone,
    password,
    rememberMe,
    turnstileToken
  );
  if (!data.accessToken || !data.admin) {
    throw new AuthFailureError(AUTH_ERROR_CODES.SERVER_WAKING_UP);
  }

  return {
    id: data.admin.id,
    name: data.admin.name,
    phone: data.admin.phone,
    role: 'SUPER_ADMIN',
    shopId: null,
    shopName: null,
    accessToken: data.accessToken,
    subscriptionEndsAt: null,
    subscriptionStatus: null,
    rememberMe,
    sessionExpiresAt: Math.floor(Date.now() / 1000) + sessionTtlSeconds(rememberMe)
  };
}

const credentialsSchema = z.object({
  phone: z.string().refine(isValidPkMobile, 'Enter a valid mobile number'),
  password: z.string().min(1),
  isPlatformAdmin: z.enum(['true', 'false']).optional(),
  rememberMe: z.enum(['true', 'false']).optional(),
  turnstileToken: z.string().optional()
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        password: { label: 'Password', type: 'password' },
        isPlatformAdmin: { label: 'Is Platform Admin', type: 'hidden' },
        rememberMe: { label: 'Remember Me', type: 'hidden' },
        turnstileToken: { label: 'Turnstile', type: 'hidden' }
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          throw new AuthFailureError(AUTH_ERROR_CODES.VALIDATION_ERROR);
        }

        const phone = normalizePhone(parsed.data.phone);
        const {
          password,
          isPlatformAdmin,
          rememberMe: rememberRaw,
          turnstileToken = ''
        } = parsed.data;
        const rememberMe = rememberRaw === 'true';

        if (isPlatformAdmin === 'true') {
          return await tryPlatformAdminLogin(phone, password, rememberMe, turnstileToken);
        }

        return await tryOwnerLogin(phone, password, rememberMe, turnstileToken);
      }
    })
  ]
});
