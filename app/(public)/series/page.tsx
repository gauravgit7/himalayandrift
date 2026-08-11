// =============================================================================
// Series index - every named ride series
// ISR: 1 hour
// =============================================================================

import type { Metadata } from "next";
import Link              from "next/link";
import { Layers, ArrowRight } from "lucide-react";

import { getSeries, getSeriesRideCounts } from "@/lib/supabase/queries";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/shared/AnimateIn";
import { ROUTES, APP_META } from "@/lib/constants";

export const metadata: Metadata = {
  title:       `Ride Series | ${APP_META.name}`,
  description: "Our recurring ride series, released in volumes.",
};

export const revalidate = 3600; // 1 hour

export default async function SeriesIndexPage() {
  const [series, counts] = await Promise.all([
    getSeries(),
    getSeriesRideCounts(),
  ]);

  return (
    <main className="min-h-dvh max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

      {/* Header */}
      <AnimateIn className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="block w-8 h-px bg-hd-ember-600 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
            Series
          </span>
          <span className="block w-8 h-px bg-hd-ember-600 rounded-full" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-hd-ink-50 mb-3">
          Ride Series
        </h1>
        <p className="text-sm sm:text-base text-hd-ink-400 max-w-lg mx-auto leading-relaxed">
          Rides that come back. Each series releases in volumes — a volume might be
          an overnight one year and a multi-day the next.
        </p>
      </AnimateIn>

      {/* Empty state */}
      {series.length === 0 ? (
        <div className="py-20 text-center">
          <Layers className="size-12 mx-auto mb-4 text-hd-ink-700" />
          <p className="text-sm text-hd-ink-500">No series yet.</p>
        </div>
      ) : (
        <StaggerContainer className="grid sm:grid-cols-2 gap-5">
          {series.map((s) => {
            const count = counts[s.id] ?? 0;
            return (
              <StaggerItem key={s.id}>
                <Link
                  href={ROUTES.seriesDetail(s.slug)}
                  className="group flex flex-col h-full overflow-hidden rounded-xl gradient-card border border-hd-ink-700/60 hover:border-hd-ember-700/60 transition-all duration-300 hover:-translate-y-0.5"
                >
                  {/* Banner */}
                  <div className="relative h-32 shrink-0 overflow-hidden gradient-brand">
                    {s.bannerUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.bannerUrl}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>

                  <div className="flex flex-col flex-1 p-5 gap-2">
                    <h2 className="text-lg font-black text-hd-ink-50 group-hover:text-white transition-colors">
                      {s.name}
                    </h2>
                    {s.description && (
                      <p className="text-sm text-hd-ink-400 line-clamp-3">{s.description}</p>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="text-xs text-hd-ink-500">
                        {count === 0
                          ? "No volumes yet"
                          : `${count} volume${count === 1 ? "" : "s"}`}
                      </span>
                      <ArrowRight className="size-4 text-hd-ember-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </main>
  );
}
