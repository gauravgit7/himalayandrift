// =============================================================================
// Offline fallback page — shown by service worker when navigation fails
// =============================================================================

"use client";

import Link from "next/link";
import { WifiOff, Bike } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-tvs-charcoal-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">

        {/* Icon */}
        <div className="relative mx-auto size-24">
          <div className="size-24 rounded-full bg-tvs-charcoal-900 border border-tvs-charcoal-700 flex items-center justify-center">
            <Bike className="size-10 text-tvs-charcoal-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-tvs-charcoal-900 border border-tvs-charcoal-700 flex items-center justify-center">
            <WifiOff className="size-4 text-tvs-red-500" />
          </div>
        </div>

        {/* Text */}
        <div>
          <h1 className="text-xl font-black text-tvs-charcoal-50 mb-2">
            You&apos;re Offline
          </h1>
          <p className="text-sm text-tvs-charcoal-400 leading-relaxed">
            No signal on this stretch of the road.
            Connect to the internet to load the latest rides.
          </p>
        </div>

        {/* Cached pages hint */}
        <div className="p-4 rounded-xl bg-tvs-charcoal-900 border border-tvs-charcoal-800 text-left space-y-2">
          <p className="text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-wide">
            Available offline
          </p>
          {[
            { label: "Ride Calendar",   href: "/calendar"  },
            { label: "Our Marshals",    href: "/marshals"  },
            { label: "Marshals",        href: "/marshals"  },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between py-1.5 text-sm text-tvs-charcoal-300 hover:text-tvs-charcoal-50 transition-colors"
            >
              {label}
              <span className="text-tvs-charcoal-600 text-xs">→</span>
            </Link>
          ))}
        </div>

        {/* Retry */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 rounded-xl bg-tvs-red-600 hover:bg-tvs-red-500 text-white font-semibold text-sm transition-all hover:shadow-glow-red"
        >
          Try Again
        </button>

      </div>
    </div>
  );
}
