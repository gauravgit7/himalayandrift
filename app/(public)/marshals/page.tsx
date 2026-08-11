// =============================================================================
// Public Marshals Page - hierarchical display of all Himalayan Drift marshals
// Head Marshal → Senior Marshals → Ride Marshals
// ISR: 1 hour revalidation
// =============================================================================

import type { Metadata }          from "next";
import { getMarshals }            from "@/lib/supabase/queries";
import { AnimateIn }              from "@/components/shared/AnimateIn";
import { MarshalPageClient }      from "@/features/marshals/MarshalPageClient";

export const metadata: Metadata = {
  title:       "Marshals | Himalayan Drift",
  description: "Meet the marshals who lead Himalayan Drift rides.",
};

export const revalidate = 3600; // 1 hour

export default async function MarshalsPage() {
  const marshals = await getMarshals();

  // Roles are free text, so the filter offers whatever is actually in use
  const activeRoles = [...new Set(marshals.map((m) => m.role).filter(Boolean))].sort();

  const headCount    = marshals.filter((m) => m.role === "Head Marshal").length;
  const seniorCount  = marshals.filter((m) => m.role === "Senior Marshal").length;
  const regionalCount = marshals.filter(
    (m) => m.role !== "Head Marshal" && m.role !== "Senior Marshal"
  ).length;

  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <AnimateIn className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="block w-8 h-px bg-tvs-red-600 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-tvs-red-400">
            The Team
          </span>
          <span className="block w-8 h-px bg-tvs-red-600 rounded-full" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-tvs-charcoal-50 mb-3">
          Meet Our Marshals
        </h1>
        <p className="text-sm sm:text-base text-tvs-charcoal-400 max-w-lg mx-auto leading-relaxed">
          Experienced riders leading Himalayan Drift on the road.
          {marshals.length > 0 && (
            <span className="block mt-1 text-tvs-charcoal-500">
              {marshals.length} active marshal{marshals.length !== 1 ? "s" : ""}.
            </span>
          )}
        </p>

        {/* Stats row */}
        {marshals.length > 0 && (
          <div className="flex items-center justify-center gap-6 mt-5">
            {headCount > 0 && (
              <div className="text-center">
                <p className="text-lg font-black text-tvs-red-400">{headCount}</p>
                <p className="text-[10px] text-tvs-charcoal-600 uppercase tracking-wider">Head</p>
              </div>
            )}
            {seniorCount > 0 && (
              <div className="text-center">
                <p className="text-lg font-black text-amber-400">{seniorCount}</p>
                <p className="text-[10px] text-tvs-charcoal-600 uppercase tracking-wider">Senior</p>
              </div>
            )}
            {regionalCount > 0 && (
              <div className="text-center">
                <p className="text-lg font-black text-blue-400">{regionalCount}</p>
                <p className="text-[10px] text-tvs-charcoal-600 uppercase tracking-wider">Regional</p>
              </div>
            )}
          </div>
        )}
      </AnimateIn>

      {/* ── Client component (filter + cards) ── */}
      <MarshalPageClient marshals={marshals} activeRoles={activeRoles} />

    </main>
  );
}
