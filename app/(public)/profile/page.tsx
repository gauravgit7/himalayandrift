// =============================================================================
// /profile — the signed-in rider's own base
// Middleware already redirects unauthenticated visitors to /signin.
// =============================================================================

import {
  getProfile, getMyRideRegistrations, getMyMemberCard,
  getCardSettings, getBrandLogos,
  getMembershipSettings, getMembershipTiers, getMyLoyalty, resolveTier,
} from "@/lib/supabase/queries";
import { ProfileClient } from "@/features/profile/ProfileClient";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const profile = await getProfile();

  // Should never be null — middleware guarantees a session, and getProfile
  // falls back to auth metadata when no row exists yet.
  if (!profile) return null;

  const [
    registrations, card, cardSettings, brandLogos, membership, tiers, loyalty,
  ] = await Promise.all([
    getMyRideRegistrations(),
    getMyMemberCard(),
    getCardSettings(),
    getBrandLogos(),
    getMembershipSettings(),
    getMembershipTiers(),
    getMyLoyalty(),
  ]);

  const myTier = membership.tiersEnabled
    ? resolveTier(tiers, profile.tierId)
    : null;

  return (
    <ProfileClient
      profile={profile}
      registrations={registrations}
      card={card}
      cardSettings={cardSettings}
      brandLogos={brandLogos}
      tier={myTier}
      membership={membership}
      loyalty={loyalty}
    />
  );
}
