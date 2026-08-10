// =============================================================================
// PushNotificationsAdmin — Admin panel section for push notifications
// Controls: enable/disable, prompt style, delay, page, manual broadcast
// =============================================================================

"use client";

import { useState }                  from "react";
import { Bell, BellOff, Send,
         CheckCircle2, AlertCircle,
         Users }                     from "lucide-react";
import { cn }                        from "@/utils/cn";
import { savePushSettings }          from "@/lib/supabase/actions";
import type { PushOptInSettings }    from "@/components/shared/PushOptIn";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-sm",
  "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
  "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40 transition-colors"
);

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label, sub }: {
  checked:  boolean;
  onChange: (v: boolean) => void;
  label:    string;
  sub?:     string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
          checked ? "bg-tvs-red-600" : "bg-tvs-charcoal-700"
        )}
      >
        <span className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0.5"
        )} />
      </button>
      <div>
        <p className="text-sm font-medium text-tvs-charcoal-200 group-hover:text-tvs-charcoal-50 transition-colors">
          {label}
        </p>
        {sub && <p className="text-xs text-tvs-charcoal-600">{sub}</p>}
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PushNotificationsAdminProps {
  initialSettings:  PushOptInSettings;
  subscriberCount?: number;
}

export function PushNotificationsAdmin({
  initialSettings,
  subscriberCount = 0,
}: PushNotificationsAdminProps) {
  const [settings,    setSettings]    = useState<PushOptInSettings>(initialSettings);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [settingsErr, setSettingsErr] = useState<string | null>(null);

  // Broadcast state
  const [title,      setTitle]      = useState("");
  const [body,       setBody]       = useState("");
  const [url,        setUrl]        = useState("/home");
  const [sending,    setSending]    = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [sendErr,    setSendErr]    = useState<string | null>(null);

  const set = <K extends keyof PushOptInSettings>(k: K, v: PushOptInSettings[K]) => {
    setSettings((p) => ({ ...p, [k]: v }));
    setSaved(false);
    setSettingsErr(null);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSettingsErr(null);
    const { error } = await savePushSettings(settings);
    setSaving(false);
    if (error) { setSettingsErr(error); return; }
    setSaved(true);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setSendResult(null);
    setSendErr(null);
    try {
      const res = await fetch("/api/push/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, body, url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Send failed");
      setSendResult({ sent: json.sent, failed: json.failed ?? 0 });
      setTitle(""); setBody(""); setUrl("/home");
    } catch (err) {
      setSendErr(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Subscriber count ── */}
      <div className="flex items-center gap-4 p-4 rounded-xl gradient-card border border-tvs-charcoal-700/60">
        <div className="size-10 rounded-xl bg-tvs-red-900/40 border border-tvs-red-800/40 flex items-center justify-center shrink-0">
          <Users className="size-5 text-tvs-red-400" />
        </div>
        <div>
          <p className="text-2xl font-black text-tvs-charcoal-50">{subscriberCount}</p>
          <p className="text-xs text-tvs-charcoal-500">active push subscribers</p>
        </div>
      </div>

      {/* ── Settings ── */}
      <div className="space-y-4 p-5 rounded-xl gradient-card border border-tvs-charcoal-700/60">
        <h3 className="text-sm font-bold text-tvs-charcoal-50">Opt-In Prompt Settings</h3>

        {settingsErr && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40 text-tvs-red-300 text-sm">
            <AlertCircle className="size-4 shrink-0 mt-px" />{settingsErr}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-sm">
            <CheckCircle2 className="size-4 shrink-0" />Settings saved
          </div>
        )}

        <Toggle
          checked={settings.enabled}
          onChange={(v) => set("enabled", v)}
          label="Push notifications enabled"
          sub="Shows opt-in prompt to visitors. Disabling hides the prompt site-wide."
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Prompt style</FieldLabel>
            <select
              value={settings.promptStyle}
              onChange={(e) => set("promptStyle", e.target.value as "banner" | "modal")}
              className={cn(inputCls, "appearance-none")}
            >
              <option value="banner" className="bg-tvs-charcoal-900">Bottom banner (subtle)</option>
              <option value="modal"  className="bg-tvs-charcoal-900">Modal dialog</option>
            </select>
          </div>

          <div>
            <FieldLabel>Show on page</FieldLabel>
            <select
              value={settings.promptPage}
              onChange={(e) => set("promptPage", e.target.value as PushOptInSettings["promptPage"])}
              className={cn(inputCls, "appearance-none")}
            >
              <option value="any"   className="bg-tvs-charcoal-900">Any page</option>
              <option value="home"  className="bg-tvs-charcoal-900">Home page only</option>
              <option value="rides" className="bg-tvs-charcoal-900">Rides pages only</option>
            </select>
          </div>

          <div>
            <FieldLabel>
              Delay —{" "}
              <span className="font-mono text-tvs-charcoal-300">
                {settings.promptDelaySecs}s
              </span>
            </FieldLabel>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={settings.promptDelaySecs}
              onChange={(e) => set("promptDelaySecs", parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-tvs-red-600 mt-2"
            />
            <div className="flex justify-between text-[10px] text-tvs-charcoal-600 mt-1">
              <span>0s (immediate)</span>
              <span>30s</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving || saved}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all",
            saving || saved
              ? "bg-tvs-charcoal-700 text-tvs-charcoal-400 cursor-not-allowed"
              : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red"
          )}
        >
          {saving ? (
            <><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
          ) : saved ? (
            <><CheckCircle2 className="size-4" />Saved ✓</>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>

      {/* ── Manual broadcast ── */}
      <div className="space-y-4 p-5 rounded-xl gradient-card border border-tvs-charcoal-700/60">
        <div>
          <h3 className="text-sm font-bold text-tvs-charcoal-50">Send Notification</h3>
          <p className="text-xs text-tvs-charcoal-500 mt-0.5">
            Broadcasts to all {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""} immediately.
          </p>
        </div>

        {sendResult && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-sm">
            <CheckCircle2 className="size-4 shrink-0" />
            Sent to {sendResult.sent} subscriber{sendResult.sent !== 1 ? "s" : ""}
            {sendResult.failed > 0 && (
              <span className="text-tvs-charcoal-500 ml-1">({sendResult.failed} failed)</span>
            )}
          </div>
        )}
        {sendErr && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40 text-tvs-red-300 text-sm">
            <AlertCircle className="size-4 shrink-0 mt-px" />{sendErr}
          </div>
        )}

        <div>
          <FieldLabel>Title *</FieldLabel>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            placeholder="e.g. 🏍️ New ride posted — Pokhara Express"
            maxLength={80}
          />
        </div>

        <div>
          <FieldLabel>Message *</FieldLabel>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className={cn(inputCls, "h-auto resize-none py-2")}
            placeholder="Short message shown in the notification…"
            maxLength={200}
          />
        </div>

        <div>
          <FieldLabel>Tap URL</FieldLabel>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputCls}
            placeholder="/rides/some-slug or /home"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim() || subscriberCount === 0}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all",
            sending || !title.trim() || !body.trim() || subscriberCount === 0
              ? "bg-tvs-charcoal-700 text-tvs-charcoal-400 cursor-not-allowed"
              : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red"
          )}
        >
          {sending ? (
            <><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
          ) : (
            <><Send className="size-4" />Send to {subscriberCount} subscribers</>
          )}
        </button>
      </div>

    </div>
  );
}
