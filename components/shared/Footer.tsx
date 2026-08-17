// =============================================================================
// Footer - site footer with community info
// =============================================================================

import Link from "next/link";
import { ROUTES, APP_META } from "@/lib/constants";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { BrandLogos } from "@/types";

const FOOTER_LINKS = [
  { href: ROUTES.home,     label: "Home"     },
  { href: ROUTES.calendar, label: "Calendar" },
  { href: ROUTES.series,   label: "Series"   },
  { href: "/marshals",     label: "Marshals" },
  { href: "/rides",        label: "All Rides" },
  // The permanent address for a reference code. Belongs in the footer because
  // somebody looking for it has usually lost the link they were sent, and the
  // footer is on every page they might be standing on when they realise.
  { href: ROUTES.checkCode, label: "Check a Code" },
];

interface FooterProps {
  brandLogos?: BrandLogos;
  /** Same object the Navbar gets, so the two agree about who is looking. */
  user?: { isAdmin: boolean } | null;
}

export function Footer({ brandLogos, user }: FooterProps = {}) {
  const year = new Date().getFullYear();

  // The Operations column used to show Admin Panel, Manage Calendar and a
  // Sign In link to everybody, all the time — so a signed-in rider was invited
  // to sign in again, and offered two admin links that would only bounce them.
  // Each audience gets what is actually theirs, and nobody gets an empty column.
  const showAdminLinks = !!user?.isAdmin;
  const showSignIn     = !user;
  const showOperations = showAdminLinks || showSignIn;

  return (
    <footer className="bg-hd-ink-950 border-t border-hd-ink-800/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              {/* Icon slot: logo image or lettermark */}
              <BrandLogo
                logoUrl={brandLogos?.logoUrl}
                alt={APP_META.name}
                className="h-8 w-auto max-w-[36px] object-contain shrink-0"
                fallback={
                  <div className="size-8 rounded-lg bg-hd-ember-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-sm">{APP_META.shortName}</span>
                  </div>
                }
              />
              {/* Text - always shown */}
              <div>
                <span className="text-white font-bold text-sm block leading-tight">
                  {APP_META.name}
                </span>
                <span className="text-hd-ink-500 text-[10px] block tracking-widest uppercase">
                  {APP_META.motto}
                </span>
              </div>
            </div>
            <p className="text-hd-ink-400 text-sm max-w-xs leading-relaxed">
              {APP_META.tagline}.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-hd-ink-400 uppercase tracking-widest mb-3">
              Platform
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-hd-ink-300 hover:text-hd-ink-50 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Operations — committee links for admins, a way in for visitors */}
          {showOperations && (
            <div>
              <h3 className="text-xs font-semibold text-hd-ink-400 uppercase tracking-widest mb-3">
                {showAdminLinks ? "Operations" : "Members"}
              </h3>
              <ul className="space-y-2">
                {showAdminLinks && (
                  <>
                    <li>
                      <Link
                        href={ROUTES.admin}
                        className="text-sm text-hd-ink-300 hover:text-hd-ink-50 transition-colors"
                      >
                        Admin Panel
                      </Link>
                    </li>
                    <li>
                      <Link
                        href={ROUTES.adminCalendar}
                        className="text-sm text-hd-ink-300 hover:text-hd-ink-50 transition-colors"
                      >
                        Manage Calendar
                      </Link>
                    </li>
                  </>
                )}
                {showSignIn && (
                  <li>
                    <Link
                      href={ROUTES.signin}
                      className="text-sm text-hd-ember-500 hover:text-hd-ember-400 transition-colors font-medium"
                    >
                      Sign In →
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-hd-ink-800/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-hd-ink-600">
            © {year} {APP_META.name}. All rights reserved.
          </p>
          <p className="text-xs text-hd-ink-600">
            Built by Gaurav Subedi
          </p>
        </div>
      </div>
    </footer>
  );
}
