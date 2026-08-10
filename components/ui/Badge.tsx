// =============================================================================
// Badge - small label chips for status, community, priority, type
// Server component - no interactivity needed
// =============================================================================

import { cn } from "@/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "ghost";
type BadgeSize    = "xs" | "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;            // show colored dot before text
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: "bg-tvs-charcoal-700  text-tvs-charcoal-200 border border-tvs-charcoal-600",
  success: "bg-emerald-950       text-emerald-400       border border-emerald-800",
  warning: "bg-amber-950         text-amber-400         border border-amber-800",
  danger:  "bg-red-950           text-red-400           border border-red-800",
  info:    "bg-blue-950          text-blue-400          border border-blue-800",
  ghost:   "bg-white/5           text-tvs-charcoal-300  border border-white/10",
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  xs: "text-[10px] px-1.5 py-0.5 gap-1",
  sm: "text-xs     px-2   py-0.5 gap-1.5",
  md: "text-sm     px-2.5 py-1   gap-1.5",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className,
  style,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      style={style}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current opacity-80 shrink-0" />
      )}
      {children}
    </span>
  );
}
