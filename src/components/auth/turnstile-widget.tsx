'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TURNSTILE_SCRIPT_URL } from '@/constants/api';
import { env } from '@/config/env';
import { cn } from '@/lib/utils';
import type {
  TurnstileApi,
  TurnstileWidgetId,
  TurnstileWidgetProps,
  TurnstileWindow
} from '@/types/turnstile';

function getTurnstileApi(): TurnstileApi | undefined {
  return (window as TurnstileWindow).turnstile;
}

export function getTurnstileSiteKey(): string {
  return env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';
}

export function isTurnstileEnabled(): boolean {
  return getTurnstileSiteKey().length > 0;
}

export function TurnstileWidget({
  onTokenChange,
  className,
  resetSignal = 0
}: TurnstileWidgetProps) {
  const siteKey = getTurnstileSiteKey();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [scriptReady, setScriptReady] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (typeof window !== 'undefined' && getTurnstileApi()) {
      setScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (!resetSignal) return;
    const turnstile = getTurnstileApi();
    if (turnstile && widgetIdRef.current !== null) {
      turnstile.reset(widgetIdRef.current);
      onTokenChangeRef.current(null);
    }
  }, [resetSignal]);

  useEffect(() => {
    const turnstile = getTurnstileApi();
    if (!siteKey || !scriptReady || !containerRef.current || !turnstile) return;
    if (widgetIdRef.current !== null) return;

    try {
      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        size: 'flexible',
        appearance: 'always',
        callback: (token: string) => {
          setWidgetReady(true);
          onTokenChangeRef.current(token);
        },
        'expired-callback': () => onTokenChangeRef.current(null),
        'error-callback': () => {
          setWidgetReady(true);
          onTokenChangeRef.current(null);
        },
        'timeout-callback': () => onTokenChangeRef.current(null)
      });
      setWidgetReady(true);
    } catch {
      setWidgetReady(true);
      onTokenChangeRef.current(null);
    }

    return () => {
      const api = getTurnstileApi();
      if (widgetIdRef.current !== null && api) {
        api.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, scriptReady]);

  const handleScriptReady = () => {
    setScriptReady(true);
  };

  const handleScriptError = () => {
    setWidgetReady(true);
    onTokenChangeRef.current(null);
  };

  if (!siteKey) return null;

  return (
    <div className={cn('relative w-full min-h-[65px]', className)}>
      {!widgetReady ? (
        <Skeleton className='absolute inset-x-0 top-0 z-10 h-[65px] w-full rounded-md' />
      ) : null}
      <div ref={containerRef} className='w-full min-h-[65px] [&_iframe]:w-full' />
      <Script
        src={TURNSTILE_SCRIPT_URL}
        strategy='afterInteractive'
        onReady={handleScriptReady}
        onError={handleScriptError}
      />
    </div>
  );
}
