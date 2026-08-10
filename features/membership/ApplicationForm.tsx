// =============================================================================
// ApplicationForm — membership card application
// 'use client' — form state, photo upload
// =============================================================================

"use client";

import { useState, useCallback }  from "react";
import { useRouter }              from "next/navigation";
import { ImageUpload }            from "@/components/ui/ImageUpload";
import { cn }                     from "@/utils/cn";
import { submitMemberCard }       from "@/lib/supabase/actions";
import { BLOOD_GROUPS, CHAPTER_NAMES, ROUTES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputCls = cn(
  "w-full h-10 px-3 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700",
  "text-sm text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
  "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40 transition-colors",
);

const selectCls = cn(inputCls, "cursor-pointer appearance-none");

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-tvs-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-tvs-red-400 mt-1">{msg}</p>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FormState {
  photoUrl:        string;
  fullName:        string;
  dateOfBirth:     string;
  bloodGroup:      string;
  emergencyPhone:  string;
  licenseNumber:   string;
  chapter:         string;
  consentAccepted: boolean;
}

const INITIAL: FormState = {
  photoUrl: "", fullName: "", dateOfBirth: "", bloodGroup: "",
  emergencyPhone: "", licenseNumber: "", chapter: "",
  consentAccepted: false,
};

export function ApplicationForm() {
  const router = useRouter();
  const [form,    setForm]    = useState<FormState>(INITIAL);
  const [errors,  setErrors]  = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving,  setSaving]  = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.photoUrl)        e.photoUrl       = "Photo is required";
    if (!form.fullName.trim()) e.fullName        = "Full name is required";
    if (!form.dateOfBirth)     e.dateOfBirth     = "Date of birth is required";
    if (!form.bloodGroup)      e.bloodGroup      = "Blood group is required";
    if (!form.emergencyPhone.trim()) e.emergencyPhone = "Emergency contact is required";
    if (!form.licenseNumber.trim())  e.licenseNumber  = "License number is required";
    if (!form.chapter)         e.chapter         = "Select your chapter";
    if (!form.consentAccepted) e.consentAccepted = "You must accept the terms to apply";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);

    const { accessCode, error } = await submitMemberCard({
      photoUrl:        form.photoUrl,
      fullName:        form.fullName,
      dateOfBirth:     form.dateOfBirth,
      bloodGroup:      form.bloodGroup,
      emergencyPhone:  form.emergencyPhone,
      licenseNumber:   form.licenseNumber,
      chapter:         form.chapter,
      consentAccepted: form.consentAccepted,
    });

    setSaving(false);

    if (error || !accessCode) {
      setApiError(error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(ROUTES.memberConfirmed(accessCode));
  }, [form, router]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">

      {/* Photo */}
      <div>
        <FieldLabel required>Profile Photo</FieldLabel>
        <p className="text-xs text-tvs-charcoal-500 mb-2">
          Clear face photo — this appears on your ID card. Square crop will be applied.
        </p>
        <ImageUpload
          bucket="member-photos"
          currentUrl={form.photoUrl || null}
          onUpload={(url) => { if (url) { set("photoUrl", url); setErrors((e) => ({ ...e, photoUrl: undefined })); } }}
          cropAspect={1}
          compressMaxPx={800}
          compressThresholdMb={0.2}
        />
        <FieldError msg={errors.photoUrl} />
      </div>

      {/* Name */}
      <div>
        <FieldLabel required>Full Name</FieldLabel>
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="As per your ID / license"
          className={inputCls}
        />
        <FieldError msg={errors.fullName} />
      </div>

      {/* Date of Birth */}
      <div>
        <FieldLabel required>Date of Birth</FieldLabel>
        <input
          type="date"
          value={form.dateOfBirth}
          max={new Date(Date.now() - 14 * 365.25 * 86400000).toISOString().slice(0, 10)}
          onChange={(e) => set("dateOfBirth", e.target.value)}
          className={inputCls}
        />
        <FieldError msg={errors.dateOfBirth} />
      </div>

      {/* Blood Group */}
      <div>
        <FieldLabel required>Blood Group</FieldLabel>
        <select
          value={form.bloodGroup}
          onChange={(e) => set("bloodGroup", e.target.value)}
          className={selectCls}
        >
          <option value="">Select blood group</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <FieldError msg={errors.bloodGroup} />
      </div>

      {/* Emergency Phone */}
      <div>
        <FieldLabel required>Emergency Contact Number</FieldLabel>
        <input
          type="tel"
          value={form.emergencyPhone}
          onChange={(e) => set("emergencyPhone", e.target.value)}
          placeholder="+977 98XXXXXXXX"
          className={inputCls}
        />
        <FieldError msg={errors.emergencyPhone} />
      </div>

      {/* License Number */}
      <div>
        <FieldLabel required>Driving License Number</FieldLabel>
        <input
          type="text"
          value={form.licenseNumber}
          onChange={(e) => set("licenseNumber", e.target.value)}
          placeholder="e.g. 01-23-456789"
          className={inputCls}
        />
        <p className="text-[10px] text-tvs-charcoal-600 mt-1">
          Stored securely for verification — not shown on your card.
        </p>
        <FieldError msg={errors.licenseNumber} />
      </div>

      {/* Chapter */}
      <div>
        <FieldLabel required>Your Chapter</FieldLabel>
        <select
          value={form.chapter}
          onChange={(e) => set("chapter", e.target.value)}
          className={selectCls}
        >
          <option value="">Select chapter</option>
          {CHAPTER_NAMES.map((ch) => (
            <option key={ch} value={ch}>{ch}</option>
          ))}
        </select>
        <FieldError msg={errors.chapter} />
      </div>

      {/* Consent */}
      <div>
        <label className={cn(
          "flex items-start gap-3 cursor-pointer group",
          "p-4 rounded-xl border transition-colors",
          form.consentAccepted
            ? "border-tvs-red-800/40 bg-tvs-red-950/20"
            : "border-tvs-charcoal-700 hover:border-tvs-charcoal-600",
        )}>
          <input
            type="checkbox"
            checked={form.consentAccepted}
            onChange={(e) => set("consentAccepted", e.target.checked)}
            className="mt-0.5 accent-tvs-red-600 shrink-0"
          />
          <span className="text-xs text-tvs-charcoal-300 leading-relaxed">
            I confirm that all information provided is accurate and belongs to me.
            I consent to TVS Nepal storing this data for membership verification purposes.
            I understand this is a digital membership card and does not constitute vehicle ownership transfer.
          </span>
        </label>
        <FieldError msg={errors.consentAccepted} />
      </div>

      {/* API error */}
      {apiError && (
        <div className="p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40 text-tvs-red-300 text-sm">
          {apiError}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-sm transition-all",
          saving
            ? "bg-tvs-charcoal-700 text-tvs-charcoal-400 cursor-not-allowed"
            : "bg-tvs-red-600 hover:bg-tvs-red-500 text-white hover:shadow-glow-red active:scale-[0.98]",
        )}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting…
          </span>
        ) : (
          "Submit Application →"
        )}
      </button>
    </div>
  );
}
