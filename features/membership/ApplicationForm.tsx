// =============================================================================
// ApplicationForm — joining the club
//
// This was the card application, and it asked for six things the sign-up form
// then asked for again. A rider who wanted to be a member had to fill in both,
// wait for both, and hope the club worked out they were one person.
//
// So it is one form. Everything the card needs is everything the profile
// needs, plus an email address and a password — and the consent line says so
// in as many words, because "apply for a card" quietly creating an account
// would be a worse trade than asking.
//
// 'use client' — form state, photo upload
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter }             from "next/navigation";
import Link                      from "next/link";
import { LogIn, MailCheck }      from "lucide-react";
import { ImageUpload }           from "@/components/ui/ImageUpload";
import { cn }                    from "@/utils/cn";
import { joinClub }              from "@/lib/supabase/actions";
import { BLOOD_GROUPS, ROUTES }  from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputCls = cn(
  "w-full h-10 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700",
  "text-sm text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40 transition-colors",
);

const selectCls = cn(inputCls, "cursor-pointer appearance-none");

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-hd-ember-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-hd-ember-400 mt-1">{msg}</p>;
}

function SectionHeading({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="pt-1">
      <div className="flex items-center gap-2">
        <span className="block w-3 h-px bg-hd-ember-600 rounded-full" />
        <span className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
          {children}
        </span>
      </div>
      {note && <p className="text-xs text-hd-ink-500 mt-1.5">{note}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FormState {
  photoUrl:        string;
  fullName:        string;
  dateOfBirth:     string;
  bloodGroup:      string;
  emergencyName:   string;
  emergencyPhone:  string;
  licenseNumber:   string;
  email:           string;
  password:        string;
  confirm:         string;
  phone:           string;
  address:         string;
  bikeModel:       string;
  consentAccepted: boolean;
}

const INITIAL: FormState = {
  photoUrl: "", fullName: "", dateOfBirth: "", bloodGroup: "",
  emergencyName: "", emergencyPhone: "", licenseNumber: "",
  email: "", password: "", confirm: "",
  phone: "", address: "", bikeModel: "",
  consentAccepted: false,
};

export function ApplicationForm() {
  const router = useRouter();
  const [form,     setForm]     = useState<FormState>(INITIAL);
  const [errors,   setErrors]   = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // Two outcomes that are not failures and must not be dressed as one.
  const [emailInUse, setEmailInUse] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.photoUrl)              e.photoUrl        = "Photo is required";
    if (!form.fullName.trim())       e.fullName        = "Full name is required";
    if (!form.dateOfBirth)           e.dateOfBirth     = "Date of birth is required";
    if (!form.bloodGroup)            e.bloodGroup      = "Blood group is required";
    if (!form.emergencyPhone.trim()) e.emergencyPhone  = "Emergency contact is required";
    if (!form.licenseNumber.trim())  e.licenseNumber   = "License number is required";

    if (!form.email.trim())          e.email           = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
                                     e.email           = "That does not look like an email address";
    if (!form.password)              e.password        = "Password is required";
    else if (form.password.length < 8)
                                     e.password        = "Use at least 8 characters";
    if (form.confirm !== form.password) e.confirm      = "Passwords do not match";

    if (!form.consentAccepted)       e.consentAccepted = "Please confirm to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    setEmailInUse(false);

    const res = await joinClub({
      photoUrl:        form.photoUrl,
      fullName:        form.fullName,
      dateOfBirth:     form.dateOfBirth,
      bloodGroup:      form.bloodGroup,
      emergencyPhone:  form.emergencyPhone,
      emergencyName:   form.emergencyName || null,
      licenseNumber:   form.licenseNumber,
      consentAccepted: form.consentAccepted,
      email:           form.email,
      password:        form.password,
      phone:           form.phone     || null,
      address:         form.address   || null,
      bikeModel:       form.bikeModel || null,
    });

    setSaving(false);

    if (res.emailInUse) { setEmailInUse(true); return; }
    if (res.error)      { setApiError(res.error); return; }

    // Email confirmation on: there is no session yet, so sending them to the
    // profile would land on a sign-in wall. Their access code is what they
    // need in the meantime.
    if (res.needsConfirmation) { setConfirmSent(true); return; }

    if (res.accessCode) { router.push(ROUTES.memberConfirmed(res.accessCode)); return; }
    router.push(ROUTES.profile);
  }, [form, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Check your inbox ──────────────────────────────────────────────────────
  if (confirmSent) {
    return (
      <div className="space-y-4 text-center py-4">
        <MailCheck className="size-10 text-hd-ember-400 mx-auto" />
        <div>
          <p className="text-lg font-bold text-hd-ink-50">Confirm your email</p>
          <p className="text-sm text-hd-ink-400 mt-1.5 leading-relaxed max-w-sm mx-auto">
            We sent a link to <span className="text-hd-ink-200">{form.email.trim()}</span>.
            Open it to activate your account — your card request is already with
            the committee.
          </p>
        </div>
        <Link
          href={ROUTES.home}
          className="inline-block px-5 py-2.5 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-sm font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
        >
          Back to the club
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      <p className="text-sm text-hd-ink-400 leading-relaxed">
        One form. This gets you a Himalayan Drift account and puts your
        membership card in front of the committee — there is no second
        application to fill in afterwards.
      </p>

      <SectionHeading note="This is what goes on the card.">
        Your details
      </SectionHeading>

      {/* Photo */}
      <div>
        <FieldLabel required>Profile Photo</FieldLabel>
        <p className="text-xs text-hd-ink-500 mb-2">
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

      <div className="grid sm:grid-cols-2 gap-4">
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
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Emergency contact */}
        <div>
          <FieldLabel>Emergency Contact Name</FieldLabel>
          <input
            type="text"
            value={form.emergencyName}
            onChange={(e) => set("emergencyName", e.target.value)}
            placeholder="Who we call"
            className={inputCls}
          />
        </div>
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
        <p className="text-[10px] text-hd-ink-600 mt-1">
          Stored securely for verification — not shown on your card.
        </p>
        <FieldError msg={errors.licenseNumber} />
      </div>

      <SectionHeading note="How you sign in, see your card and register for rides.">
        Your account
      </SectionHeading>

      {/* Email */}
      <div>
        <FieldLabel required>Email</FieldLabel>
        <input
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => { set("email", e.target.value); setEmailInUse(false); }}
          placeholder="you@example.com"
          className={inputCls}
        />
        <FieldError msg={errors.email} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Password</FieldLabel>
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="At least 8 characters"
            className={inputCls}
          />
          <FieldError msg={errors.password} />
        </div>
        <div>
          <FieldLabel required>Confirm Password</FieldLabel>
          <input
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => set("confirm", e.target.value)}
            placeholder="Type it again"
            className={inputCls}
          />
          <FieldError msg={errors.confirm} />
        </div>
      </div>

      {/* Optional — genuinely optional, and grouped so it reads that way */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Phone</FieldLabel>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+977 98XXXXXXXX"
            className={inputCls}
          />
        </div>
        <div>
          <FieldLabel>City / District</FieldLabel>
          <input
            type="text"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Kathmandu"
            className={inputCls}
          />
        </div>
        <div>
          <FieldLabel>Bike</FieldLabel>
          <input
            type="text"
            value={form.bikeModel}
            onChange={(e) => set("bikeModel", e.target.value)}
            placeholder="Himalayan 450"
            className={inputCls}
          />
        </div>
      </div>

      {/* Consent — now covers both things this form does, said plainly */}
      <div>
        <label className={cn(
          "flex items-start gap-3 cursor-pointer group",
          "p-4 rounded-xl border transition-colors",
          form.consentAccepted
            ? "border-hd-ember-800/40 bg-hd-ember-950/20"
            : "border-hd-ink-700 hover:border-hd-ink-600",
        )}>
          <input
            type="checkbox"
            checked={form.consentAccepted}
            onChange={(e) => set("consentAccepted", e.target.checked)}
            className="mt-0.5 accent-hd-ember-600 shrink-0"
          />
          <span className="text-xs text-hd-ink-300 leading-relaxed">
            <span className="text-hd-ink-100 font-semibold">
              This creates a Himalayan Drift account as well as a card request.
            </span>{" "}
            I confirm the information above is accurate and belongs to me, and I
            consent to Himalayan Drift storing it for membership verification.
            I understand the card is a digital membership ID and does not
            constitute vehicle ownership transfer.
          </span>
        </label>
        <FieldError msg={errors.consentAccepted} />
      </div>

      {/* Already a member — an invitation, not a failure */}
      {emailInUse && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-hd-ink-800/60 border border-hd-ink-700">
          <LogIn className="size-4 text-hd-ember-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-hd-ink-100">
              That email already has an account
            </p>
            <p className="text-xs text-hd-ink-400 mt-1 leading-relaxed">
              Sign in and request your card from your profile — it is built from
              the details already on your account, so there is nothing to type
              again.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                href={ROUTES.signin}
                className="px-3 py-1.5 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-xs font-semibold transition-colors"
              >
                Sign in
              </Link>
              <Link
                href={"/forgot-password"}
                className="px-3 py-1.5 rounded-lg border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-300 text-xs font-semibold transition-colors"
              >
                Forgot password
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* API error */}
      {apiError && (
        <div className="p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40 text-hd-ember-300 text-sm">
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
            ? "bg-hd-ink-700 text-hd-ink-400 cursor-not-allowed"
            : "bg-hd-ember-600 hover:bg-hd-ember-500 text-white hover:shadow-glow-ember active:scale-[0.98]",
        )}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating your membership…
          </span>
        ) : (
          "Join Himalayan Drift →"
        )}
      </button>

      <p className="text-xs text-hd-ink-500 text-center">
        Already have an account?{" "}
        <Link href={ROUTES.signin} className="text-hd-ember-400 hover:text-hd-ember-300 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
