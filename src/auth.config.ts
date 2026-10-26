import type { NextAuthConfig } from 'next-auth';
import {
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
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.shopId = user.shopId;
        token.shopName = user.shopName;
        token.accessToken = user.accessToken;
        token.subscriptionEndsAt = user.subscriptionEndsAt;
        token.sessionExpiresAt = user.sessionExpiresAt;
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
        session.user.role = undefined;
        return session;
      }

      session.user.id = token.sub;
      session.user.role = readAuthRole(token.role);
      session.user.shopId = readOptionalString(token.shopId);
      session.user.shopName = readOptionalString(token.shopName);
      session.user.subscriptionEndsAt = readOptionalString(token.subscriptionEndsAt);
      session.accessToken = readRequiredString(token.accessToken);
      return session;
    },

    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.accessToken && auth?.user?.id);
      const isDashboard =
        pathname.startsWith('/dashboard') || /\/(en|ur|ps)\/dashboard/.test(pathname);
      const isAuthApi = pathname.startsWith('/api/auth');

      if (isAuthApi) return true;
      if (isDashboard) return isLoggedIn;
      return true;
    }
  }
} satisfies NextAuthConfig;
