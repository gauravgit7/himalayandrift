// =============================================================================
// InstallPrompt — homepage inline install banner
// Android: captures beforeinstallprompt → Install button → Installing… → ✓
// iOS Safari: shows tap-Share → Add-to-Home-Screen instructions
// Hidden when: already installed, dismissed, or not installable
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Smartphone, X, Share, Download,
         Loader2, CheckCircle2 }            from "lucide-react";
import { cn }                               from "@/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Status =
  | "hidden"      // not shown (not installable, already installed, or dismissed)
  | "android"     // installable — show Install button
  | "ios"         // iOS Safari — show Share instructions
  | "installing"  // user accepted — waiting for appinstalled event
  | "installed";  // appinstalled fired — show success then fade out

const DISMISSED_KEY = "tvs-install-dismissed";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InstallPrompt() {
  const [status,         setStatus]         = useState<Status>("hidden");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    // Already running as installed PWA — never show
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const ua       = navigator.userAgent.toLowerCase();
    const isIos    = /iphone|ipad|ipod/.test(ua);
    const isSafari = isIos && /safari/.test(ua) && !/chrome|crios|fxios|opios/.test(ua);

    if (isSafari) {
      setStatus("ios");
      return;
    }

    // Android / desktop Chrome
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setStatus("android");
    };

    // appinstalled: fires when the icon actually lands on the home screen.
    // Don't write DISMISSED_KEY here — if the user later uninstalls and
    // revisits in the browser, beforeinstallprompt will fire again naturally
    // and the banner should reappear.
    const onInstalled = () => {
      setStatus("installed");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Auto-dismiss success state after 4 seconds
  useEffect(() => {
    if (status !== "installed") return;
    const t = setTimeout(() => setStatus("hidden"), 4000);
    return () => clearTimeout(t);
  }, [status]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);

      if (outcome === "accepted") {
        // Show installing state immediately — appinstalled event will
        // fire when the icon actually lands (a few seconds on Android)
        setStatus("installing");
      }
      // If dismissed, keep the banner showing so they can try again
    } catch {
      setStatus("android");
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setStatus("hidden");
    localStorage.setItem(DISMISSED_KEY, "true");
  }, []);

  if (status === "hidden") return null;

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-3 mb-0 z-10">
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-tvs-charcoal-900/95 border backdrop-blur-sm shadow-lg",
        "animate-in slide-in-from-top-2 duration-300",
        status === "installed"
          ? "border-emerald-800/60"
          : "border-tvs-charcoal-700/80",
      )}>

        {/* Icon */}
        <div className={cn(
          "shrink-0 size-8 rounded-lg border flex items-center justify-center transition-colors duration-300",
          status === "installed"
            ? "bg-emerald-900/40 border-emerald-800/40"
            : status === "installing"
            ? "bg-tvs-charcoal-800 border-tvs-charcoal-700"
            : "bg-tvs-red-900/40 border-tvs-red-800/40",
        )}>
          {status === "installed" ? (
            <CheckCircle2 className="size-4 text-emerald-400" />
          ) : status === "installing" ? (
            <Loader2 className="size-4 text-tvs-charcoal-400 animate-spin" />
          ) : (
            <Smartphone className="size-4 text-tvs-red-400" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {status === "installed" && (
            <>
              <p className="text-xs font-semibold text-emerald-300 leading-tight">
                Installed successfully!
              </p>
              <p className="text-[10px] text-emerald-600 leading-tight mt-0.5">
                TVS Nepal Rides is now on your home screen
              </p>
            </>
          )}

          {status === "installing" && (
            <>
              <p className="text-xs font-semibold text-tvs-charcoal-200 leading-tight">
                Installing…
              </p>
              <p className="text-[10px] text-tvs-charcoal-500 leading-tight mt-0.5">
                Check your home screen in a moment
              </p>
            </>
          )}

          {status === "android" && (
            <>
              <p className="text-xs font-semibold text-tvs-charcoal-100 leading-tight">
                Install TVS Nepal Rides
              </p>
              <p className="text-[10px] text-tvs-charcoal-500 leading-tight mt-0.5 hidden sm:block">
                Add to your home screen — works offline too
              </p>
            </>
          )}

          {status === "ios" && (
            <>
              <p className="text-xs font-semibold text-tvs-charcoal-100 leading-tight">
                Add to Home Screen
              </p>
              <p className="text-[10px] text-tvs-charcoal-400 leading-tight mt-0.5 flex items-center gap-1 flex-wrap">
                Tap
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-[9px] font-medium text-tvs-charcoal-300">
                  <Share className="size-2.5" /> Share
                </span>
                then
                <span className="text-tvs-charcoal-200 font-medium">&ldquo;Add to Home Screen&rdquo;</span>
              </p>
            </>
          )}
        </div>

        {/* Install button — android only */}
        {status === "android" && (
          <button
            onClick={handleInstall}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red text-white text-xs font-semibold transition-all"
          >
            <Download className="size-3" />
            Install
          </button>
        )}

        {/* Dismiss — hidden during install flow */}
        {status !== "installing" && (
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1.5 rounded-lg text-tvs-charcoal-500 hover:text-tvs-charcoal-200 hover:bg-tvs-charcoal-800 transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        )}

      </div>
    </div>
  );
}
