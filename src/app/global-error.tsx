'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { t as staticT } from '@/i18n/static-t';
import type { GlobalErrorProps } from '@/types';
export type { GlobalErrorProps };

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang='en'>
      <body className='m-0 flex min-h-screen items-center justify-center font-sans'>
        <div className='p-4 text-center'>
          <h1 className='mb-2 text-2xl font-bold'>{staticT('errors.genericTitle')}</h1>
          <p className='mb-5 text-muted-foreground'>{staticT('errors.genericDescription')}</p>
          <button
            type='button'
            onClick={() => reset()}
            className='cursor-pointer rounded-lg border border-border bg-transparent px-5 py-2 font-inherit'
          >
            {staticT('common.tryAgain')}
          </button>
        </div>
      </body>
    </html>
  );
}
