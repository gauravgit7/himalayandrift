// =============================================================================
// /profile — signed-in user's profile page
// Middleware already redirects unauthenticated users to /signin.
// getProfile() always returns a value for authenticated users (falls back to
// auth metadata when no DB row exists yet).
// =============================================================================

import { getProfile } from "@/lib/supabase/queries";
import { ProfileClient } from "@/features/profile/ProfileClient";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const profile = await getProfile();

  // Should never be null here — middleware ensures the user is authenticated,
  // and getProfile() returns a default when no profile row exists yet.
  if (!profile) return null;

  return <ProfileClient profile={profile} />;
}
