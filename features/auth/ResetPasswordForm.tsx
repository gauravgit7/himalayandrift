"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn }          from "@/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { ROUTES }      from "@/lib/constants";

export function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [exchanging, setExchanging] = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [done,       setDone]       = useState(false);

  // Exchange the code from the URL for a session (PKCE flow)
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Invalid or expired reset link. Please request a new one.");
      setExchanging(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
      if (err) setError("Invalid or expired reset link. Please request a new one.");
      setExchanging(false);
    });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push(ROUTES.signin), 2500);
  };

  const inputClass = cn(
    "w-full h-10 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm transition-colors",
    "text-hd-ink-100 placeholder:text-hd-ink-600",
    "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  );

  if (exchanging) {
    return (
      <div className="w-full max-w-sm text-center space-y-3">
        <span className="size-10 rounded-full border-2 border-hd-ink-700 border-t-hd-ember-600 animate-spin inline-block" />
        <p className="text-sm text-hd-ink-400">Verifying reset link…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <CheckCircle2 className="size-14 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-black text-white">Password updated</h2>
        <p className="text-sm text-hd-ink-400">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black text-white">New Password</h1>
        <p className="text-sm text-hd-ink-400 mt-1">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit} className="gradient-card rounded-2xl border border-hd-ink-700 p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
            <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
            <p className="text-sm text-hd-ember-300">{error}</p>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-medium text-hd-ink-400 uppercase tracking-wide">
            New Password
          </label>
          <input
            id="password" type="password" value={password} required minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters" disabled={loading || !!error}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirm" className="text-xs font-medium text-hd-ink-400 uppercase tracking-wide">
            Confirm Password
          </label>
          <input
            id="confirm" type="password" value={confirm} required
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password" disabled={loading || !!error}
            className={inputClass}
          />
        </div>

        <button
          type="submit" disabled={loading || !!error}
          className={cn(
            "w-full h-10 rounded-lg text-white font-semibold text-sm transition-all",
            loading || !!error
              ? "bg-hd-ink-700 cursor-not-allowed opacity-70"
              : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember active:scale-[0.98]"
          )}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Updating…
              </span>
            : "Set New Password"}
        </button>
      </form>
    </div>
  );
}
