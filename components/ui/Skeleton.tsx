// =============================================================================
// Skeleton - shimmer placeholders for loading states
// =============================================================================

import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

const ROUNDED = {
  sm:   "rounded",
  md:   "rounded-lg",
  lg:   "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton", ROUNDED[rounded], className)}
    />
  );
}

// Pre-built ride card skeleton
export function RideCardSkeleton() {
  return (
    <div className="gradient-card rounded-xl overflow-hidden border border-white/5 p-4 space-y-3">
      <Skeleton className="h-36 w-full" rounded="lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" rounded="full" />
        <Skeleton className="h-5 w-20" rounded="full" />
      </div>
    </div>
  );
}
