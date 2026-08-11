// =============================================================================
// Offline fallback page — shown by service worker when navigation fails
// =============================================================================

"use client";

import Link from "next/link";
import { WifiOff, Bike } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-hd-ink-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">

        {/* Icon */}
        <div className="relative mx-auto size-24">
          <div className="size-24 rounded-full bg-hd-ink-900 border border-hd-ink-700 flex items-center justify-center">
            <Bike className="size-10 text-hd-ink-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-hd-ink-900 border border-hd-ink-700 flex items-center justify-center">
            <WifiOff className="size-4 text-hd-ember-500" />
          </div>
        </div>

        {/* Text */}
        <div>
          <h1 className="text-xl font-black text-hd-ink-50 mb-2">
            You&apos;re Offline
          </h1>
          <p className="text-sm text-hd-ink-400 leading-relaxed">
            No signal on this stretch of the road.
            Connect to the internet to load the latest rides.
          </p>
        </div>

        {/* Cached pages hint */}
        <div className="p-4 rounded-xl bg-hd-ink-900 border border-hd-ink-800 text-left space-y-2">
          <p className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
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
              className="flex items-center justify-between py-1.5 text-sm text-hd-ink-300 hover:text-hd-ink-50 transition-colors"
            >
              {label}
              <span className="text-hd-ink-600 text-xs">→</span>
            </Link>
          ))}
        </div>

        {/* Retry */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white font-semibold text-sm transition-all hover:shadow-glow-ember"
        >
          Try Again
        </button>

      </div>
    </div>
  );
}
