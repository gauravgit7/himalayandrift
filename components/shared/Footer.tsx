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
  { href: "/marshals",     label: "Marshals" },
  { href: "/rides",        label: "All Rides" },
];

interface FooterProps {
  brandLogos?: BrandLogos;
}

export function Footer({ brandLogos }: FooterProps = {}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-tvs-charcoal-950 border-t border-tvs-charcoal-800/60 mt-auto">
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
                  <div className="size-8 rounded-lg bg-tvs-red-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-sm">{APP_META.shortName}</span>
                  </div>
                }
              />
              {/* Text - always shown */}
              <div>
                <span className="text-white font-bold text-sm block leading-tight">
                  {APP_META.name}
                </span>
                <span className="text-tvs-charcoal-500 text-[10px] block tracking-widest uppercase">
                  {APP_META.motto}
                </span>
              </div>
            </div>
            <p className="text-tvs-charcoal-400 text-sm max-w-xs leading-relaxed">
              {APP_META.tagline}.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-widest mb-3">
              Platform
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-tvs-charcoal-300 hover:text-tvs-charcoal-50 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin */}
          <div>
            <h3 className="text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-widest mb-3">
              Operations
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={ROUTES.admin}
                  className="text-sm text-tvs-charcoal-300 hover:text-tvs-charcoal-50 transition-colors"
                >
                  Admin Panel
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.adminCalendar}
                  className="text-sm text-tvs-charcoal-300 hover:text-tvs-charcoal-50 transition-colors"
                >
                  Manage Calendar
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.login}
                  className="text-sm text-tvs-red-500 hover:text-tvs-red-400 transition-colors font-medium"
                >
                  Sign In →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-tvs-charcoal-800/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-tvs-charcoal-600">
            © {year} {APP_META.name}. All rights reserved.
          </p>
          <p className="text-xs text-tvs-charcoal-600">
            Built by Gaurav Subedi
          </p>
        </div>
      </div>
    </footer>
  );
}
