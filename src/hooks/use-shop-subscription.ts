'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { authMeQueryOptions } from '@/features/auth/api/queries';
import { resolveEffectiveSubscription, buildWhatsAppSupportUrl } from '@/lib/subscription';

export function useShopSubscription() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === 'OWNER';

  const { data: authMe } = useQuery({
    ...authMeQueryOptions(),
    enabled: isOwner,
    staleTime: 60_000
  });

  const meShop = authMe?.shop;
  const sessionSource = session?.user
    ? {
        subscriptionEndsAt: session.user.subscriptionEndsAt,
        subscriptionStatus: session.user.subscriptionStatus,
        shopName: session.user.shopName
      }
    : null;

  const liveSource = meShop
    ? {
        subscriptionEndsAt: meShop.subscriptionEndsAt,
        subscriptionStatus: meShop.subscriptionStatus,
        shopName: meShop.name
      }
    : null;

  const resolved = resolveEffectiveSubscription(sessionSource, liveSource);
  const supportUrl = buildWhatsAppSupportUrl({ shopName: resolved.shopName });

  return {
    isOwner,
    session,
    endsAt: resolved.endsAt,
    subscriptionStatus: resolved.subscriptionStatus,
    isPaid: resolved.isPaid,
    daysLeft: resolved.daysLeft,
    shopName: resolved.shopName,
    supportUrl
  };
}
