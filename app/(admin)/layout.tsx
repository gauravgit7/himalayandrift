// =============================================================================
// Admin Layout
// Fixed top Navbar + fixed left AdminSidebar + scrollable main content.
// Auth guard: session required AND email must be in ADMIN_EMAILS env var.
// =============================================================================

import { redirect }      from "next/navigation";
import { Navbar }        from "@/components/shared/Navbar";
import { AdminSidebar }  from "@/components/shared/AdminSidebar";
import { createClient }  from "@/lib/supabase/server";
import { getBrandLogos } from "@/lib/supabase/queries";
import { ROUTES }        from "@/lib/constants";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  // Enforce admin allow-list when ADMIN_EMAILS is configured
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (adminEmailsEnv) {
    const adminEmails = adminEmailsEnv
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const userEmail = (user.email ?? "").toLowerCase();
    if (!adminEmails.includes(userEmail)) {
      // Visible in your dev-server terminal — check the values match exactly
      console.warn(`[admin-layout] Access denied. user="${userEmail}" not in ADMIN_EMAILS=[${adminEmails.join(", ")}]`);
      redirect(ROUTES.home);
    }
  } else {
    console.warn("[admin-layout] ADMIN_EMAILS not set — allowing all authenticated users into admin.");
  }

  const { logoUrl } = await getBrandLogos();

  const adminName  = (user.user_metadata?.full_name as string | undefined) ?? null;
  const adminEmail = user.email ?? null;

  return (
    <div className="min-h-dvh bg-tvs-charcoal-950">
      <Navbar transparent={false} />
      <AdminSidebar logoUrl={logoUrl} adminEmail={adminEmail} adminName={adminName} />
      <main className="pt-16 lg:pl-60 min-h-dvh">
        {children}
      </main>
    </div>
  );
}
