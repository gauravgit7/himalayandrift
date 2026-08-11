// =============================================================================
// RideDateDisplay - renders a ride date range with AD/BS mode awareness
// Pure presentational - receives dateMode as prop (no hook inside)
// =============================================================================

import { formatRideDateRange } from "@/utils/date";
import { formatBsDateRange }   from "@/utils/nepali-date";
import { cn }                  from "@/utils/cn";
import type { DateMode }       from "@/hooks/useDateMode";

interface RideDateDisplayProps {
  startDate:  string;
  endDate:    string;
  dateMode?:  DateMode;   // default "ad"
  className?: string;
  /** When true, stacks primary + reference vertically (default).
   *  When false, shows only the primary date (compact mode). */
  showReference?: boolean;
}

export function RideDateDisplay({
  startDate,
  endDate,
  dateMode = "ad",
  className,
  showReference = true,
}: RideDateDisplayProps) {
  const adDate = formatRideDateRange(startDate, endDate);
  const bsDate = formatBsDateRange(startDate, endDate);

  const primary   = dateMode === "bs" ? bsDate : adDate;
  const reference = dateMode === "bs" ? adDate  : bsDate;

  return (
    <span className={cn("flex flex-col leading-tight", className)}>
      <span className="text-hd-ink-200">{primary}</span>
      {showReference && (
        <span className="text-[10px] text-hd-ink-500 mt-0.5">{reference}</span>
      )}
    </span>
  );
}
