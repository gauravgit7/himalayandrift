// =============================================================================
// Root loading state - shown during page transitions
// =============================================================================

import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
