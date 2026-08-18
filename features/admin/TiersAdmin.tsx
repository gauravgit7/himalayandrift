// =============================================================================
// TiersAdmin — the membership programme
// 'use client'
//
// Two switches and a list of tiers. There is deliberately no engine that
// promotes anybody: a tier is a judgement about a rider, and a rule that
// awarded it automatically would turn a compliment into a formula.
//
// The discount is a percentage rather than a price per ride, so a ride carries
// one number and the tier does the rest. The reward factor multiplies loyalty
// points. Both are stored on the tier and read at the moment they are used.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  Plus, Trash2, AlertCircle, Star, EyeOff, Award, Percent, Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  saveMembershipSettings, saveMembershipTier, deleteMembershipTier,
} from "@/lib/supabase/actions";
import type { MembershipTier, MembershipSettings } from "@/types";

const inputCls = cn(
  "w-full h-10 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
);

interface Draft {
  id?:             string;
  name:            string;
  description:     string;
  discountPercent: string;
  rewardFactor:    string;
  colour:          string;
  isDefault:       boolean;
  isActive:        boolean;
}

const toDraft = (t: MembershipTier): Draft => ({
  id: t.id, name: t.name, description: t.description ?? "",
  discountPercent: String(t.discountPercent), rewardFactor: String(t.rewardFactor),
  colour: t.colour ?? "", isDefault: t.isDefault, isActive: t.isActive,
});

const BLANK: Draft = {
  name: "", description: "", discountPercent: "0", rewardFactor: "1",
  colour: "", isDefault: false, isActive: true,
};

export function TiersAdmin({
  initialTiers, initialSettings,
}: {
  initialTiers:    MembershipTier[];
  initialSettings: MembershipSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [editing,  setEditing]  = useState<Draft | null>(null);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const persistSettings = useCallback(async (next: MembershipSettings) => {
    setSettings(next);
    setBusy(true); setError(null);
    const res = await saveMembershipSettings(next);
    setBusy(false);
    if (res.error) { setSettings(settings); setError(res.error); }
  }, [settings]);

  const save = useCallback(async (draft: Draft) => {
    setBusy(true); setError(null);
    const res = await saveMembershipTier({
      id:              draft.id,
      name:            draft.name,
      description:     draft.description || null,
      discountPercent: Number(draft.discountPercent) || 0,
      rewardFactor:    Number(draft.rewardFactor) || 1,
      colour:          draft.colour || null,
      isDefault:       draft.isDefault,
      isActive:        draft.isActive,
    });
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    window.location.reload();
  }, []);

  const remove = useCallback(async (id: string) => {
    setBusy(true); setError(null);
    const res = await deleteMembershipTier(id);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    window.location.reload();
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
          <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
          <p className="text-sm text-hd-ember-300">{error}</p>
        </div>
      )}

      {/* ── Switches ──
           Two, not one. Either half is useful alone: points with tiers off
           means everyone earns at 1x, and tiers with points off is simply a
           discount scheme. */}
      <div className="space-y-4 p-5 rounded-2xl gradient-card border border-hd-ink-700">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox" checked={settings.tiersEnabled} disabled={busy}
            onChange={(e) => persistSettings({ ...settings, tiersEnabled: e.target.checked })}
            className="mt-0.5 size-4 accent-hd-ember-600"
          />
          <span>
            <span className="block text-sm font-semibold text-hd-ink-100">
              Tier pricing
            </span>
            <span className="block text-xs text-hd-ink-500 mt-0.5 leading-relaxed">
              A rider on a tier sees their own price on the sign-up form and
              nobody else&rsquo;s. Off means one price for everybody.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox" checked={settings.loyaltyEnabled} disabled={busy}
            onChange={(e) => persistSettings({ ...settings, loyaltyEnabled: e.target.checked })}
            className="mt-0.5 size-4 accent-hd-ember-600"
          />
          <span>
            <span className="block text-sm font-semibold text-hd-ink-100">
              Loyalty points
            </span>
            <span className="block text-xs text-hd-ink-500 mt-0.5 leading-relaxed">
              Awarded when a registration or an order is approved — never at
              submission, so an unpaid form cannot mint points.
            </span>
          </span>
        </label>

        {settings.loyaltyEnabled && (
          <div className="sm:w-56">
            <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide mb-1.5">
              What you call them
            </label>
            <input
              className={inputCls}
              value={settings.pointsLabel}
              onChange={(e) => setSettings({ ...settings, pointsLabel: e.target.value })}
              onBlur={() => persistSettings(settings)}
              placeholder="points"
            />
          </div>
        )}
      </div>

      {/* ── Tier list ── */}
      {initialTiers.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-hd-ink-700">
          <Award className="size-8 mx-auto mb-3 text-hd-ink-700" />
          <p className="text-sm text-hd-ink-500">No tiers yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {initialTiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border gradient-card border-hd-ink-700/60",
                !tier.isActive && "opacity-60",
              )}
            >
              <span
                className="size-3 rounded-full shrink-0"
                style={{ background: tier.colour || "#f09020" }}
                aria-hidden="true"
              />

              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold text-hd-ink-50">
                  <span className="truncate">{tier.name}</span>
                  {tier.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-hd-ember-900/40 text-hd-ember-300 border border-hd-ember-800/40 shrink-0">
                      <Star className="size-2 fill-current" /> Default
                    </span>
                  )}
                  {!tier.isActive && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-hd-ink-800 text-hd-ink-400 border border-hd-ink-700 shrink-0">
                      <EyeOff className="size-2" /> Off
                    </span>
                  )}
                </p>
                <p className="flex items-center gap-3 text-xs text-hd-ink-500 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Percent className="size-3" /> {tier.discountPercent}% off rides
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="size-3" /> {tier.rewardFactor}× points
                  </span>
                </p>
                {tier.description && (
                  <p className="text-xs text-hd-ink-600 mt-1 truncate">{tier.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditing(toDraft(tier))}
                  className="px-2.5 py-1.5 rounded-lg bg-hd-ink-800 border border-hd-ink-700 hover:border-hd-ink-500 text-xs font-medium text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
                >
                  Edit
                </button>
                <ConfirmDelete busy={busy} onConfirm={() => remove(tier.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing({ ...BLANK })}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-all hover:shadow-glow-ember"
      >
        <Plus className="size-4" /> Add a tier
      </button>

      {editing && (
        <TierDialog
          draft={editing}
          busy={busy}
          onChange={setEditing}
          onSave={() => save(editing)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function TierDialog({
  draft, busy, onChange, onSave, onClose,
}: {
  draft:    Draft;
  busy:     boolean;
  onChange: (d: Draft) => void;
  onSave:   () => void;
  onClose:  () => void;
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-hd-ink-900 border border-hd-ink-700 rounded-2xl shadow-cinematic p-5 space-y-4">
        <h2 className="text-base font-bold text-hd-ink-50">
          {draft.id ? "Edit tier" : "New tier"}
        </h2>

        <div>
          <Label>Name</Label>
          <input className={inputCls} value={draft.name}
            onChange={(e) => set("name", e.target.value)} placeholder="Veteran" />
        </div>

        <div>
          <Label>Description</Label>
          <input className={inputCls} value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Five seasons or more with the club" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Discount %</Label>
            <input className={inputCls} value={draft.discountPercent} inputMode="numeric"
              onChange={(e) => set("discountPercent", e.target.value)} />
          </div>
          <div>
            <Label>Points ×</Label>
            <input className={inputCls} value={draft.rewardFactor} inputMode="decimal"
              onChange={(e) => set("rewardFactor", e.target.value)} />
          </div>
          <div>
            <Label>Colour</Label>
            <input
              type="color"
              value={draft.colour || "#f09020"}
              onChange={(e) => set("colour", e.target.value)}
              className="w-full h-10 rounded-lg bg-hd-ink-800 border border-hd-ink-700 cursor-pointer"
            />
          </div>
        </div>

        <p className="text-[11px] text-hd-ink-500 leading-relaxed">
          A multiplier of 2 means this tier earns twice the points a ride is
          worth. Worth keeping between 1 and 2 — at 5 the gap between tiers
          compounds and never closes.
        </p>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={draft.isDefault}
            onChange={(e) => set("isDefault", e.target.checked)}
            className="mt-0.5 size-4 accent-hd-ember-600" />
          <span>
            <span className="block text-sm font-semibold text-hd-ink-100">
              The default tier
            </span>
            <span className="block text-xs text-hd-ink-500 mt-0.5">
              Where every member lands unless you move them. Setting it here
              takes it off whichever tier holds it now.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={draft.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="mt-0.5 size-4 accent-hd-ember-600" />
          <span className="text-sm font-semibold text-hd-ink-100">In use</span>
        </label>

        <div className="flex items-center gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-hd-ink-700 text-hd-ink-300 hover:text-hd-ink-100 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            type="button" onClick={onSave} disabled={busy || !draft.name.trim()}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all",
              busy || !draft.name.trim()
                ? "bg-hd-ink-700 cursor-not-allowed opacity-60"
                : "bg-hd-ember-600 hover:bg-hd-ember-500",
            )}
          >
            Save tier
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function ConfirmDelete({ busy, onConfirm }: { busy: boolean; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} aria-label="Delete tier"
        className="flex items-center justify-center size-8 rounded-lg border border-hd-ink-700 text-hd-ink-500 hover:text-hd-ember-400 hover:border-hd-ember-800 transition-colors">
        <Trash2 className="size-3.5" />
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <button type="button" onClick={() => setArmed(false)}
        className="px-2 py-1.5 rounded-lg text-xs text-hd-ink-400 hover:text-hd-ink-100">
        Cancel
      </button>
      <button type="button" onClick={onConfirm} disabled={busy}
        className="px-2.5 py-1.5 rounded-lg bg-hd-ember-700 hover:bg-hd-ember-600 text-white text-xs font-semibold transition-colors disabled:opacity-60">
        Delete
      </button>
    </span>
  );
}
