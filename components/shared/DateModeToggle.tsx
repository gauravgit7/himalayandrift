// =============================================================================
// DateModeToggle - AD / BS date mode pill toggle
// 'use client' - uses useDateMode hook
// Props:
//   mode   - current mode (pass from parent's useDateMode())
//   toggle - toggle function (pass from parent's useDateMode())
//   size   - "sm" (default) or "xs" for tighter spaces
// =============================================================================

"use client";

import { cn } from "@/utils/cn";
import type { DateMode } from "@/hooks/useDateMode";

interface DateModeToggleProps {
  mode:    DateMode;
  toggle:  () => void;
  size?:   "xs" | "sm";
  className?: string;
}

export function DateModeToggle({
  mode,
  toggle,
  size = "sm",
  className,
}: DateModeToggleProps) {
  const isXs = size === "xs";

  return (
    <button
      onClick={toggle}
      title={mode === "ad" ? "Switch to Nepali (BS) dates" : "Switch to English (AD) dates"}
      className={cn(
        "flex items-center rounded-lg border transition-colors duration-200 cursor-pointer",
        "bg-tvs-charcoal-900 border-tvs-charcoal-700/60 hover:border-tvs-charcoal-600",
        isXs ? "text-[10px] p-0.5 gap-0.5" : "text-xs p-1 gap-1",
        className
      )}
      aria-label={`Date mode: ${mode === "ad" ? "Gregorian (AD)" : "Bikram Sambat (BS)"}`}
    >
      <span className={cn(
        "px-2 py-0.5 rounded-md font-bold transition-all duration-200",
        isXs ? "px-1.5 py-0.5" : "px-2 py-0.5",
        mode === "ad"
          ? "bg-tvs-red-600 text-white shadow-sm"
          : "text-tvs-charcoal-500 hover:text-tvs-charcoal-400"
      )}>
        AD
      </span>
      <span className={cn(
        "px-2 py-0.5 rounded-md font-bold transition-all duration-200",
        isXs ? "px-1.5 py-0.5" : "px-2 py-0.5",
        mode === "bs"
          ? "bg-tvs-red-600 text-white shadow-sm"
          : "text-tvs-charcoal-500 hover:text-tvs-charcoal-400"
      )}>
        BS
      </span>
    </button>
  );
}
