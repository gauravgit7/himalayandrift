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
import { Save, CheckCircle2, AlertCircle, Wallet } from "lucide-react";

import { cn }                      from "@/utils/cn";
import { ImageUpload }             from "@/components/ui/ImageUpload";
import { savePaymentSettings }     from "@/lib/supabase/actions";
import { STORAGE_BUCKETS }         from "@/lib/constants";
import type { PaymentSettings } from "@/types";

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
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    const res = await savePaymentSettings({
      qrUrl,
      paymentInstructions: instructions,
      currencyLabel:       currency,
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
