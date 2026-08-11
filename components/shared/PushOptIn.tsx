// =============================================================================
// PushOptIn — Web Push subscription prompt
// Style (banner vs modal) and delay are driven by push_settings from Supabase.
// localStorage key "hd-push-dismissed" prevents reshowing after dismiss.
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X, BellOff }                 from "lucide-react";
import { cn }                               from "@/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PushOptInSettings {
  enabled:          boolean;
  promptStyle:      "banner" | "modal";
  promptDelaySecs:  number;
  promptPage:       "home" | "rides" | "any";
}

interface PushOptInProps {
  settings: PushOptInSettings;
  /** Current page slug for promptPage matching */
  page?:    "home" | "rides";
}

// ---------------------------------------------------------------------------
// Push subscription helper
// ---------------------------------------------------------------------------

async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const reg     = await navigator.serviceWorker.ready;
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) { console.warn("VAPID public key not set"); return null; }

  // urlBase64ToUint8Array — standard conversion for applicationServerKey
  const padding  = "=".repeat((4 - (vapidKey.length % 4)) % 4);
  const base64   = (vapidKey + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData  = window.atob(base64);
  const keyData  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) keyData[i] = rawData.charCodeAt(i);

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: keyData,
  });

  return subscription;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PushOptIn({ settings, page = "home" }: PushOptInProps) {
  const [visible,    setVisible]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Determine whether to show based on page setting
  const shouldShowOnPage =
    settings.promptPage === "any" ||
    settings.promptPage === page;

  useEffect(() => {
    if (!settings.enabled) return;
    if (!shouldShowOnPage) return;

    // Don't show if already subscribed or dismissed
    if (localStorage.getItem("hd-push-subscribed") === "true") return;
    if (localStorage.getItem("hd-push-dismissed")  === "true") return;

    // Don't show if push isn't supported
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Delay before showing
    const timer = setTimeout(() => setVisible(true), settings.promptDelaySecs * 1000);
    return () => clearTimeout(timer);
  }, [settings, shouldShowOnPage]);

  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setVisible(false);
        localStorage.setItem("hd-push-dismissed", "true");
        return;
      }

      const sub = await subscribeToPush();
      if (!sub) throw new Error("Subscription failed");

      const subJson = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          endpoint: sub.endpoint,
          keys:     subJson.keys,
        }),
      });

      localStorage.setItem("hd-push-subscribed", "true");
      setSubscribed(true);
      setTimeout(() => setVisible(false), 2500);
    } catch (err) {
      console.error("[PushOptIn]", err);
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem("hd-push-dismissed", "true");
  }, []);

  if (!visible) return null;

  // ── Modal style ────────────────────────────────────────────────────────────
  if (settings.promptStyle === "modal") {
    return (
      <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />
        <div className="relative w-full max-w-sm bg-hd-ink-900 border border-hd-ink-700 rounded-2xl shadow-cinematic p-6 space-y-5">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-hd-ink-500 hover:text-hd-ink-200 hover:bg-hd-ink-800 transition-colors"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-hd-ember-900/40 border border-hd-ember-800/40 flex items-center justify-center shrink-0">
              <Bell className="size-6 text-hd-ember-400" />
            </div>
            <div>
              <h3 className="font-bold text-hd-ink-50">Stay in the loop</h3>
              <p className="text-xs text-hd-ink-400 mt-0.5">
                Get notified when new rides drop
              </p>
            </div>
          </div>

          <p className="text-sm text-hd-ink-300 leading-relaxed">
            Enable notifications for ride reminders, new ride announcements, and when registration opens.
          </p>

          <OptInActions
            subscribed={subscribed}
            loading={loading}
            onSubscribe={handleSubscribe}
            onDismiss={handleDismiss}
          />
        </div>
      </div>
    );
  }

  // ── Banner style (default) ─────────────────────────────────────────────────
  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[500]",
      "bg-hd-ink-900 border border-hd-ink-700 rounded-2xl shadow-cinematic",
      "flex items-center gap-3 p-4",
      "animate-in slide-in-from-bottom-4 duration-300",
    )}>
      {subscribed ? (
        <>
          <div className="size-8 rounded-lg bg-emerald-900/40 border border-emerald-800/40 flex items-center justify-center shrink-0">
            <Bell className="size-4 text-emerald-400" />
          </div>
          <p className="flex-1 text-sm font-semibold text-emerald-300">
            Notifications enabled!
          </p>
        </>
      ) : (
        <>
          <div className="size-8 rounded-lg bg-hd-ember-900/40 border border-hd-ember-800/40 flex items-center justify-center shrink-0">
            <Bell className="size-4 text-hd-ember-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-hd-ink-100 truncate">
              Get ride notifications
            </p>
            <p className="text-[10px] text-hd-ink-500 truncate">
              Reminders, new rides & registrations
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className={cn(
                "px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all",
                loading
                  ? "bg-hd-ink-700 cursor-not-allowed"
                  : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember"
              )}
            >
              {loading ? (
                <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : "Enable"}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-hd-ink-500 hover:text-hd-ink-200 hover:bg-hd-ink-800 transition-colors"
              title="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared action buttons (used by modal)
// ---------------------------------------------------------------------------

function OptInActions({
  subscribed, loading, onSubscribe, onDismiss,
}: {
  subscribed: boolean;
  loading:    boolean;
  onSubscribe: () => void;
  onDismiss:   () => void;
}) {
  if (subscribed) {
    return (
      <div className="flex items-center gap-2 py-2 text-emerald-300 text-sm font-semibold">
        <Bell className="size-4" /> Notifications enabled!
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={onDismiss}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-400 hover:text-hd-ink-200 text-sm font-medium transition-colors"
      >
        <BellOff className="size-3.5" />
        Not now
      </button>
      <button
        onClick={onSubscribe}
        disabled={loading}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-sm font-semibold transition-all",
          loading
            ? "bg-hd-ink-700 cursor-not-allowed"
            : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember"
        )}
      >
        {loading ? (
          <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <><Bell className="size-3.5" /> Enable</>
        )}
      </button>
    </div>
  );
}
