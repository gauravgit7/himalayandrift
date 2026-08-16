// =============================================================================
// /login — kept only so old bookmarks and links still land somewhere sensible.
//
// There is one sign-in page now. Two doors (/login for admins, /signin for
// riders) could not work, because the middleware routes you by the session you
// already hold: a signed-in rider clicking "Admin" was bounced home, and a
// signed-in admin clicking "Riders" was bounced to the panel. Neither door
// could ever reach the other kind of session.
//
// /signin authenticates everyone and then routes by who they turn out to be.
// =============================================================================

import { redirect } from "next/navigation";
import { ROUTES }   from "@/lib/constants";

export default function LoginPage() {
  redirect(ROUTES.signin);
}
