import type { NextConfig } from 'next';
import { createRequire } from 'node:module';
import { withSerwist } from '@serwist/turbopack';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const baseConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        port: ''
      }
    ]
  },

  transpilePackages: ['geist'],
  experimental: {
    optimizePackageImports: ['@tabler/icons-react']
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },

  skipProxyUrlNormalize: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }
        ]
      },
      {
        source: '/serwist/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'"
          }
        ]
      },
      {
        source: '/~offline',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }]
      }
    ];
  }
};

const sentryEnabled =
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) && process.env.NEXT_PUBLIC_SENTRY_DISABLED !== 'true';

function withOptionalSentry(config: NextConfig): NextConfig {
  if (!sentryEnabled) return config;

  const require = createRequire(import.meta.url);
  const { withSentryConfig } = require('@sentry/nextjs') as typeof import('@sentry/nextjs');

  return withSentryConfig(config, {
    org: process.env.NEXT_PUBLIC_SENTRY_ORG,
    project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    telemetry: false,
    webpack: {
      reactComponentAnnotation: {
        enabled: true
      },
      treeshake: {
        removeDebugLogging: true
      }
    },
    sourcemaps: {
      disable: !process.env.NEXT_PUBLIC_SENTRY_ORG || !process.env.NEXT_PUBLIC_SENTRY_PROJECT
    }
  });
}

const nextConfig = withSerwist(withOptionalSentry(withNextIntl(baseConfig)));
export default nextConfig;
