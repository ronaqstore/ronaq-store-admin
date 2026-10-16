import type { SentryClientModule } from '@/types/common';

const sentryEnabled =
  process.env.NEXT_PUBLIC_SENTRY_DISABLED !== 'true' &&
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

function initSentryRouterHook():
  | SentryClientModule['captureRouterTransitionStart']
  | undefined {
  if (!sentryEnabled) return undefined;

  const Sentry = require('@sentry/nextjs') as typeof import('@sentry/nextjs') &
    SentryClientModule;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    tracesSampleRate: 1,
    debug: false
  });

  return Sentry.captureRouterTransitionStart;
}

export const onRouterTransitionStart = initSentryRouterHook();
