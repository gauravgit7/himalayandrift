// =============================================================================
// StatusBadge - ride operational status pill
// =============================================================================

import { cn } from "@/utils/cn";
import type { RideStatus } from "@/types";

interface StatusBadgeProps {
  status: RideStatus;
  size?: "xs" | "sm" | "md";
  showDot?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  RideStatus,
  { label: string; classes: string; dotColor: string }
> = {
  planned: {
    label:    "Planned",
    classes:  "bg-zinc-800 text-zinc-400 border border-zinc-700",
    dotColor: "bg-zinc-500",
  },
  tentative: {
    label:    "Tentative",
    classes:  "bg-amber-950 text-amber-400 border border-amber-800",
    dotColor: "bg-amber-500",
  },
  confirmed: {
    label:    "Confirmed",
    classes:  "bg-emerald-950 text-emerald-400 border border-emerald-800",
    dotColor: "bg-emerald-500",
  },
  postponed: {
    label:    "Postponed",
    classes:  "bg-red-950 text-red-400 border border-red-800",
    dotColor: "bg-red-500",
  },
  cancelled: {
    label:    "Cancelled",
    classes:  "bg-red-950/70 text-red-600 border border-red-900 line-through",
    dotColor: "bg-red-700",
  },
  completed: {
    label:    "Completed",
    classes:  "bg-blue-950 text-blue-400 border border-blue-800",
    dotColor: "bg-blue-500",
  },
};

const SIZE_STYLES = {
  xs: "text-[10px] px-1.5 py-0.5 gap-1",
  sm: "text-xs     px-2   py-0.5 gap-1.5",
  md: "text-sm     px-2.5 py-1   gap-1.5",
};

export function StatusBadge({
  status,
  size = "sm",
  showDot = true,
  className,
}: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        cfg.classes,
        SIZE_STYLES[size],
        className
      )}
    >
      {showDot && (
        <span className={cn("size-1.5 rounded-full shrink-0", cfg.dotColor)} />
      )}
      {cfg.label}
    </span>
  );
}
