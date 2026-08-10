// =============================================================================
// Chapter detail page — /chapters/[name]
// Shows chapter info, marshals, and upcoming rides for that chapter
// =============================================================================

import type { Metadata }            from "next";
import { notFound }                 from "next/navigation";
import Link                         from "next/link";
import { ArrowLeft, Users, Bike,
         MapPin, ImageIcon }        from "lucide-react";
import { getChapters, getRides,
         getMarshals }              from "@/lib/supabase/queries";
import { MarshalPageClient }        from "@/features/marshals/MarshalPageClient";
import { AnimateIn }                from "@/components/shared/AnimateIn";
import { sortRidesByDate }          from "@/utils/ride";
import { rideIsUpcoming }           from "@/utils/date";
import { RideCard }                 from "@/components/shared/RideCard";
import { cn }                       from "@/utils/cn";
import type { ChapterName }         from "@/types";

export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(
  { params }: { params: Promise<{ name: string }> }
): Promise<Metadata> {
  const { name } = await params;
  const decoded  = decodeURIComponent(name);
  return {
    title:       `${decoded} Chapter | TVS Nepal`,
    description: `TVS Nepal ${decoded} chapter — marshals, rides, and community.`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ChapterDetailPage(
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const chapterName = decodeURIComponent(name) as ChapterName;

  // Parallel fetch
  const [chapters, allMarshals, allRides] = await Promise.all([
    getChapters(),
    getMarshals(),
    getRides(),
  ]);

  const chapter = chapters.find((c) => c.name === chapterName);
  if (!chapter) notFound();

  // Marshals for this chapter
  const chapterMarshals = allMarshals
    .filter((m) => m.chapter === chapterName && m.isActive);

  // Upcoming rides for this chapter
  const upcomingRides = sortRidesByDate(
    allRides.filter(
      (r) => r.chapter === chapterName &&
             rideIsUpcoming(r.startDate) &&
             r.status !== "cancelled" &&
             r.status !== "postponed"
    )
  ).slice(0, 6);

  // Recent completed rides
  const recentRides = sortRidesByDate(
    allRides.filter(
      (r) => r.chapter === chapterName && r.status === "completed"
    )
  ).slice(0, 3);

  return (
    <main className="min-h-dvh">

      {/* ── Hero ── */}
      <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden">
        {chapter.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={chapter.coverImageUrl}
            alt={chapter.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-tvs-charcoal-900 via-tvs-charcoal-900 to-tvs-red-950/30 flex items-center justify-center">
            <ImageIcon className="size-16 text-tvs-charcoal-700" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-tvs-charcoal-950 via-tvs-charcoal-950/40 to-transparent" />

        {/* Back link */}
        <Link
          href="/chapters"
          className="absolute top-5 left-4 sm:left-6 lg:left-8 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tvs-charcoal-900/80 backdrop-blur-sm border border-tvs-charcoal-700/60 text-xs font-medium text-tvs-charcoal-300 hover:text-tvs-charcoal-50 transition-colors"
        >
          <ArrowLeft className="size-3" />
          All Chapters
        </Link>

        {/* Chapter name */}
        <div className="absolute bottom-5 left-4 sm:left-6 lg:left-8">
          <div className="flex items-center gap-2 mb-1">
            {chapter.isPriority && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-tvs-red-900/80 text-tvs-red-400 border border-tvs-red-800/40">
                Priority
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-tvs-charcoal-50">
            {chapter.name}
          </h1>
          <p className="text-sm text-tvs-charcoal-400 mt-0.5 flex items-center gap-1">
            <MapPin className="size-3" />{chapter.region}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

        {/* ── Stats + description ── */}
        <AnimateIn>
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Users className="size-4 text-tvs-charcoal-500" />
              <strong className="text-tvs-charcoal-50">{chapter.memberCount}</strong>
              <span className="text-tvs-charcoal-400">riders</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Bike className="size-4 text-tvs-charcoal-500" />
              <strong className="text-tvs-charcoal-50">{chapter.totalRidesThisYear}</strong>
              <span className="text-tvs-charcoal-400">rides this year</span>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
              chapter.isActive
                ? "bg-emerald-900/30 text-emerald-400 border-emerald-800/40"
                : "bg-tvs-charcoal-800 text-tvs-charcoal-500 border-tvs-charcoal-700"
            )}>
              <span className={cn("size-1.5 rounded-full", chapter.isActive ? "bg-emerald-400" : "bg-tvs-charcoal-600")} />
              {chapter.isActive ? "Active" : "Inactive"}
            </div>
          </div>

          {chapter.description && (
            <p className="text-sm text-tvs-charcoal-300 leading-relaxed max-w-2xl">
              {chapter.description}
            </p>
          )}
        </AnimateIn>

        {/* ── Marshals ── */}
        {chapterMarshals.length > 0 && (
          <AnimateIn>
            <div className="flex items-center gap-2 mb-6">
              <span className="block w-3 h-px bg-tvs-red-600 rounded-full" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-tvs-red-400">
                Chapter Marshals
              </h2>
            </div>
            <MarshalPageClient
              marshals={chapterMarshals}
              activeChapters={[chapterName]}
            />
          </AnimateIn>
        )}

        {/* ── Upcoming rides ── */}
        {upcomingRides.length > 0 && (
          <AnimateIn>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="block w-3 h-px bg-tvs-charcoal-500 rounded-full" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-tvs-charcoal-400">
                  Upcoming Rides
                </h2>
              </div>
              <Link href="/rides" className="text-xs text-tvs-red-400 hover:text-tvs-red-300 transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          </AnimateIn>
        )}

        {/* ── Recent rides ── */}
        {recentRides.length > 0 && (
          <AnimateIn>
            <div className="flex items-center gap-2 mb-6">
              <span className="block w-3 h-px bg-tvs-charcoal-600 rounded-full" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-tvs-charcoal-500">
                Recent Rides
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          </AnimateIn>
        )}

        {chapterMarshals.length === 0 && upcomingRides.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm text-tvs-charcoal-500">No marshals or upcoming rides for this chapter yet.</p>
          </div>
        )}

      </div>
    </main>
  );
}
