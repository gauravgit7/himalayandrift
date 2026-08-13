// =============================================================================
// RegistrationForm — sign up for one ride
// 'use client' — form state, payment screenshot upload
//
// Open to signed-out visitors. When a rider is signed in the server prefills
// their details, but they stay editable: riders register pillions and friends
// under their own account too.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter }             from "next/navigation";
import Image                     from "next/image";
import {
  AlertCircle, Users, Wallet, ShieldAlert, Loader2, ArrowRight,
} from "lucide-react";

import { cn }                       from "@/utils/cn";
import { ImageUpload }              from "@/components/ui/ImageUpload";
import { submitRideRegistration }   from "@/lib/supabase/actions";
import { ROUTES, STORAGE_BUCKETS }  from "@/lib/constants";
import type { ResolvedPaymentDetails } from "@/types";

// ---------------------------------------------------------------------------
// Shared field styling
// ---------------------------------------------------------------------------

const inputCls = cn(
  "w-full h-10 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700",
  "text-sm text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
  "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
);

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-hd-ember-500 ml-0.5">*</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RegistrationPrefill {
  fullName:  string;
  phone:     string;
  email:     string;
  bikeModel: string;
}

interface Props {
  rideId:      string;
  rideTitle:   string;
  payment:     ResolvedPaymentDetails;
  seatsLeft:   number | null;
  prefill:     RegistrationPrefill | null;
}

interface FormState {
  fullName:         string;
  phone:            string;
  email:            string;
  emergencyName:    string;
  emergencyPhone:   string;
  bikeModel:        string;
  pillionCount:     string;
  notes:            string;
  paymentReference: string;
}

export function RegistrationForm({
  rideId, rideTitle, payment, seatsLeft, prefill,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    fullName:         prefill?.fullName  ?? "",
    phone:            prefill?.phone     ?? "",
    email:            prefill?.email     ?? "",
    emergencyName:    "",
    emergencyPhone:   "",
    bikeModel:        prefill?.bikeModel ?? "",
    pillionCount:     "0",
    notes:            "",
    paymentReference: "",
  });

  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim()) { setError("Please enter your name."); return; }
    if (!form.phone.trim())    { setError("Please enter a phone number."); return; }
    if (payment.isPaid && !screenshotUrl) {
      setError("Please upload a screenshot of your payment before submitting.");
      return;
    }

    setSubmitting(true);
    const result = await submitRideRegistration({
      rideId,
      fullName:       form.fullName,
      phone:          form.phone,
      email:          form.email          || null,
      emergencyName:  form.emergencyName  || null,
      emergencyPhone: form.emergencyPhone || null,
      bikeModel:      form.bikeModel      || null,
      pillionCount:   Number(form.pillionCount) || 0,
      notes:          form.notes          || null,
      paymentReference:     form.paymentReference || null,
      paymentScreenshotUrl: screenshotUrl,
    });

    if (result.error || !result.accessCode) {
      setError(result.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(ROUTES.registrationConfirmed(result.accessCode));
  }, [form, screenshotUrl, payment.isPaid, rideId, router]);

  const feeLabel = payment.fee !== null
    ? `${payment.currencyLabel} ${payment.fee.toLocaleString()}`
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Seats warning ── */}
      {seatsLeft !== null && seatsLeft <= 5 && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-950/30 border border-amber-800/40">
          <Users className="size-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            Only {seatsLeft} {seatsLeft === 1 ? "place" : "places"} left on this ride.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-hd-ember-950/60 border border-hd-ember-800/40">
          <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
          <p className="text-sm text-hd-ember-300">{error}</p>
        </div>
      )}

      {/* ── Rider details ── */}
      <section className="gradient-card rounded-2xl border border-hd-ink-700 p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-bold text-hd-ink-300 uppercase tracking-widest">
          Your details
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Full name</FieldLabel>
            <input
              type="text" value={form.fullName} required disabled={submitting}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Ramesh Shrestha" className={inputCls}
            />
          </div>
          <div>
            <FieldLabel required>Phone</FieldLabel>
            <input
              type="tel" value={form.phone} required disabled={submitting}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+977 98XXXXXXXX" className={inputCls}
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              type="email" value={form.email} disabled={submitting}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com" className={inputCls}
            />
          </div>
          <div>
            <FieldLabel>Bike</FieldLabel>
            <input
              type="text" value={form.bikeModel} disabled={submitting}
              onChange={(e) => set("bikeModel", e.target.value)}
              placeholder="Apache RTR 200 4V" className={inputCls}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Riding pillion with you</FieldLabel>
          <input
            type="number" min={0} max={2} value={form.pillionCount} disabled={submitting}
            onChange={(e) => set("pillionCount", e.target.value)}
            className={cn(inputCls, "max-w-[140px]")}
          />
          <p className="text-[11px] text-hd-ink-500 mt-1.5">
            Counts towards the head count for the ride. It does not change your fee.
          </p>
        </div>
      </section>

      {/* ── Emergency contact ── */}
      <section className="gradient-card rounded-2xl border border-hd-ink-700 p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="size-4 text-hd-slate-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-hd-ink-300 uppercase tracking-widest">
              Emergency contact
            </h2>
            <p className="text-xs text-hd-ink-500 mt-1">
              Someone not on the ride. The marshal carries this list.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Name</FieldLabel>
            <input
              type="text" value={form.emergencyName} disabled={submitting}
              onChange={(e) => set("emergencyName", e.target.value)}
              placeholder="Who should we call?" className={inputCls}
            />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <input
              type="tel" value={form.emergencyPhone} disabled={submitting}
              onChange={(e) => set("emergencyPhone", e.target.value)}
              placeholder="+977 98XXXXXXXX" className={inputCls}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Anything we should know</FieldLabel>
          <textarea
            value={form.notes} rows={2} disabled={submitting}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Allergies, medical conditions, dietary needs…"
            className={cn(inputCls, "h-auto py-2 resize-none")}
          />
        </div>
      </section>

      {/* ── Payment ── */}
      {payment.isPaid && (
        <section className="gradient-card rounded-2xl border border-hd-ember-800/40 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Wallet className="size-4 text-hd-ember-400 shrink-0" />
              <h2 className="text-sm font-bold text-hd-ink-200 uppercase tracking-widest">
                Payment
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-hd-ember-600/15 border border-hd-ember-800/40 text-hd-ember-300 font-bold text-sm">
              {feeLabel}
            </span>
          </div>

          <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-start">
            {payment.qrUrl && (
              <div className="mx-auto sm:mx-0">
                <div className="p-2.5 rounded-xl bg-white">
                  <Image
                    src={payment.qrUrl}
                    alt="Payment QR code"
                    width={176}
                    height={176}
                    unoptimized
                    className="size-44 object-contain"
                  />
                </div>
                <p className="text-[11px] text-hd-ink-500 text-center mt-2">
                  Scan to pay
                </p>
              </div>
            )}

            {payment.paymentInstructions && (
              <div className="rounded-xl bg-hd-ink-900/60 border border-hd-ink-700 p-4">
                <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 mb-2">
                  Payment details
                </p>
                {/* Admin-authored text — newlines are meaningful here. */}
                <p className="text-sm text-hd-ink-200 whitespace-pre-line leading-relaxed">
                  {payment.paymentInstructions}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-hd-ink-800 pt-5 space-y-4">
            <div>
              <FieldLabel required>Payment screenshot</FieldLabel>
              <ImageUpload
                bucket={STORAGE_BUCKETS.paymentScreenshots}
                currentUrl={screenshotUrl}
                onUpload={setScreenshotUrl}
                compressMaxPx={1400}
              />
              <p className="text-[11px] text-hd-ink-500 mt-2">
                Pay first, then upload the confirmation screenshot. Your place is
                held once an admin has checked it.
              </p>
            </div>

            <div>
              <FieldLabel>Transaction ID</FieldLabel>
              <input
                type="text" value={form.paymentReference} disabled={submitting}
                onChange={(e) => set("paymentReference", e.target.value)}
                placeholder="Optional, but it speeds up checking"
                className={inputCls}
              />
            </div>
          </div>
        </section>
      )}

      {!payment.isPaid && (
        <p className="text-sm text-hd-ink-400 px-1">
          This ride is free — no payment needed. Just submit your details.
        </p>
      )}

      {/* ── Submit ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "flex-1 h-12 rounded-xl font-semibold text-sm text-white transition-all",
            "flex items-center justify-center gap-2",
            submitting
              ? "bg-hd-ink-700 cursor-not-allowed opacity-70"
              : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember active:scale-[0.99]",
          )}
        >
          {submitting
            ? <><Loader2 className="size-4 animate-spin" /> Submitting…</>
            : <>Register for {rideTitle} <ArrowRight className="size-4" /></>}
        </button>
      </div>

      <p className="text-[11px] text-hd-ink-500 text-center leading-relaxed">
        Every registration is checked by an admin before it is confirmed.
        You will get a reference code to track yours.
      </p>
    </form>
  );
}
