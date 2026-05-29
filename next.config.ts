import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  output: process.env.BUILD_TARGET === 'android' ? 'export' : undefined,
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    // Pre-cache critical app shell files
    buildExcludes: [/^\/manifest\.json$/],
    runtimeCaching: [
      // 1. PRECACHE: App shell (JS, CSS) - CacheFirst with very aggressive expiration
      {
        urlPattern: /\.(?:js|css)$/,  // JavaScript and CSS bundles
        handler: "CacheFirst",
        options: {
          cacheName: "app-shell-static",
          expiration: {
            maxEntries: 300,  // Increased from 200
            maxAgeSeconds: 60 * 60 * 24 * 180, // 180 days (fingerprinted = safe)
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // 2. HTML PAGES: StaleWhileRevalidate for fresh content
      {
        urlPattern: /\.html$/,  // HTML pages
        handler: "StaleWhileRevalidate",  // Serve cached, update in background
        options: {
          cacheName: "app-pages",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // 3. STATIC ASSETS: Fonts - CacheFirst forever
      {
        urlPattern: /\.(?:woff2?|ttf|eot)$/,  // Font files
        handler: "CacheFirst",
        options: {
          cacheName: "static-fonts",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // 4. IMAGES: Local images - CacheFirst very aggressive
      {
        urlPattern: /^\/(?!api).+\.(?:png|jpg|jpeg|svg|gif|webp|ico|avif)$/i,  // Local images
        handler: "CacheFirst",
        options: {
          cacheName: "local-images",
          expiration: {
            maxEntries: 500,  // Increased from 300
            maxAgeSeconds: 60 * 60 * 24 * 180, // 180 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // 5. EXTERNAL IMAGES: BunnyCDN - CacheFirst very aggressive
      {
        urlPattern: /^https:\/\/(?:.*\.)?b-cdn\.net\/.+\.(?:png|jpg|jpeg|svg|gif|webp)$/i,  // BunnyCDN images
        handler: "CacheFirst",
        options: {
          cacheName: "cdn-images",
          expiration: {
            maxEntries: 1000,  // Increased from 500 - very aggressive
            maxAgeSeconds: 60 * 60 * 24 * 180, // 180 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // 6. FIREBASE ENDPOINTS: NetworkFirst with extended offline fallback
      {
        urlPattern: /^https:\/\/(?:firestore|firebasestorage)\.googleapis\.com\/.*/i,  // Firebase APIs
        handler: "NetworkFirst",
        options: {
          cacheName: "firebase-data",
          expiration: {
            maxEntries: 300,  // Increased from 200
            maxAgeSeconds: 60 * 30, // 30 minutes (extended fallback)
          },
          networkTimeoutSeconds: 8, // Wait up to 8 seconds before falling back
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // 7. API ROUTES: NetworkFirst with extended fallback
      {
        urlPattern: /^\/api\/.*/,  // Next.js API routes
        handler: "NetworkFirst",
        options: {
          cacheName: "api-routes",
          expiration: {
            maxEntries: 150,  // Increased from 100
            maxAgeSeconds: 60 * 15, // 15 minutes fallback (increased)
          },
          networkTimeoutSeconds: 8, // Timeout after 8 seconds, fallback to cache
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // 8. EXTERNAL APIS: NetworkFirst with longer cache
      {
        urlPattern: /^https:\/\/(?!fonts\.|.*\.b-cdn\.net).*\.(?:json|xml)$/,  // External APIs
        handler: "NetworkFirst",
        options: {
          cacheName: "external-apis",
          expiration: {
            maxEntries: 150,  // Increased from 100
            maxAgeSeconds: 60 * 10, // 10 minutes (increased)
          },
          networkTimeoutSeconds: 8,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // 9. GOOGLE FONTS: CacheFirst very aggressive
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 30,  // Increased from 20
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: {
            maxEntries: 30,  // Increased from 20
            maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days (increased)
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // 10. DEFAULT: NetworkFirst for everything else with good fallback
      {
        urlPattern: /^https?:\/\/.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "default-cache",
          expiration: {
            maxEntries: 200,  // Increased from 100
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days (increased)
          },
          networkTimeoutSeconds: 8,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  }),
};

export default nextConfig;
