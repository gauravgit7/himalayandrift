// =============================================================================
// CommunityBadge - AOG / CULT / AOG×CULT pill
//
// When brandLogos are provided the badge shows the actual logo images instead
// of text + dot.  For AOGxCULT it renders both logos with a × separator —
// matching the pattern already used in the RideCard banner overlay.
// Falls back to the coloured text pill when logos are absent.
// =============================================================================

import { cn } from "@/utils/cn";
import type { Community, BrandLogos } from "@/types";

interface CommunityBadgeProps {
  community:   Community;
  size?:       "xs" | "sm" | "md";
  className?:  string;
  /** When supplied, the badge renders logo images instead of text. */
  brandLogos?: BrandLogos | null;
}

// ---------------------------------------------------------------------------
// Text-fallback config (used when no logos are available)
// ---------------------------------------------------------------------------

const COMMUNITY_CONFIG: Record<
  Community,
  { label: string; classes: string; dot: string }
> = {
  AOG: {
    label:   "AOG",
    classes: "bg-tvs-red-950 text-tvs-red-400 border border-tvs-red-800",
    dot:     "bg-tvs-red-500",
  },
  CULT: {
    label:   "CULT",
    classes: "bg-tvs-steel-900 text-tvs-steel-400 border border-tvs-steel-700",
    dot:     "bg-tvs-steel-500",
  },
  AOGxCULT: {
    label:   "AOG × CULT",
    classes: "bg-violet-950 text-violet-400 border border-violet-800",
    dot:     "bg-violet-500",
  },
};

const SIZE_STYLES = {
  xs: "text-[10px] px-1.5 py-0.5 gap-1",
  sm: "text-xs     px-2   py-0.5 gap-1.5",
  md: "text-sm     px-2.5 py-1   gap-1.5",
};

// Logo image heights — sized to match the equivalent text height
const LOGO_H = {
  xs: "h-3",    // ≈ 12px  (matches text-[10px] cap height)
  sm: "h-3.5",  // ≈ 14px  (matches text-xs cap height)
  md: "h-4",    // ≈ 16px  (matches text-sm cap height)
};

// Container when rendering logo images: minimal dark pill, no brand colour fill
const LOGO_PILL = [
  "inline-flex items-center gap-1",
  "px-1.5 py-0.5 rounded-md",
  "bg-tvs-charcoal-800/80 border border-tvs-charcoal-700/50",
  "whitespace-nowrap",
].join(" ");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityBadge({
  community,
  size = "sm",
  className,
  brandLogos,
}: CommunityBadgeProps) {
  const aogLogoUrl  = brandLogos?.aogLogoUrl  ?? null;
  const cultLogoUrl = brandLogos?.cultLogoUrl ?? null;

  // ── Logo mode ─────────────────────────────────────────────────────────────

  if (community === "AOGxCULT" && aogLogoUrl && cultLogoUrl) {
    return (
      <span className={cn(LOGO_PILL, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={aogLogoUrl}  alt="AOG"  className={cn(LOGO_H[size], "w-auto object-contain")} />
        <span className="text-[7px] leading-none text-tvs-charcoal-500 font-bold select-none">×</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cultLogoUrl} alt="CULT" className={cn(LOGO_H[size], "w-auto object-contain")} />
      </span>
    );
  }

  if (community === "AOG" && aogLogoUrl) {
    return (
      <span className={cn(LOGO_PILL, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={aogLogoUrl} alt="AOG" className={cn(LOGO_H[size], "w-auto object-contain")} />
      </span>
    );
  }

  if (community === "CULT" && cultLogoUrl) {
    return (
      <span className={cn(LOGO_PILL, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cultLogoUrl} alt="CULT" className={cn(LOGO_H[size], "w-auto object-contain")} />
      </span>
    );
  }

  // ── Text fallback (no logos uploaded yet) ─────────────────────────────────

  const cfg = COMMUNITY_CONFIG[community];
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full whitespace-nowrap tracking-wide",
        cfg.classes,
        SIZE_STYLES[size],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
