// =============================================================================
// Server-side authorisation guard
//
// The admin routes are gated by the middleware, and a Server Action posts to
// the route it was rendered on — so an action that only ever appears inside
// /admin is protected by that alone. That is a property of where a component
// happens to be imported, though, not of the action itself, and it stops being
// true the first time someone reuses the import somewhere public.
//
// Actions that grant something — a card, a role, someone else's record — check
// for themselves.
// =============================================================================

import { createClient } from "@/lib/supabase/server";

/**
 * Returns an error string when the caller is not a committee member, or null
 * when they are. profiles.is_admin is the single source, the same one the
 * middleware and every RLS policy consult.
 */
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Not signed in.";

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles").select("is_admin").eq("id", user.id).maybeSingle();

  // Fail closed: an unreadable profile is not a licence to proceed.
  if (error) return "Could not verify your account.";
  if (!(data as { is_admin?: boolean } | null)?.is_admin) {
    return "Committee access required.";
  }
  return null;
}
