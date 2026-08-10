"use client";

import { useState }           from "react";
import Link                   from "next/link";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn }                 from "@/utils/cn";
import { sendPasswordReset }  from "@/lib/supabase/actions";
import { ROUTES }             from "@/lib/constants";

export function ForgotPasswordForm() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError(null);
    const result = await sendPasswordReset(email.trim());
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setSent(true);
  };

  const inputClass = cn(
    "w-full h-10 px-3 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-sm transition-colors",
    "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
    "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  );

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <CheckCircle2 className="size-14 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-black text-white">Check your email</h2>
        <p className="text-sm text-tvs-charcoal-400 leading-relaxed">
          If <strong className="text-tvs-charcoal-200">{email}</strong> matches an account, you&apos;ll receive a password reset link shortly.
        </p>
        <Link
          href={ROUTES.signin}
          className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-tvs-red-600 hover:bg-tvs-red-500 text-white text-sm font-semibold transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black text-white">Reset Password</h1>
        <p className="text-sm text-tvs-charcoal-400 mt-1">Enter your email to receive a reset link</p>
      </div>

      <form onSubmit={handleSubmit} className="gradient-card rounded-2xl border border-tvs-charcoal-700 p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40">
            <AlertCircle className="size-4 text-tvs-red-400 shrink-0 mt-px" />
            <p className="text-sm text-tvs-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-tvs-charcoal-400 uppercase tracking-wide">
            Email
          </label>
          <input
            id="email" type="email" value={email} required autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" disabled={loading}
            className={inputClass}
          />
        </div>

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
                Sending…
              </span>
            : "Send Reset Link"}
        </button>
      </form>

      <p className="text-center text-sm text-tvs-charcoal-500">
        <Link href={ROUTES.signin} className="inline-flex items-center gap-1 text-tvs-red-400 hover:text-tvs-red-300 font-semibold transition-colors">
          <ArrowLeft className="size-3.5" />
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
