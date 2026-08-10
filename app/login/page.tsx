// =============================================================================
// Login Page - Phase 6 · Supabase Auth
// =============================================================================

import type { Metadata } from "next";
import { LoginForm }     from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign In | TVS Nepal Admin" };

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="size-12 rounded-xl bg-tvs-red-600 flex items-center justify-center mx-auto shadow-glow-red">
            <span className="text-white font-black text-lg">T</span>
          </div>
          <h1 className="text-xl font-bold text-tvs-charcoal-50">TVS Nepal Admin</h1>
          <p className="text-sm text-tvs-charcoal-400">Sign in to manage ride operations</p>
        </div>

        {/* Auth form - client component with Supabase signIn action */}
        <LoginForm />

        <p className="text-center text-xs text-tvs-charcoal-600">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
