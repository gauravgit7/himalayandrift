// =============================================================================
// className utility - combines clsx + tailwind-merge
// Prevents conflicting Tailwind classes and handles conditional classes cleanly
// =============================================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
