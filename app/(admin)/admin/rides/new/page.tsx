// =============================================================================
// Admin - Create New Ride - Phase 6 · Supabase data
// =============================================================================

import type { Metadata } from "next";
import Link              from "next/link";
import { ArrowLeft }     from "lucide-react";
import { ROUTES }        from "@/lib/constants";
import { getMarshals }   from "@/lib/supabase/queries";
import { RideForm }      from "@/features/admin/RideForm";

export const metadata: Metadata = { title: "New Ride | Himalayan Drift Admin" };

export default async function NewRidePage() {
  const marshals = await getMarshals();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.adminRides}
          className="flex items-center gap-1.5 text-sm text-hd-ink-400 hover:text-hd-ink-100 transition-colors"
        >
          <ArrowLeft className="size-4" />
          All Rides
        </Link>
        <span className="text-hd-ink-700">/</span>
        <span className="text-sm text-hd-ink-200 font-medium">New Ride</span>
      </div>
      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">Create New Ride</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          Add a new ride to the 2026 schedule
        </p>
      </div>
      <RideForm mode="create" marshals={marshals} />
    </div>
  );
}
