'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { authMeQueryOptions } from '@/features/auth/api/queries';

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

  return null;
}
