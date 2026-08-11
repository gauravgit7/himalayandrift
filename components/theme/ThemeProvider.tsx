// =============================================================================
// ThemeProvider - light / dark mode context
// "use client" - reads localStorage, writes class to <html>
//
// Usage:
//   1. Wrap root layout children with <ThemeProvider>
//   2. Use <ThemeToggle /> anywhere in the tree to render the button
//   3. useTheme() for programmatic access
// =============================================================================

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme:  Theme;
  toggle: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextValue>({
  theme:  "dark",
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to dark; the inline script in layout.tsx has already set the
  // correct class on <html> before paint - this state catches up on mount.
  const [theme, setTheme] = useState<Theme>("dark");

  // Sync state with the class that the inline script applied
  useEffect(() => {
    const stored = localStorage.getItem("hd-theme") as Theme | null;
    const resolved: Theme = stored === "light" ? "light" : "dark";
    setTheme(resolved);
    applyClass(resolved);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("hd-theme", next);
      applyClass(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyClass(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
  } else {
    root.classList.remove("light");
  }
}
