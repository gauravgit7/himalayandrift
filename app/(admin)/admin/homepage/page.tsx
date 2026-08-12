// =============================================================================
// Admin Homepage Editor - Phase 6 · Supabase data
// =============================================================================

import type { Metadata }                      from "next";
import { getHomepageContent, getRides }       from "@/lib/supabase/queries";
import { sortRidesByDate }                    from "@/utils/ride";
import { HomepageEditor }                     from "@/features/admin/HomepageEditor";

export const metadata: Metadata = { title: "Homepage Editor | Admin" };

export default async function AdminHomepagePage() {
  const [homepage, rides] = await Promise.all([
    getHomepageContent(),
    getRides(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">Homepage Editor</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          Control hero content, featured rides, and site settings
        </p>
      </div>
      <HomepageEditor initialContent={homepage} allRides={sortRidesByDate(rides)} />
    </div>
  );
}
