'use client';

import { SessionProvider } from 'next-auth/react';
import { SessionAccessGuard } from '@/features/auth/components/session-access-guard';
import type { AuthProviderProps } from '@/types';

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <SessionAccessGuard />
      {children}
    </SessionProvider>
  );
}
