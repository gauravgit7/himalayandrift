// =============================================================================
// SeriesBadge - "Drift in the Mist — Vol III"
// Shown on ride cards, the ride detail page and series listings.
// =============================================================================

import Link from "next/link";
import { Layers } from "lucide-react";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/lib/constants";
import type { Series } from "@/types";

/** Roman numerals for volume numbers - "Vol III" reads better than "Vol 3". */
const ROMAN: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"],  [90, "XC"],  [50, "L"],  [40, "XL"],
  [10, "X"],   [9, "IX"],   [5, "V"],   [4, "IV"], [1, "I"],
];

export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return String(n);
  let rest = n;
  let out  = "";
  for (const [value, numeral] of ROMAN) {
    while (rest >= value) {
      out += numeral;
      rest -= value;
    }
  }
  return out;
}

/** "Drift in the Mist — Vol III", or just the name when there is no volume. */
export function formatSeriesLabel(series: Series, volume: number | null): string {
  return volume ? `${series.name} — Vol ${toRoman(volume)}` : series.name;
}

interface SeriesBadgeProps {
  series:    Series;
  volume?:   number | null;
  size?:     "xs" | "sm";
  /** Link through to the series page. Off inside cards that are already links. */
  asLink?:   boolean;
  className?: string;
}

export function SeriesBadge({
  series,
  volume = null,
  size = "sm",
  asLink = false,
  className,
}: SeriesBadgeProps) {
  const label = formatSeriesLabel(series, volume);

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        "bg-hd-ember-950/70 text-hd-ember-300 border border-hd-ember-800/50",
        size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1",
        asLink && "hover:border-hd-ember-600 hover:text-hd-ember-200 transition-colors",
        className,
      )}
      title={label}
    >
      <Layers className={size === "xs" ? "size-2.5 shrink-0" : "size-3 shrink-0"} />
      <span className="truncate">{label}</span>
    </span>
  );

  if (!asLink) return content;

  return <Link href={ROUTES.seriesDetail(series.slug)}>{content}</Link>;
}
