// =============================================================================
// Service Worker — Himalayan Drift
// Powered by Serwist. All imports from "serwist" only — no workbox-* needed.
// =============================================================================

import {
  Serwist,
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  ExpirationPlugin,
} from "serwist";
import { defaultCache } from "@serwist/next/worker";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const serwist = new Serwist({
  precacheEntries:   self.__SW_MANIFEST,
  skipWaiting:  true,
  clientsClaim: true,

  runtimeCaching: [
    // Page navigations — stale-while-revalidate
    {
      matcher: ({ request }: { request: Request }) =>
        request.mode === "navigate",
      handler: new StaleWhileRevalidate({ cacheName: "pages" }),
    },

    // API routes — network-first, 5-min cache fallback
    {
      matcher: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName:             "api-cache",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 }),
        ],
      }),
    },

    // Supabase images — cache-first, 30-day TTL
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname.endsWith(".supabase.co"),
      handler: new CacheFirst({
        cacheName: "supabase-images",
        plugins: [
          new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 2_592_000 }),
        ],
      }),
    },

    // Next.js static assets
    ...defaultCache,
  ],
});

serwist.addEventListeners();
