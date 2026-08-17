// =============================================================================
// Public Layout - wraps all public-facing pages
// Provides Navbar + Footer shell with page-level fade-in transition.
// Phase 10 · Async: fetches homepage content to pass brand logos to
//            Navbar and Footer (React cache() deduplicates the DB call
//            when home page also calls getHomepageContent).
// =============================================================================

import { Navbar }                from "@/components/shared/Navbar";
import { Footer }                from "@/components/shared/Footer";
import { PageTransitionWrapper } from "@/components/shared/PageTransitionWrapper";
import { getHomepageContent, getNavbarUser } from "@/lib/supabase/queries";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [homepage, navbarUser] = await Promise.all([
    getHomepageContent(),
    getNavbarUser(),
  ]);
  const brandLogos = homepage.brandLogos;

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar transparent brandLogos={brandLogos} user={navbarUser} />
      <PageTransitionWrapper className="flex-1">
        {children}
      </PageTransitionWrapper>
      <Footer brandLogos={brandLogos} user={navbarUser} />
    </div>
  );
}
