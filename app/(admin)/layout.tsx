// =============================================================================
// Admin Layout
// Fixed top Navbar + fixed left AdminSidebar + scrollable main content.
// Auth guard: session required AND email must be in ADMIN_EMAILS env var.
// =============================================================================

import { redirect }      from "next/navigation";
import { Navbar }        from "@/components/shared/Navbar";
import { AdminSidebar }  from "@/components/shared/AdminSidebar";
import { createClient }  from "@/lib/supabase/server";
import { getBrandLogos, getNavbarUser } from "@/lib/supabase/queries";
import { ROUTES }        from "@/lib/constants";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.signin);

  // profiles.is_admin, the same source the middleware and RLS use. This used to
  // read ADMIN_EMAILS directly and, when that was unset, let every authenticated
  // user straight in - the fail-open that was closed in the middleware but lived
  // on here. It fails closed now.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!(profile as { is_admin?: boolean } | null)?.is_admin) {
    redirect(ROUTES.profile);
  }

  const [{ logoUrl }, navbarUser] = await Promise.all([
    getBrandLogos(),
    // Without this the navbar rendered its signed-OUT branch and showed a
    // "Sign In" button to someone already inside the admin panel.
    getNavbarUser(),
  ]);

  const adminName  = (user.user_metadata?.full_name as string | undefined) ?? null;
  const adminEmail = user.email ?? null;

  return (
    <div className="min-h-dvh bg-hd-ink-950">
      <Navbar transparent={false} user={navbarUser} />
      <AdminSidebar logoUrl={logoUrl} adminEmail={adminEmail} adminName={adminName} />
      <main className="pt-16 lg:pl-60 min-h-dvh">
        {children}
      </main>
    </div>
  );
}
