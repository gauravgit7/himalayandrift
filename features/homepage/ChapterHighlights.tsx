// =============================================================================
// ChapterHighlights - Phase 3 · All 9 chapters grid
// Server component - receives chapters data as props
// Priority 4 chapters rendered with more visual weight
// Phase 9 · Staggered entrance via AnimateIn / StaggerContainer / StaggerItem
// =============================================================================

import { cn } from "@/utils/cn";
import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/AnimateIn";
import type { Chapter } from "@/types";

interface ChapterHighlightsProps {
  chapters: Chapter[];
}

// ---------------------------------------------------------------------------
// Marshal avatar stack - shows up to 2 faces + overflow count
// ---------------------------------------------------------------------------

import type { Marshal } from "@/types";

function MarshalStack({ marshals }: { marshals: Marshal[] }) {
  const active = marshals.filter((m) => m.isActive);
  if (active.length === 0) return null;

  const visible  = active.slice(0, 2);
  const overflow = active.length - visible.length;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {visible.map((m) => (
          m.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={m.id}
              src={m.avatarUrl}
              alt={m.name}
              title={`${m.name} - ${m.role}`}
              className="size-6 rounded-full object-cover border-2 border-tvs-charcoal-900 ring-1 ring-tvs-charcoal-700"
            />
          ) : (
            <div
              key={m.id}
              title={`${m.name} - ${m.role}`}
              className="size-6 rounded-full bg-tvs-charcoal-700 border-2 border-tvs-charcoal-900 ring-1 ring-tvs-charcoal-600 flex items-center justify-center text-[8px] font-bold text-tvs-charcoal-300"
            >
              {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
          )
        ))}
        {overflow > 0 && (
          <div className="size-6 rounded-full bg-tvs-charcoal-800 border-2 border-tvs-charcoal-900 flex items-center justify-center text-[8px] font-bold text-tvs-charcoal-400">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single chapter card
// ---------------------------------------------------------------------------

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const isPriority = chapter.isPriority;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border p-5 transition-all duration-300",
        isPriority
          ? "gradient-card border-tvs-red-900/40 hover:border-tvs-red-700/50"
          : "bg-tvs-charcoal-900/60 border-tvs-charcoal-800 hover:border-tvs-charcoal-700"
      )}
    >
      {/* Priority indicator */}
      {isPriority && (
        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-tvs-red-700/60 to-transparent" />
      )}

      {/* Top row: name + priority badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "font-bold leading-tight",
                isPriority ? "text-tvs-charcoal-50 text-base" : "text-tvs-charcoal-100 text-sm"
              )}
            >
              {chapter.name}
            </h3>
            {isPriority && (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-tvs-red-900/60 text-tvs-red-400 border border-tvs-red-800/40">
                Priority
              </span>
            )}
          </div>
          <p className="text-xs text-tvs-charcoal-500 mt-0.5">{chapter.region}</p>
        </div>
        {/* Activity dot */}
        <span
          className={cn(
            "mt-0.5 shrink-0 size-2 rounded-full",
            chapter.isActive ? "bg-emerald-500" : "bg-tvs-charcoal-600"
          )}
          title={chapter.isActive ? "Active" : "Inactive"}
        />
      </div>

      {/* Description */}
      <p className="text-xs text-tvs-charcoal-400 leading-relaxed line-clamp-2 flex-1">
        {chapter.description}
      </p>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-3 border-t border-tvs-charcoal-800/60">
        <div className="flex items-center gap-3">
          <div>
            <p
              className={cn(
                "font-black tabular-nums",
                isPriority ? "text-base text-tvs-charcoal-50" : "text-sm text-tvs-charcoal-200"
              )}
            >
              {chapter.totalRidesThisYear}
            </p>
            <p className="text-[10px] text-tvs-charcoal-500">rides</p>
          </div>
          <div className="w-px h-6 bg-tvs-charcoal-800" />
          <div>
            <p
              className={cn(
                "font-black tabular-nums",
                isPriority ? "text-base text-tvs-charcoal-50" : "text-sm text-tvs-charcoal-200"
              )}
            >
              {chapter.memberCount}
            </p>
            <p className="text-[10px] text-tvs-charcoal-500">riders</p>
          </div>
        </div>

        {/* Marshal avatars */}
        <MarshalStack marshals={chapter.marshals} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChapterHighlights({ chapters }: ChapterHighlightsProps) {
  if (chapters.length === 0) return null;

  const priorityChapters  = chapters.filter((c) => c.isPriority);
  const standardChapters  = chapters.filter((c) => !c.isPriority);
  const totalMembers      = chapters.reduce((sum, c) => sum + c.memberCount, 0);
  const totalRides        = chapters.reduce((sum, c) => sum + c.totalRidesThisYear, 0);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section header */}
      <AnimateIn className="flex items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="block w-4 h-px bg-tvs-red-600 rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-widest text-tvs-red-400">
              The Community
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-tvs-charcoal-50">
            9 Chapters · All Nepal
          </h2>
          <p className="mt-1.5 text-sm text-tvs-charcoal-400">
            {totalMembers.toLocaleString()} riders across{" "}
            {chapters.length} chapters - {totalRides} rides this year.
          </p>
        </div>
      </AnimateIn>

      {/* Priority chapters - larger, 2-col on md */}
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {priorityChapters.map((chapter) => (
          <StaggerItem key={chapter.id}>
            <ChapterCard chapter={chapter} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Standard chapters - smaller, 5-col on lg */}
      <StaggerContainer className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" delayStart={0.05}>
        {standardChapters.map((chapter) => (
          <StaggerItem key={chapter.id}>
            <ChapterCard chapter={chapter} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Footer note */}
      <AnimateIn className="mt-6 text-center" variant="fadeIn" delay={0.15}>
        <p className="text-xs text-tvs-charcoal-600">
          Priority chapters receive dedicated monthly AOG rides · All chapters participate in national &amp; marquee events
        </p>
      </AnimateIn>
    </section>
  );
}
