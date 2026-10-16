const sentryEnabled =
  process.env.NEXT_PUBLIC_SENTRY_DISABLED !== 'true' &&
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export async function register() {
  if (!sentryEnabled) return;

  const Sentry = await import('@sentry/nextjs');

  const sentryOptions = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    spotlight: process.env.NODE_ENV === 'development',
    sendDefaultPii: true,
    tracesSampleRate: 1,
    debug: false
  };

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(sentryOptions);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(sentryOptions);
  }
}

function resolveRequestErrorHandler() {
  if (!sentryEnabled) return undefined;
  const Sentry = require('@sentry/nextjs') as typeof import('@sentry/nextjs');
  return Sentry.captureRequestError;
}

export const onRequestError = resolveRequestErrorHandler();
