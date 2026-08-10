// =============================================================================
// /card/[accessCode] — Full-screen dark card print/download page
// Lives OUTSIDE the (public) layout group so no Navbar or Footer renders,
// giving the print action bar at the top unobstructed space.
// =============================================================================

import { notFound }        from "next/navigation";
import { getMemberCardByAccessCode, getCardSettings, getBrandLogos } from "@/lib/supabase/queries";
import { CardPrintClient } from "@/features/membership/CardPrintClient";

export default async function MemberCardPage({
  params,
}: {
  params: Promise<{ accessCode: string }>;
}) {
  const { accessCode } = await params;
  const code = decodeURIComponent(accessCode).toUpperCase();

  const [card, settings, brandLogos] = await Promise.all([
    getMemberCardByAccessCode(code),
    getCardSettings(),
    getBrandLogos(),
  ]);

  if (!card || card.status !== "approved") notFound();

  return <CardPrintClient card={card} settings={settings} brandLogos={brandLogos} />;
}
