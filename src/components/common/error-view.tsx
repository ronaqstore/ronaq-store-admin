'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { t as staticT } from '@/i18n/static-t';
import type { AppErrorProps } from '@/types/pages';

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    /Loading chunk [\d]+ failed/i.test(error.message) ||
    /Failed to fetch dynamically imported module/i.test(error.message)
  );
}

export function ErrorView({ error, reset }: AppErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
    if (isChunkLoadError(error)) {
      const key = 'pwa-chunk-reload';
      try {
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return;
        }
      } catch (storageErr) {
        Sentry.captureException(storageErr);
      }
    }
  }, [error]);

  return (
    <div className='flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-4 p-6 text-center'>
      <div className='space-y-2'>
        <h1 className='text-2xl font-bold tracking-tight'>{staticT('common.somethingWentWrong')}</h1>
        <p className='text-muted-foreground max-w-md text-sm'>
          {error.message || staticT('common.unexpectedError')}
        </p>
      </div>
      <div className='flex gap-2'>
        <Button type='button' onClick={reset} variant='default'>
          {staticT('common.tryAgain')}
        </Button>
        <Button type='button' onClick={() => window.location.reload()} variant='outline'>
          {staticT('common.reloadPage')}
        </Button>
      </div>
    </div>
  );
}
