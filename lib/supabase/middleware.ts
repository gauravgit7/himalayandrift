// =============================================================================
// Supabase Middleware Helper
// Call this inside Next.js middleware.ts to refresh auth sessions and guard routes.
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn("[middleware] Supabase env vars not set - skipping auth refresh");
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — required for Server Components to read auth state
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Admin email allow-list (set ADMIN_EMAILS=a@b.com,c@d.com in .env.local) ──
  // If the env var is not set, any authenticated user can access admin
  // (backwards-compatible with single-admin setups). Set it once you have
  // public users to keep them out of the admin panel.
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  const adminEmails = adminEmailsEnv
    ? adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];

  const isAdminUser =
    !!user &&
    (adminEmails.length === 0 || adminEmails.includes((user.email ?? "").toLowerCase()));

  // ── Route guards ──────────────────────────────────────────────────────────

  // 1. Admin routes: must be authenticated AND be an admin
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdminUser) {
      // Visible in dev-server terminal — compare with your ADMIN_EMAILS value
      console.warn(`[middleware] Admin blocked: user="${user.email}" | ADMIN_EMAILS="${adminEmailsEnv ?? "(not set)"}"`);
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // 2. Admin login page: authenticated admin → /admin, authenticated non-admin → /
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminUser ? "/admin" : "/";
    return NextResponse.redirect(url);
  }

  // 3. Profile page: must be authenticated (any user)
  if (pathname.startsWith("/profile") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 4. Auth pages (signin/signup): already signed in → admin or home
  if ((pathname === "/signin" || pathname === "/signup") && user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminUser ? "/admin" : "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
