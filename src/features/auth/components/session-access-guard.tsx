'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { authMeQueryOptions } from '@/features/auth/api/queries';
import { isJwtExpiredOrInvalid, signOutForUnauthorized } from '@/lib/auth/force-sign-out';

export function SessionAccessGuard() {
  const { data: session, status, update } = useSession();
  const role = session?.user?.role;
  const enabled = status === 'authenticated' && Boolean(role) && role !== 'SUPER_ADMIN';

  const { data: authMe } = useQuery({
    ...authMeQueryOptions(),
    enabled,
    staleTime: 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    retry: false
  });

  useEffect(() => {
    if (!authMe?.shop || !session?.user) return;

    const meShop = authMe.shop;
    const currentEndsAt = session.user.subscriptionEndsAt;
    const currentStatus = session.user.subscriptionStatus;
    const currentShopName = session.user.shopName;

    if (
      meShop.subscriptionEndsAt !== currentEndsAt ||
      meShop.subscriptionStatus !== currentStatus ||
      meShop.name !== currentShopName
    ) {
      void update({
        subscriptionEndsAt: meShop.subscriptionEndsAt,
        subscriptionStatus: meShop.subscriptionStatus,
        shopName: meShop.name
      });
    }
  }, [
    authMe,
    session?.user,
    session?.user?.subscriptionEndsAt,
    session?.user?.subscriptionStatus,
    session?.user?.shopName,
    update
  ]);

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
