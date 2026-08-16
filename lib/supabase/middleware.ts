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

  // ── Who is an admin ───────────────────────────────────────────────────────
  // profiles.is_admin is the single answer, the same one RLS uses. ADMIN_EMAILS
  // only bootstraps it, once, at sign-in - see signInPublic. One source means
  // the page gate and the data gate can never disagree.
  //
  // Only looked up on the paths that actually care, so public pages do not pay
  // for a query they never read.
  const NEEDS_ROLE = ["/admin", "/profile", "/signin", "/signup", "/login"];
  const roleMatters = NEEDS_ROLE.some((p) => pathname.startsWith(p));

  let isAdminUser = false;
  if (user && roleMatters) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdminUser = !!(profile as { is_admin?: boolean } | null)?.is_admin;
  }

  // ── Route guards ──────────────────────────────────────────────────────────

  /** Where a signed-in user belongs. Used everywhere instead of "/", so nobody
   *  is ever dumped on the homepage wondering what happened. */
  const homeFor = (admin: boolean) => (admin ? "/admin" : "/profile");

  // 1. Admin routes: authenticated AND an admin
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdminUser) {
      // Send them to their own profile rather than the homepage: landing back
      // on the marketing page after clicking something reads as a dead end.
      const url = request.nextUrl.clone();
      url.pathname = "/profile";
      return NextResponse.redirect(url);
    }
  }

  // 2. Profile: any authenticated user
  if (pathname.startsWith("/profile") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 3. Already signed in and asking for an auth page → go where you belong.
  //    Honour ?redirect= so signing in mid-journey returns you to the ride you
  //    were looking at.
  if ((pathname === "/signin" || pathname === "/signup" || pathname === "/login") && user) {
    const url = request.nextUrl.clone();
    const wanted = request.nextUrl.searchParams.get("redirect");
    url.pathname = wanted && wanted.startsWith("/") ? wanted : homeFor(isAdminUser);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
