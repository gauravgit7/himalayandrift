// =============================================================================
// CardSettingsAdmin — configure card template + membership benefits
// 'use client'
// =============================================================================

"use client";

import { useState, useCallback }   from "react";
import { Plus, Trash2, Save,
         CheckCircle2, AlertCircle } from "lucide-react";
import { cn }                       from "@/utils/cn";
import { saveCardSettings }         from "@/lib/supabase/actions";
import type { CardSettings }        from "@/types";

const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-sm",
  "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
  "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40 transition-colors",
);

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors shrink-0",
          checked ? "bg-tvs-red-600" : "bg-tvs-charcoal-700",
        )}
      >
        <span className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )} />
      </button>
      <span className="text-sm text-tvs-charcoal-200">{label}</span>
    </label>
  );
}

export function CardSettingsAdmin({ initial }: { initial: CardSettings }) {
  const [form,    setForm]    = useState<CardSettings>(initial);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [newBenefit, setNewBenefit] = useState("");

  const set = <K extends keyof CardSettings>(k: K, v: CardSettings[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const addBenefit = useCallback(() => {
    const trimmed = newBenefit.trim();
    if (!trimmed) return;
    set("benefits", [...form.benefits, trimmed]);
    setNewBenefit("");
  }, [newBenefit, form.benefits]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeBenefit = useCallback((i: number) => {
    set("benefits", form.benefits.filter((_, idx) => idx !== i));
  }, [form.benefits]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    setSaving(true); setError(null); setSaved(false);
    const { error: err } = await saveCardSettings(form);
    setSaving(false);
    if (err) { setError(err); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [form]);

  return (
    <div className="space-y-6">

      {/* Tagline */}
      <div>
        <FieldLabel>Card Tagline</FieldLabel>
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="NEPAL RIDES TOGETHER"
          className={inputCls}
        />
        <p className="text-[10px] text-tvs-charcoal-600 mt-1">
          Shown at the bottom of the card front.
        </p>
      </div>

      {/* Disclaimer */}
      <div>
        <FieldLabel>Lost Card Disclaimer</FieldLabel>
        <textarea
          value={form.disclaimer}
          onChange={(e) => set("disclaimer", e.target.value)}
          rows={2}
          className={cn(inputCls, "h-auto resize-none py-2")}
          placeholder="If found, please return to the original owner..."
        />
        <p className="text-[10px] text-tvs-charcoal-600 mt-1">
          Shown on the back of the card.
        </p>
      </div>

      {/* Validity */}
      <div>
        <FieldLabel>Validity Period (Years)</FieldLabel>
        <input
          type="number"
          min={1}
          max={5}
          value={form.validityYears}
          onChange={(e) => set("validityYears", Math.max(1, parseInt(e.target.value) || 2))}
          className={cn(inputCls, "w-32")}
        />
        <p className="text-[10px] text-tvs-charcoal-600 mt-1">
          Applied from the approval date.
        </p>
      </div>

      {/* Field visibility */}
      <div>
        <FieldLabel>Fields Shown on Card</FieldLabel>
        <div className="space-y-3 p-4 rounded-xl bg-tvs-charcoal-800/40 border border-tvs-charcoal-700/40">
          <Toggle checked={form.showBloodGroup}     onChange={(v) => set("showBloodGroup", v)}     label="Blood Group (back)" />
          <Toggle checked={form.showDob}            onChange={(v) => set("showDob", v)}            label="Date of Birth (back)" />
          <Toggle checked={form.showEmergencyPhone} onChange={(v) => set("showEmergencyPhone", v)} label="Emergency Phone (back)" />
          <Toggle checked={form.showChapter}        onChange={(v) => set("showChapter", v)}        label="Chapter Name (front)" />
        </div>
      </div>

      {/* Benefits */}
      <div>
        <FieldLabel>Member Benefits</FieldLabel>
        <p className="text-[10px] text-tvs-charcoal-600 mb-2">
          Shown on the public /membership landing page.
        </p>
        <div className="space-y-2 mb-3">
          {form.benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-tvs-charcoal-200 px-3 py-2 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700/60">
                {b}
              </span>
              <button
                type="button"
                onClick={() => removeBenefit(i)}
                className="shrink-0 p-2 rounded-lg text-tvs-charcoal-500 hover:text-tvs-red-400 hover:bg-tvs-charcoal-800 transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBenefit()}
            placeholder="e.g. Priority registration for marquee rides"
            className={cn(inputCls, "flex-1")}
          />
          <button
            type="button"
            onClick={addBenefit}
            disabled={!newBenefit.trim()}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-tvs-charcoal-700 hover:bg-tvs-charcoal-600 text-tvs-charcoal-200 text-sm font-medium transition-colors disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Error / success */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-tvs-red-950/50 border border-tvs-red-800/40 text-tvs-red-300 text-sm">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />{error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm">
          <CheckCircle2 className="size-4" />Settings saved.
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all",
          saving ? "bg-tvs-charcoal-700 cursor-not-allowed" : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red",
        )}
      >
        {saving
          ? <><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
          : <><Save className="size-3.5" />Save Card Settings</>}
      </button>
    </div>
  );
}
