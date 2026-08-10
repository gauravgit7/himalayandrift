// =============================================================================
// SponsorShowcase - Phase 3 · Sponsor logos/names
// Server component - receives sponsors data as props
// Phase 9 · Fade-in label + title sponsor, staggered other sponsors row
// =============================================================================

import { cn } from "@/utils/cn";
import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/AnimateIn";
import type { Sponsor } from "@/types";

interface SponsorShowcaseProps {
  sponsors: Sponsor[];
}

// Tier display config
const TIER_CONFIG: Record<
  string,
  { label: string; order: number; size: "xl" | "lg" | "md" | "sm" }
> = {
  title:     { label: "Title Sponsor",     order: 0, size: "xl" },
  co:        { label: "Co-Sponsor",        order: 1, size: "lg" },
  associate: { label: "Associate Sponsor", order: 2, size: "md" },
  media:     { label: "Media Partner",     order: 3, size: "sm" },
};

// ---------------------------------------------------------------------------
// Logo placeholder (used until real logos are uploaded in Phase 6)
// ---------------------------------------------------------------------------

function LogoPlaceholder({
  name,
  size,
  tier,
}: {
  name: string;
  size: "xl" | "lg" | "md" | "sm";
  tier: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const sizeClasses = {
    xl: "h-16 w-48 text-lg",
    lg: "h-12 w-36 text-sm",
    md: "h-10 w-28 text-xs",
    sm: "h-8  w-24 text-[10px]",
  }[size];

  const isTitleSponsor = tier === "title";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border select-none font-bold tracking-wide",
        sizeClasses,
        isTitleSponsor
          ? "bg-tvs-red-950/50 border-tvs-red-800/40 text-tvs-red-400"
          : "bg-tvs-charcoal-800/60 border-tvs-charcoal-700/50 text-tvs-charcoal-400"
      )}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SponsorShowcase({ sponsors }: SponsorShowcaseProps) {
  if (sponsors.length === 0) return null;

  const sorted = [...sponsors].sort(
    (a, b) =>
      (TIER_CONFIG[a.tier]?.order ?? 99) - (TIER_CONFIG[b.tier]?.order ?? 99)
  );

  const titleSponsor     = sorted.filter((s) => s.tier === "title");
  const otherSponsors    = sorted.filter((s) => s.tier !== "title");

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 border-t border-tvs-charcoal-800/50">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <AnimateIn variant="fadeIn" className="flex items-center justify-center gap-3 mb-10">
          <span className="block flex-1 max-w-[80px] h-px bg-tvs-charcoal-800" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-tvs-charcoal-500">
            Powered by
          </span>
          <span className="block flex-1 max-w-[80px] h-px bg-tvs-charcoal-800" />
        </AnimateIn>

        {/* Title sponsor - centred, prominent */}
        {titleSponsor.map((sponsor) => (
          <AnimateIn key={sponsor.id} variant="fadeUp" delay={0.1}>
            <div className="flex flex-col items-center gap-3 mb-10">
              {sponsor.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  className="h-14 w-auto object-contain"
                />
              ) : (
                <LogoPlaceholder name={sponsor.name} size="xl" tier={sponsor.tier} />
              )}
              <div className="text-center">
                <p className="text-sm font-bold text-tvs-charcoal-100">{sponsor.name}</p>
                <p className="text-xs text-tvs-charcoal-500">
                  {TIER_CONFIG[sponsor.tier]?.label ?? sponsor.tier}
                </p>
              </div>
            </div>
          </AnimateIn>
        ))}

        {/* Other sponsors - staggered row */}
        <StaggerContainer
          className="flex flex-wrap items-end justify-center gap-8"
          stagger={0.07}
          delayStart={0.05}
        >
          {otherSponsors.map((sponsor) => {
            const tierCfg = TIER_CONFIG[sponsor.tier];
            return (
              <StaggerItem key={sponsor.id}>
                <div className="flex flex-col items-center gap-2 group">
                  {sponsor.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="h-9 w-auto object-contain opacity-60 group-hover:opacity-90 transition-opacity duration-200"
                    />
                  ) : (
                    <div className="opacity-60 group-hover:opacity-90 transition-opacity duration-200">
                      <LogoPlaceholder
                        name={sponsor.name}
                        size={tierCfg?.size ?? "sm"}
                        tier={sponsor.tier}
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs font-medium text-tvs-charcoal-400 group-hover:text-tvs-charcoal-200 transition-colors duration-200">
                      {sponsor.name}
                    </p>
                    <p className="text-[9px] text-tvs-charcoal-600">
                      {tierCfg?.label ?? sponsor.tier}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
