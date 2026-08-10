// =============================================================================
// 404 Not Found
// =============================================================================

import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center gap-6">
      <div className="space-y-2">
        <p className="text-8xl font-black text-tvs-red-600/30">404</p>
        <h1 className="text-2xl font-bold text-tvs-charcoal-50">Route Not Found</h1>
        <p className="text-tvs-charcoal-400 max-w-xs">
          This road doesn&apos;t exist. Let&apos;s get you back on track.
        </p>
      </div>
      <Link
        href={ROUTES.home}
        className="px-6 py-3 rounded-xl bg-tvs-red-600 hover:bg-tvs-red-500 text-white font-semibold text-sm transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
