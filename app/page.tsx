// =============================================================================
// Root page - redirects to public homepage
// Built out fully in Phase 3: Homepage
// =============================================================================

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/home");
}
