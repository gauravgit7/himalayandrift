import type { Metadata }   from "next";
import { getAllMarshals }   from "@/lib/supabase/queries";
import { MarshalsAdmin }    from "@/features/admin/MarshalsAdmin";

export const metadata: Metadata = { title: "Marshals | TVS Nepal Admin" };

export default async function AdminMarshalsPage() {
  const marshals = await getAllMarshals();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-tvs-charcoal-50">Marshals</h1>
        <p className="text-sm text-tvs-charcoal-400 mt-0.5">
          Everyone who leads rides. Roles are free text — use whatever titles fit.
        </p>
      </div>
      <MarshalsAdmin initialMarshals={marshals} />
    </div>
  );
}
