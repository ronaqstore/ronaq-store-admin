'use client';

import { StatsErrorFallback } from '@/features/overview/components/stats-error';
import { t as staticT } from '@/i18n/static-t';
import type { OverviewErrorProps } from '@/types';
export type { OverviewErrorProps };

export default function OverviewError({ error, reset }: OverviewErrorProps) {
  return (
    <StatsErrorFallback
      error={error}
      reset={reset}
      message={staticT('overview.failedToLoadStats', { message: error.message })}
    />
  );
}
