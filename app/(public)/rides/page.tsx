// =============================================================================
// Public Rides Page - filterable list of all rides
// Server component shell → client RidesFilterList for interactivity
// =============================================================================

import type { Metadata }  from "next";
import { getRides, getHomepageContent } from "@/lib/supabase/queries";
import { RidesFilterList } from "@/features/rides/RidesFilterList";

export const metadata: Metadata = {
  title: "All Rides | TVS Nepal",
  description: "Browse all AOG & CULT rides across 9 chapters - filter by community, type, and status.",
};

export const revalidate = 1800;

export default async function RidesPage() {
  const [rides, homepage] = await Promise.all([getRides(), getHomepageContent()]);
  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <RidesFilterList allRides={rides} brandLogos={homepage.brandLogos} />
    </main>
  );
}
