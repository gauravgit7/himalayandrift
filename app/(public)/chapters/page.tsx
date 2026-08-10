// =============================================================================
// Public Chapters Page - grid of all 9 TVS Nepal chapters
// =============================================================================

import type { Metadata }  from "next";
import { MapPin, Users, Bike, ImageIcon } from "lucide-react";
import { getChapters }    from "@/lib/supabase/queries";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/shared/AnimateIn";
import { cn }             from "@/utils/cn";

export const metadata: Metadata = {
  title: "Chapters | TVS Nepal",
  description: "All 9 TVS Nepal riding chapters across Nepal - AOG & CULT communities.",
};

export const revalidate = 3600; // 1 hour

export default async function ChaptersPage() {
  const chapters = await getChapters();
  const priority  = chapters.filter((c) => c.isPriority);
  const standard  = chapters.filter((c) => !c.isPriority);

  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* Header */}
      <AnimateIn className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="block w-8 h-px bg-tvs-red-600 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-tvs-red-400">
            Community
          </span>
          <span className="block w-8 h-px bg-tvs-red-600 rounded-full" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-tvs-charcoal-50 mb-3">
          9 Chapters. One Nepal.
        </h1>
        <p className="text-sm sm:text-base text-tvs-charcoal-400 max-w-lg mx-auto leading-relaxed">
          TVS Nepal riding communities spread across every province - AOG &amp; CULT riders,
          one brotherhood.
        </p>
      </AnimateIn>

      {/* Priority chapters */}
      <AnimateIn className="mb-3">
        <div className="flex items-center gap-2 mb-5">
          <span className="block w-3 h-px bg-tvs-red-600 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-tvs-red-400">
            Priority Chapters
          </span>
        </div>
      </AnimateIn>
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {priority.map((chapter) => (
          <StaggerItem key={chapter.id}>
            <ChapterCard chapter={chapter} highlighted />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Standard chapters */}
      <AnimateIn className="mb-3">
        <div className="flex items-center gap-2 mb-5">
          <span className="block w-3 h-px bg-tvs-charcoal-600 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-tvs-charcoal-400">
            All Chapters
          </span>
        </div>
      </AnimateIn>
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {standard.map((chapter) => (
          <StaggerItem key={chapter.id}>
            <ChapterCard chapter={chapter} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Chapter Card
// ---------------------------------------------------------------------------

import Link             from "next/link";
import type { Chapter, Marshal } from "@/types";

// ---------------------------------------------------------------------------
// Marshal avatar stack
// ---------------------------------------------------------------------------
function MarshalStack({ marshals }: { marshals: Marshal[] }) {
  const active  = marshals.filter((m) => m.isActive);
  if (active.length === 0) return null;
  const visible  = active.slice(0, 2);
  const overflow = active.length - visible.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((m) => (
          m.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={m.id}
              src={m.avatarUrl}
              alt={m.name}
              title={`${m.name} - ${m.role}`}
              className="size-7 rounded-full object-cover border-2 border-tvs-charcoal-900"
            />
          ) : (
            <div
              key={m.id}
              title={`${m.name} - ${m.role}`}
              className="size-7 rounded-full bg-tvs-charcoal-700 border-2 border-tvs-charcoal-900 flex items-center justify-center text-[9px] font-bold text-tvs-charcoal-300"
            >
              {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
          )
        ))}
        {overflow > 0 && (
          <div className="size-7 rounded-full bg-tvs-charcoal-800 border-2 border-tvs-charcoal-900 flex items-center justify-center text-[9px] font-bold text-tvs-charcoal-400">
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-xs text-tvs-charcoal-500">
        {active.length} marshal{active.length !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter card
// ---------------------------------------------------------------------------
function ChapterCard({ chapter, highlighted = false }: { chapter: Chapter; highlighted?: boolean }) {
  return (
    <Link
      href={`/chapters/${encodeURIComponent(chapter.name)}`}
      className={cn(
        "group relative flex flex-col gap-3 p-5 rounded-xl gradient-card border transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-card cursor-pointer",
        highlighted
          ? "border-tvs-red-800/40 hover:border-tvs-red-700/60"
          : "border-tvs-charcoal-700 hover:border-tvs-charcoal-500"
      )}
    >
      {/* Cover image */}
      {chapter.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={chapter.coverImageUrl}
          alt={chapter.name}
          className="w-full h-28 object-cover rounded-lg"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-28 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 flex items-center justify-center">
          <ImageIcon className="size-6 text-tvs-charcoal-600" />
        </div>
      )}

      {/* Name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-black text-tvs-charcoal-50">{chapter.name}</h2>
            {highlighted && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-tvs-red-900/60 text-tvs-red-400 border border-tvs-red-800/40">
                Priority
              </span>
            )}
          </div>
          <p className="text-xs text-tvs-charcoal-500 mt-0.5">{chapter.region}</p>
        </div>
        <span className={cn(
          "size-2 rounded-full mt-1 shrink-0",
          chapter.isActive ? "bg-emerald-500" : "bg-tvs-charcoal-600"
        )} />
      </div>

      {/* Description */}
      {chapter.description && (
        <p className="text-xs text-tvs-charcoal-400 leading-relaxed line-clamp-2">
          {chapter.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-tvs-charcoal-800/60 text-xs text-tvs-charcoal-400">
        <span className="flex items-center gap-1">
          <Users className="size-3 text-tvs-charcoal-500" />
          <strong className="text-tvs-charcoal-200">{chapter.memberCount}</strong> riders
        </span>
        <span className="flex items-center gap-1">
          <Bike className="size-3 text-tvs-charcoal-500" />
          <strong className="text-tvs-charcoal-200">{chapter.totalRidesThisYear}</strong> rides
        </span>
      </div>
      {/* Marshal avatars */}
      {chapter.marshals.length > 0 && (
        <div className="pt-2 border-t border-tvs-charcoal-800/40">
          <MarshalStack marshals={chapter.marshals} />
        </div>
      )}

      {/* View detail hint */}
      <div className="flex items-center gap-1 text-[10px] text-tvs-charcoal-600 group-hover:text-tvs-red-400 transition-colors">
        <span>View chapter</span>
        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
      </div>
    </Link>
  );
}
