// =============================================================================
// PwaSettingsAdmin — PWA app name + icon, editable via admin
// Changes take effect after next deploy (manifest is server-rendered with ISR)
// =============================================================================

"use client";

import { useState }       from "react";
import { Save, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { ImageUpload }    from "@/components/ui/ImageUpload";
import { cn }             from "@/utils/cn";
import { savePwaSettings } from "@/lib/supabase/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PwaSettings {
  appName:   string;
  shortName: string;
  iconUrl:   string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40 transition-colors"
);

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
        {children}
      </label>
      {hint && <p className="text-[10px] text-hd-ink-600 mt-0.5">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PwaSettingsAdmin({ initial }: { initial: PwaSettings }) {
  const [form,   setForm]   = useState<PwaSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const set = <K extends keyof PwaSettings>(k: K, v: PwaSettings[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.appName.trim() || !form.shortName.trim()) {
      setError("App name and short name are required");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await savePwaSettings(form);
    setSaving(false);
    if (err) { setError(err); return; }
    setSaved(true);
  };

  return (
    <div className="space-y-4 p-5 rounded-xl gradient-card border border-hd-ink-700/60 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-hd-ember-900/40 border border-hd-ember-800/40 flex items-center justify-center shrink-0">
          <Smartphone className="size-4 text-hd-ember-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-hd-ink-50">PWA App Identity</h3>
          <p className="text-[11px] text-hd-ink-500 mt-0.5">
            Name and icon shown when the app is installed on a device
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40 text-hd-ember-300 text-sm">
          <AlertCircle className="size-4 shrink-0 mt-px" />{error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-sm">
          <CheckCircle2 className="size-4 shrink-0" />Saved — takes effect on next deploy
        </div>
      )}

      {/* App name */}
      <div>
        <FieldLabel hint="Full name shown in splash screens and app stores">
          App Name
        </FieldLabel>
        <input
          type="text"
          value={form.appName}
          onChange={(e) => set("appName", e.target.value)}
          className={inputCls}
          placeholder="Himalayan Drift"
          maxLength={60}
        />
      </div>

      {/* Short name */}
      <div>
        <FieldLabel hint="Shown under the home screen icon — keep it under 12 characters">
          Short Name
        </FieldLabel>
        <input
          type="text"
          value={form.shortName}
          onChange={(e) => set("shortName", e.target.value)}
          className={inputCls}
          placeholder="HD"
          maxLength={12}
        />
        {form.shortName.length > 12 && (
          <p className="text-[10px] text-amber-500 mt-1">
            ⚠ Over 12 characters — may be truncated on some devices
          </p>
        )}
      </div>

      {/* Icon */}
      <div>
        <FieldLabel hint="Square image (1:1). Will be cropped to square automatically. 512px or larger recommended.">
          App Icon
        </FieldLabel>
        <ImageUpload
          bucket="pwa-icons"
          currentUrl={form.iconUrl}
          onUpload={(url) => set("iconUrl", url)}
          compressMaxPx={512}
          compressThresholdMb={0.1}
          cropAspect={1}
        />
        <p className="text-[10px] text-hd-ink-600 mt-1.5">
          Leave empty to use the default generated icon.
        </p>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all",
          saving || saved
            ? "bg-hd-ink-700 text-hd-ink-400 cursor-not-allowed"
            : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember"
        )}
      >
        {saving ? (
          <><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
        ) : saved ? (
          <><CheckCircle2 className="size-4" />Saved ✓</>
        ) : (
          <><Save className="size-4" />Save PWA Settings</>
        )}
      </button>
    </div>
  );
}
