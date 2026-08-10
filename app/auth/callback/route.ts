// =============================================================================
// /auth/callback — Supabase PKCE email-confirmation handler
// Supabase sends the user here after they click the confirmation link.
// We exchange the one-time code for a session, then redirect to home.
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient }             from "@supabase/ssr";
import { cookies }                        from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to `next` if supplied (used by password-reset), otherwise home
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  }

  // Something went wrong — redirect home with an error flag
  return NextResponse.redirect(`${origin}/?auth_error=confirmation_failed`);
}
