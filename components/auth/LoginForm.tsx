// =============================================================================
// LoginForm - Phase 6 · Supabase Auth
// 'use client' - controlled inputs, calls signIn server action
// =============================================================================

"use client";

import { useState }          from "react";
import { AlertCircle }       from "lucide-react";
import { cn }                from "@/utils/cn";
import { signIn }            from "@/lib/supabase/actions";

export function LoginForm() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    // signIn redirects to /admin on success - we only come back here on failure
    const result = await signIn(email.trim(), password);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success: Next.js handles the redirect from the server action
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="gradient-card rounded-2xl border border-tvs-charcoal-700 p-6 space-y-4"
    >
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40">
          <AlertCircle className="size-4 text-tvs-red-400 shrink-0 mt-px" />
          <p className="text-sm text-tvs-red-300">{error}</p>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="text-xs font-medium text-tvs-charcoal-400 uppercase tracking-wide"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@tvs.com.np"
          required
          autoComplete="email"
          disabled={loading}
          className={cn(
            "w-full h-10 px-3 rounded-lg bg-tvs-charcoal-800 border text-sm transition-colors",
            "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
            "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-tvs-red-800" : "border-tvs-charcoal-700"
          )}
        />
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-xs font-medium text-tvs-charcoal-400 uppercase tracking-wide"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={loading}
          className={cn(
            "w-full h-10 px-3 rounded-lg bg-tvs-charcoal-800 border text-sm transition-colors",
            "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
            "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-tvs-red-800" : "border-tvs-charcoal-700"
          )}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full h-10 rounded-lg text-white font-semibold text-sm transition-all duration-200",
          loading
            ? "bg-tvs-charcoal-700 cursor-not-allowed opacity-70"
            : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red active:scale-[0.98]"
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Signing in…
          </span>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
