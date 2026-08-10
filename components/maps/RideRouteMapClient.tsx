// =============================================================================
// RideRouteMapClient - thin 'use client' wrapper so the Server Component
// ride detail page can import a map without triggering the
// "ssr:false not allowed in Server Components" error.
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const RideRouteMap = dynamic(() => import("./RideRouteMap"), {
  ssr:     false,
  loading: () => (
    <div className="h-72 rounded-xl bg-tvs-charcoal-900/60 border border-tvs-charcoal-700/40 flex items-center justify-center">
      <p className="text-xs text-tvs-charcoal-600 animate-pulse">Loading map…</p>
    </div>
  ),
});

// Re-export with the same props interface so callers don't need to change
export default function RideRouteMapClient(
  props: ComponentProps<typeof RideRouteMap>,
) {
  return <RideRouteMap {...props} />;
}
