declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  
  interface RuntimeCaching {
    urlPattern: RegExp | string;
    handler: 'CacheFirst' | 'CacheOnly' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate';
    options?: {
      cacheName?: string;
      expiration?: {
        maxEntries?: number;
        maxAgeSeconds?: number;
      };
      networkTimeoutSeconds?: number;
      cacheableResponse?: {
        statuses: number[];
      };
    };
  }

  interface NextPWAOptions {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    scope?: string;
    sw?: string;
    runtimeCaching?: RuntimeCaching[];
    buildExcludes?: Array<string | RegExp>;
    sourcemap?: boolean;
  }

  export default function withPWA(
    options: NextPWAOptions
  ): NextConfig;
}
