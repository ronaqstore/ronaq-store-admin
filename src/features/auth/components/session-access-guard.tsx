'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { authMeQueryOptions } from '@/features/auth/api/queries';
import {
  isJwtExpiredOrInvalid,
  signOutForUnauthorized
} from '@/lib/auth/force-sign-out';

export function SessionAccessGuard() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const enabled = status === 'authenticated' && Boolean(role) && role !== 'SUPER_ADMIN';

  useQuery({
    ...authMeQueryOptions(),
    enabled,
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: false
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated') return;

    if (!session?.accessToken || !session.user?.id || isJwtExpiredOrInvalid(session.accessToken)) {
      void signOutForUnauthorized();
    }
  }, [status, session?.accessToken, session?.user?.id]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken) return;

    const check = () => {
      if (isJwtExpiredOrInvalid(session.accessToken)) {
        void signOutForUnauthorized();
      }
    };

    const id = window.setInterval(check, 30_000);
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [status, session?.accessToken]);

  return null;
}
