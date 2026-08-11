// =============================================================================
// ThemeToggle - animated Sun ↔ Moon button
// "use client" - reads theme context, calls toggle()
// =============================================================================

"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/utils/cn";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative size-9 rounded-lg flex items-center justify-center",
        "border transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hd-ember-500 focus-visible:ring-offset-1",
        isDark
          ? [
              "border-hd-ink-700 text-hd-ink-300",
              "hover:border-hd-ink-500 hover:text-white hover:bg-hd-ink-800",
            ]
          : [
              "border-hd-ink-700 text-hd-ink-400",
              "hover:border-hd-ink-500 hover:text-hd-ink-100 hover:bg-hd-ink-800",
            ],
        className
      )}
    >
      {/* Sun - visible in dark mode (click to go light) */}
      <Sun
        className={cn(
          "size-4 absolute transition-all duration-300",
          isDark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-75"
        )}
      />
      {/* Moon - visible in light mode (click to go dark) */}
      <Moon
        className={cn(
          "size-4 absolute transition-all duration-300",
          isDark
            ? "opacity-0 -rotate-90 scale-75"
            : "opacity-100 rotate-0 scale-100"
        )}
      />
    </button>
  );
}
