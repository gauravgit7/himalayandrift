// =============================================================================
// Admin Sponsors - full CRUD via SponsorsManager
// =============================================================================

import type { Metadata }     from "next";
import { getSponsors }       from "@/lib/supabase/queries";
import { SponsorsManager }   from "@/features/admin/SponsorsManager";

export const metadata: Metadata = { title: "Sponsors | TVS Nepal Admin" };

export default async function AdminSponsorsPage() {
  const sponsors = await getSponsors();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-tvs-charcoal-50">Sponsors</h1>
        <p className="text-sm text-tvs-charcoal-400 mt-0.5">
          Manage sponsors shown in the homepage showcase
        </p>
      </div>
      <SponsorsManager initialSponsors={sponsors} />
    </div>
  );
}
