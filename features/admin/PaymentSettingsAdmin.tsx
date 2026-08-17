// =============================================================================
// PaymentSettingsAdmin — the club-wide QR and payment details
// 'use client' — form state, QR upload
//
// These are the defaults every paid ride uses. A ride can override either
// field on the ride form when someone else is collecting for it.
// =============================================================================

"use client";

import { useState }   from "react";
import Image          from "next/image";
import { Save, CheckCircle2, AlertCircle, Wallet, Plus, Minus, BadgeCheck } from "lucide-react";

import { cn }                      from "@/utils/cn";
import { ImageUpload }             from "@/components/ui/ImageUpload";
import { savePaymentSettings }     from "@/lib/supabase/actions";
import { STORAGE_BUCKETS }         from "@/lib/constants";
import type { PaymentSettings, RidePriceTier } from "@/types";

const inputCls = cn(
  "w-full h-10 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
);

interface Props {
  initialSettings: PaymentSettings;
}

export function PaymentSettingsAdmin({ initialSettings }: Props) {
  const [qrUrl,        setQrUrl]        = useState(initialSettings.qrUrl);
  const [instructions, setInstructions] = useState(initialSettings.paymentInstructions);
  const [currency,     setCurrency]     = useState(initialSettings.currencyLabel);
  const [tiers,        setTiers]        = useState<RidePriceTier[]>(initialSettings.defaultTiers);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const patchTier = (i: number, patch: Partial<RidePriceTier>) =>
    setTiers((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    const res = await savePaymentSettings({
      qrUrl,
      paymentInstructions: instructions,
      currencyLabel:       currency,
      defaultTiers:        tiers.filter((t) => t.label.trim()),
    });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5">
        <Wallet className="size-4 text-hd-ember-400 shrink-0 mt-0.5" />
        <p className="text-xs text-hd-ink-500 leading-relaxed">
          Shown on the registration form of every ride that has a fee. Any ride
          can override the QR or the details from its own edit page.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
          <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
          <p className="text-sm text-hd-ember-300">{error}</p>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">Payment settings saved.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
        {/* QR */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
            Payment QR
          </label>
          {qrUrl && (
            <div className="p-2 rounded-xl bg-white w-fit">
              <Image
                src={qrUrl}
                alt="Club payment QR"
                width={144}
                height={144}
                unoptimized
                className="size-36 object-contain"
              />
            </div>
          )}
          <ImageUpload
            bucket={STORAGE_BUCKETS.paymentQr}
            currentUrl={qrUrl}
            onUpload={setQrUrl}
            compressMaxPx={800}
          />
          <p className="text-[11px] text-hd-ink-500 max-w-[200px]">
            eSewa, Khalti or a bank QR. Riders scan this to pay.
          </p>
        </div>

        {/* Text details */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
              Payment details
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              placeholder={"eSewa: 98XXXXXXXX (Himalayan Drift)\nKhalti: 98XXXXXXXX\n\nBank transfer\nHimalayan Drift\nNIC Asia Bank\nA/C 1234567890123"}
              className={cn(inputCls, "h-auto py-2.5 resize-y font-mono text-xs leading-relaxed")}
            />
            <p className="text-[11px] text-hd-ink-500">
              Free text so it fits however your club actually collects. Shown to
              riders exactly as typed, line breaks and all.
            </p>
          </div>

          <div className="space-y-1.5 max-w-[160px]">
            <label className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
              Currency label
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="NPR"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Default rider classes ──
           Typed once here, copied into a ride by the ride form. Copied and not
           referenced on purpose: editing this list must never silently reprice
           a ride whose sign-ups are already open. */}
      <div className="space-y-3 pt-5 border-t border-hd-ink-800">
        <div>
          <p className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide mb-1">
            Default rider classes
          </p>
          <p className="text-[11px] text-hd-ink-500 leading-relaxed">
            The rates you offer again and again — members, veterans, marshals
            riding along rather than leading. A ride can load these with one
            click and then change the prices for that ride alone.
          </p>
        </div>

        {tiers.map((tier, i) => (
          <div key={tier.id} className="p-3 rounded-xl bg-hd-ink-900/60 border border-hd-ink-800 space-y-2.5">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  value={tier.label}
                  onChange={(e) => patchTier(i, { label: e.target.value })}
                  placeholder="HD Member"
                  className={cn(inputCls, "h-9")}
                />
                <input
                  value={tier.note ?? ""}
                  onChange={(e) => patchTier(i, { note: e.target.value })}
                  placeholder="Who this is for — shown under the label"
                  className={cn(inputCls, "h-9 text-xs")}
                />
              </div>
              <div className="w-28 shrink-0">
                <span className="block text-[9px] uppercase tracking-wide text-hd-ink-500 mb-1">
                  Pays
                </span>
                <input
                  type="number" min={0} step="0.01"
                  value={String(tier.price)}
                  onChange={(e) => patchTier(i, { price: Number(e.target.value) || 0 })}
                  className={cn(inputCls, "h-9")}
                />
              </div>
              <button
                type="button"
                onClick={() => setTiers((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Remove this class"
                className="mt-5 size-9 shrink-0 flex items-center justify-center rounded-lg border border-hd-ink-700 text-hd-ink-500 hover:text-hd-ember-400 hover:border-hd-ember-800 transition-colors"
              >
                <Minus className="size-3.5" />
              </button>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tier.requiresMemberCard}
                onChange={(e) => patchTier(i, { requiresMemberCard: e.target.checked })}
                className="mt-0.5 size-3.5 accent-hd-ember-600"
              />
              <span className="text-[11px] text-hd-ink-400 leading-relaxed flex items-start gap-1.5">
                <BadgeCheck className="size-3 shrink-0 mt-0.5 text-hd-ember-500" />
                Needs an approved membership card — enforced at sign-up, not
                taken on trust.
              </span>
            </label>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setTiers((prev) => [...prev, {
            id: `t${Date.now().toString(36)}`,
            label: "", note: null, price: 0, requiresMemberCard: false,
          }])}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-hd-ink-700 hover:border-hd-ink-500 text-xs font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
        >
          <Plus className="size-3.5" /> Add a class
        </button>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all",
          saving
            ? "bg-hd-ink-700 cursor-not-allowed opacity-60"
            : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember active:scale-[0.98]",
        )}
      >
        {saving
          ? <><span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
          : <><Save className="size-4" />Save payment settings</>}
      </button>
    </div>
  );
}
