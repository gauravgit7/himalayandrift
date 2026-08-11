"use client";

import { useState }     from "react";
import Link             from "next/link";
import { AlertCircle }  from "lucide-react";
import { cn }           from "@/utils/cn";
import { signInPublic } from "@/lib/supabase/actions";
import { ROUTES }       from "@/lib/constants";

export function PublicSignInForm() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true); setError(null);
    const result = await signInPublic(email.trim(), password);
    if (result?.error) { setError(result.error); setLoading(false); }
  };

  const inputClass = cn(
    "w-full h-10 px-3 rounded-lg bg-hd-ink-800 border text-sm transition-colors",
    "text-hd-ink-100 placeholder:text-hd-ink-600",
    "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  );

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black text-white">Welcome back</h1>
        <p className="text-sm text-hd-ink-400 mt-1">Sign in to your Himalayan Drift account</p>
      </div>

      <form onSubmit={handleSubmit} className="gradient-card rounded-2xl border border-hd-ink-700 p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
            <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
            <p className="text-sm text-hd-ember-300">{error}</p>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-hd-ink-400 uppercase tracking-wide">
            Email
          </label>
          <input
            id="email" type="email" value={email} required autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" disabled={loading}
            className={cn(inputClass, error ? "border-hd-ember-800" : "border-hd-ink-700")}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-hd-ink-400 uppercase tracking-wide">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-hd-ember-400 hover:text-hd-ember-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <input
            id="password" type="password" value={password} required autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" disabled={loading}
            className={cn(inputClass, error ? "border-hd-ember-800" : "border-hd-ink-700")}
          />
        </div>

        <button
          type="submit" disabled={loading}
          className={cn(
            "w-full h-10 rounded-lg text-white font-semibold text-sm transition-all",
            loading ? "bg-hd-ink-700 cursor-not-allowed opacity-70"
                    : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember active:scale-[0.98]"
          )}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in…
              </span>
            : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-hd-ink-500">
        New here?{" "}
        <Link href={ROUTES.signup} className="text-hd-ember-400 hover:text-hd-ember-300 font-semibold transition-colors">
          Create an account
        </Link>
      </p>
    </div>
  );
}
