import type { DefaultSession } from 'next-auth';
import type { AuthAccountRole } from '@/lib/auth/accounts';

declare module 'next-auth' {
  interface User {
    role?: AuthAccountRole;
    shopId: string | null;
    shopName: string | null;
    accessToken: string;
    subscriptionEndsAt: string | null;
    subscriptionStatus?: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | null;
    rememberMe?: boolean;
    sessionExpiresAt?: number;
  }

  interface Session {
    accessToken: string;
    user: {
      id: string;
      role?: AuthAccountRole;
      shopId: string | null;
      shopName: string | null;
      subscriptionEndsAt?: string | null;
      subscriptionStatus?: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: AuthAccountRole;
    shopId?: string | null;
    shopName?: string | null;
    accessToken?: string;
    subscriptionEndsAt?: string | null;
    subscriptionStatus?: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | null;
    sessionExpiresAt?: number;
  }
}
