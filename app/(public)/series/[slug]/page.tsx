// =============================================================================
// Series detail - every volume of one series, in order
// ISR: 1 hour
// =============================================================================

import type { Metadata } from "next";
import Link              from "next/link";
import { notFound }      from "next/navigation";
import { ArrowLeft, Layers } from "lucide-react";

import {
  getSeriesBySlug,
  getRidesBySeries,
  getBrandLogos,
} from "@/lib/supabase/queries";
import { RideCard }   from "@/components/shared/RideCard";
import { AnimateIn }  from "@/components/shared/AnimateIn";
import { toRoman }    from "@/components/shared/SeriesBadge";
import { ROUTES } from "@/lib/constants";

export const revalidate = 3600; // 1 hour

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series   = await getSeriesBySlug(slug);
  if (!series) return { title: "Series Not Found" };
  return {
    title:       series.name,
    description: series.description ?? `Every volume of ${series.name}.`,
  };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const series   = await getSeriesBySlug(slug);
  if (!series) notFound();

  const [rides, brandLogos] = await Promise.all([
    getRidesBySeries(series.id),
    getBrandLogos(),
  ]);

  return (
    <main className="min-h-dvh pb-20">

      {/* Hero */}
      <section className="dark-surface relative bg-gradient-to-b from-hd-ember-950 via-hd-ink-950 to-hd-ink-950 pt-28 pb-10 px-4">
        {series.bannerUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={series.bannerUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-hd-ink-950 via-hd-ink-950/60 to-transparent" />
          </>
        )}

        <div className="relative max-w-5xl mx-auto">
          <Link
            href={ROUTES.series}
            className="inline-flex items-center gap-1.5 text-sm text-hd-ink-400 hover:text-hd-ink-100 transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            All Series
          </Link>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-hd-ember-400 mb-3">
            <Layers className="size-3.5" />
            Series
          </span>

          <h1 className="text-4xl sm:text-5xl font-black text-hd-ink-50 mb-3">
            {series.name}
          </h1>

          {series.description && (
            <p className="text-sm sm:text-base text-hd-ink-300 max-w-2xl leading-relaxed">
              {series.description}
            </p>
          )}

          <p className="mt-4 text-xs text-hd-ink-500">
            {rides.length === 0
              ? "No volumes announced yet."
              : `${rides.length} volume${rides.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </section>

      {/* Volumes */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {rides.length === 0 ? (
          <div className="py-16 text-center text-hd-ink-600 text-sm space-y-2">
            <p className="text-2xl">🏔️</p>
            <p>The next volume hasn&apos;t been announced yet.</p>
            <Link
              href={ROUTES.calendar}
              className="inline-block text-hd-ember-400 hover:text-hd-ember-300 text-xs underline underline-offset-2 transition-colors"
            >
              See the full calendar
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {rides.map((ride) => (
              <AnimateIn key={ride.id}>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Volume marker */}
                  <div className="shrink-0 w-full sm:w-24 sm:pt-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-hd-ember-500">
                      {ride.volume ? `Vol ${toRoman(ride.volume)}` : "Unnumbered"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <RideCard ride={ride} brandLogos={brandLogos} />
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
