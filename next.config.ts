// =============================================================================
// Next.js Configuration
// Phase 10 · Bundle optimisation, ISR, security headers
// =============================================================================

import type { NextConfig } from "next";
import withSerwistInit    from "@serwist/next";

// ---------------------------------------------------------------------------
// Security headers applied to every response
// ---------------------------------------------------------------------------

const SECURITY_HEADERS = [
  { key: "X-DNS-Prefetch-Control",  value: "on" },
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "X-Frame-Options",         value: "DENY" },
  { key: "X-XSS-Protection",        value: "1; mode=block" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  {
    key:   "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
];

// ---------------------------------------------------------------------------
// Main config
// ---------------------------------------------------------------------------

const nextConfig: NextConfig = {
  // ── Turbopack (Next.js 16 default) ────────────────────────────────────────
  // @serwist/next injects a webpack config; Next.js 16 requires an explicit
  // turbopack entry to coexist with a webpack config without crashing.
  turbopack: {},

  // ── Security ──────────────────────────────────────────────────────────────
  poweredByHeader: false, // remove X-Powered-By: Next.js

  // ── Bundle size ───────────────────────────────────────────────────────────
  // Barrel-file tree-shaking: only import the icons / components actually used
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "date-fns",
    ],
  },

  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    // Prefer AVIF → WebP → source (browser picks best it supports)
    formats: ["image/avif", "image/webp"],

    remotePatterns: [
      {
        // Supabase storage buckets
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // OpenWeather icons
        protocol: "https",
        hostname: "openweathermap.org",
      },
    ],
  },

  // ── HTTP headers ──────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      {
        // Cache static assets aggressively (Next.js content-hashes them)
        source: "/_next/static/(.*)",
        headers: [
          {
            key:   "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // ── React ─────────────────────────────────────────────────────────────────
  reactStrictMode: true,
};

// ---------------------------------------------------------------------------
// Serwist (PWA service worker)
// ---------------------------------------------------------------------------

const withSerwist = withSerwistInit({
  swSrc:   "sw.ts",
  swDest:  "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
