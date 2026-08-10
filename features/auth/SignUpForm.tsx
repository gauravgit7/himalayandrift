"use client";

import { useState }     from "react";
import Link             from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn }           from "@/utils/cn";
import { signUpPublic } from "@/lib/supabase/actions";
import { ROUTES, APP_META } from "@/lib/constants";

const CHAPTERS = [
  "Bagmati","Narayani","Gandaki","Lumbini",
  "Rapti","Bheri","Mahakali","Koshi","Mechi",
] as const;

export function SignUpForm() {
  const [fullName,       setFullName]       = useState("");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [confirm,        setConfirm]        = useState("");
  const [dateOfBirth,    setDateOfBirth]    = useState("");
  const [licenseNumber,  setLicenseNumber]  = useState("");
  const [address,        setAddress]        = useState("");
  const [bikeModel,      setBikeModel]      = useState("");
  const [chapter,        setChapter]        = useState("");
  const [phone,          setPhone]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError(null);

    const result = await signUpPublic({
      fullName,
      email,
      password,
      chapter:       chapter       || null,
      phone:         phone         || null,
      address:       address       || null,
      bikeModel:     bikeModel     || null,
      dateOfBirth:   dateOfBirth   || null,
      licenseNumber: licenseNumber || null,
    });

    if (result?.error) { setError(result.error); setLoading(false); return; }
    if (result?.needsConfirmation) { setNeedsConfirmation(true); setLoading(false); }
    // On success with session: server redirects to /profile automatically
  };

  const inputClass = cn(
    "w-full h-10 px-3 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-sm transition-colors",
    "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
    "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  );
  const selectClass = cn(inputClass, "cursor-pointer");
  const labelClass  = "text-xs font-medium text-tvs-charcoal-400 uppercase tracking-wide";

  if (needsConfirmation) {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <CheckCircle2 className="size-14 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-black text-white">Check your email</h2>
        <p className="text-sm text-tvs-charcoal-400 leading-relaxed">
          We sent a confirmation link to{" "}
          <strong className="text-tvs-charcoal-200">{email}</strong>.
          Click it to activate your account, then sign in.
        </p>
        <p className="text-xs text-tvs-charcoal-500">
          After sign-in, upload your photo on the profile page to help us verify your account faster.
        </p>
        <Link
          href={ROUTES.signin}
          className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-tvs-red-600 hover:bg-tvs-red-500 text-white text-sm font-semibold transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black text-white">Join {APP_META.name}</h1>
        <p className="text-sm text-tvs-charcoal-400 mt-1">Create your community account</p>
      </div>

      <form onSubmit={handleSubmit} className="gradient-card rounded-2xl border border-tvs-charcoal-700 p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40">
            <AlertCircle className="size-4 text-tvs-red-400 shrink-0 mt-px" />
            <p className="text-sm text-tvs-red-300">{error}</p>
          </div>
        )}

        {/* Full name */}
        <div className="space-y-1">
          <label htmlFor="fullName" className={labelClass}>
            Full Name <span className="text-tvs-red-500">*</span>
          </label>
          <input id="fullName" type="text" value={fullName} required
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ramesh Shrestha" disabled={loading} className={inputClass} />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-tvs-red-500">*</span>
          </label>
          <input id="email" type="email" value={email} required autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" disabled={loading} className={inputClass} />
        </div>

        {/* Password */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="password" className={labelClass}>
              Password <span className="text-tvs-red-500">*</span>
            </label>
            <input id="password" type="password" value={password} required minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 chars" disabled={loading} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirm" className={labelClass}>
              Confirm <span className="text-tvs-red-500">*</span>
            </label>
            <input id="confirm" type="password" value={confirm} required
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat" disabled={loading} className={inputClass} />
          </div>
        </div>

        <div className="border-t border-tvs-charcoal-800 pt-3">
          <p className="text-[11px] uppercase tracking-widest text-tvs-charcoal-500 mb-3">Rider Details</p>

          {/* DOB + License */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="dob" className={labelClass}>
                Date of Birth <span className="text-tvs-red-500">*</span>
              </label>
              <input id="dob" type="date" value={dateOfBirth} required
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={loading}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0,10)}
                className={inputClass} />
            </div>
            <div className="space-y-1">
              <label htmlFor="license" className={labelClass}>
                License No. <span className="text-tvs-red-500">*</span>
              </label>
              <input id="license" type="text" value={licenseNumber} required
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. BAG-12-12345" disabled={loading} className={inputClass} />
            </div>
          </div>

          {/* Bike model */}
          <div className="space-y-1 mt-3">
            <label htmlFor="bikeModel" className={labelClass}>TVS Model</label>
            <input id="bikeModel" type="text" value={bikeModel}
              onChange={(e) => setBikeModel(e.target.value)}
              placeholder="e.g. Apache RTR 200 4V, Ronin 225…"
              disabled={loading} className={inputClass} />
          </div>

          {/* Address */}
          <div className="space-y-1 mt-3">
            <label htmlFor="address" className={labelClass}>Address</label>
            <input id="address" type="text" value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="City / District" disabled={loading} className={inputClass} />
          </div>
        </div>

        <div className="border-t border-tvs-charcoal-800 pt-3">
          <p className="text-[11px] uppercase tracking-widest text-tvs-charcoal-500 mb-3">Chapter & Contact</p>

          {/* Chapter */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="chapter" className={labelClass}>Chapter</label>
              <select id="chapter" value={chapter} disabled={loading}
                onChange={(e) => setChapter(e.target.value)}
                className={selectClass}>
                <option value="">Select…</option>
                {CHAPTERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1 mt-3">
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input id="phone" type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX" disabled={loading} className={inputClass} />
          </div>
        </div>

        <p className="text-[11px] text-tvs-charcoal-500 leading-relaxed">
          Your account will be reviewed by admin before activation. After sign-in, upload a photo on your profile page to help speed up verification.
        </p>

        <button
          type="submit" disabled={loading}
          className={cn(
            "w-full h-10 rounded-lg text-white font-semibold text-sm transition-all",
            loading ? "bg-tvs-charcoal-700 cursor-not-allowed opacity-70"
                    : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red active:scale-[0.98]"
          )}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating account…
              </span>
            : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-tvs-charcoal-500">
        Already a member?{" "}
        <Link href={ROUTES.signin} className="text-tvs-red-400 hover:text-tvs-red-300 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
