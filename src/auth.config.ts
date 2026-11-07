import type { NextAuthConfig } from 'next-auth';
import {
  extractRoleFromAccessToken,
  readAuthRole,
  readOptionalString,
  readRequiredString
} from '@/lib/auth/session-claims';
import { SESSION_TTL_SECONDS } from '@/lib/auth/session-ttl';

export const authConfig = {
  pages: {
    signIn: '/login'
  },
  providers: [],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_TTL_SECONDS.remember
  },
  trustHost: true,
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.shopId = user.shopId;
        token.shopName = user.shopName;
        token.accessToken = user.accessToken;
        token.subscriptionEndsAt = user.subscriptionEndsAt;
        token.subscriptionStatus = user.subscriptionStatus;
        token.sessionExpiresAt = user.sessionExpiresAt;
      }

      if (typeof token.accessToken === 'string') {
        const roleFromJwt = extractRoleFromAccessToken(token.accessToken);
        if (roleFromJwt) {
          token.role = roleFromJwt;
        }
      }

      if (trigger === 'update' && session) {
        const updateData = session as Record<string, unknown>;
        if (
          typeof updateData.subscriptionEndsAt === 'string' ||
          updateData.subscriptionEndsAt === null
        ) {
          token.subscriptionEndsAt = updateData.subscriptionEndsAt;
        }
        if (
          typeof updateData.subscriptionStatus === 'string' ||
          updateData.subscriptionStatus === null
        ) {
          token.subscriptionStatus = updateData.subscriptionStatus as
            | 'TRIALING'
            | 'ACTIVE'
            | 'EXPIRED';
        }
        if (typeof updateData.shopName === 'string' || updateData.shopName === null) {
          token.shopName = updateData.shopName;
        }
      }

      const expiresAt = token.sessionExpiresAt;
      if (typeof expiresAt === 'number' && Math.floor(Date.now() / 1000) >= expiresAt) {
        return {};
      }

      return token;
    },

    session({ session, token }) {
      if (!token.accessToken || !token.sub) {
        session.accessToken = '';
        session.user.id = '';
        session.user.shopId = null;
        session.user.shopName = null;
        session.user.subscriptionEndsAt = null;
        session.user.subscriptionStatus = null;
        session.user.role = undefined;
        return session;
      }

      session.user.id = token.sub;
      const extractedRole =
        typeof token.accessToken === 'string'
          ? extractRoleFromAccessToken(token.accessToken)
          : undefined;
      session.user.role = extractedRole ?? readAuthRole(token.role);
      session.user.shopId = readOptionalString(token.shopId);
      session.user.shopName = readOptionalString(token.shopName);
      session.user.subscriptionEndsAt = readOptionalString(token.subscriptionEndsAt);
      session.user.subscriptionStatus =
        (readOptionalString(token.subscriptionStatus) as 'TRIALING' | 'ACTIVE' | 'EXPIRED') ?? null;
      session.accessToken = readRequiredString(token.accessToken);
      return session;
    },

    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.accessToken && auth?.user?.id);
      const isDashboard =
        pathname.startsWith('/dashboard') || /\/(en|ur|ps|roman)\/dashboard/.test(pathname);
      const isAuthApi = pathname.startsWith('/api/auth');

      if (isAuthApi) return true;
      if (isDashboard) return isLoggedIn;
      return true;
    }
  }
} satisfies NextAuthConfig;
