import type { Metadata } from "next";
import { getSeries, getSeriesRideCounts } from "@/lib/supabase/queries";
import { SeriesAdmin } from "@/features/admin/SeriesAdmin";

export const metadata: Metadata = { title: "Series | Admin" };

export default async function AdminSeriesPage() {
  const [series, rideCounts] = await Promise.all([
    getSeries(),
    getSeriesRideCounts(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-hd-ink-50">Ride Series</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          Recurring named rides that release in volumes. Assign a ride to a series
          on the ride form.
        </p>
      </div>
      <SeriesAdmin initialSeries={series} rideCounts={rideCounts} />
    </div>
  );
}
