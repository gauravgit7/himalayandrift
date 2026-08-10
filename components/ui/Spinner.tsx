// =============================================================================
// Spinner - loading indicator
// =============================================================================

import { cn } from "@/utils/cn";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_STYLES = {
  xs: "size-3  border-[1.5px]",
  sm: "size-4  border-2",
  md: "size-6  border-2",
  lg: "size-10 border-[3px]",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-tvs-charcoal-500 border-t-tvs-red-500 animate-spin",
        SIZE_STYLES[size],
        className
      )}
    />
  );
}

// Full-page centered spinner
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[40dvh]">
      <Spinner size="lg" />
    </div>
  );
}
