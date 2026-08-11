// =============================================================================
// useDateMode - AD / BS date display mode preference
// 'use client' - reads/writes localStorage, hydration-safe (starts "ad" on
// SSR; updates to stored value after first client render).
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";

export type DateMode = "ad" | "bs";

const STORAGE_KEY = "hd-date-mode";

export function useDateMode(): {
  mode:   DateMode;
  toggle: () => void;
  setMode:(m: DateMode) => void;
} {
  // Start with "ad" on server + first render to avoid hydration mismatch.
  // After mount we'll read localStorage and sync.
  const [mode, setModeState] = useState<DateMode>("ad");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as DateMode | null;
      if (stored === "bs") setModeState("bs");
    } catch { /* private browsing may block localStorage */ }
  }, []);

  const setMode = useCallback((m: DateMode) => {
    setModeState(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: DateMode = prev === "ad" ? "bs" : "ad";
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { mode, toggle, setMode };
}
