// =============================================================================
// AdminSidebar - Phase 5 · Fixed left navigation for the admin section
// 'use client' - mobile toggle, active-link highlighting
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Flag,
  Calendar,
  Globe,
  Map,
  Star,
  FileDown,
  Shield,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  CreditCard,
} from "lucide-react";
import { cn }       from "@/utils/cn";
import { ROUTES, APP_META } from "@/lib/constants";
import { signOut }  from "@/lib/supabase/actions";

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { href: ROUTES.admin,          label: "Dashboard", icon: LayoutDashboard, exact: true  },
  { href: ROUTES.adminRides,     label: "Rides",     icon: Flag,            exact: false },
  { href: ROUTES.adminCalendar,  label: "Calendar",  icon: Calendar,        exact: false },
  { href: ROUTES.adminHomepage,  label: "Homepage",  icon: Globe,           exact: false },
  { href: ROUTES.adminChapters,  label: "Chapters",  icon: Map,             exact: false },
  { href: ROUTES.adminMarshals,  label: "Marshals",  icon: Shield,          exact: false },
  { href: ROUTES.adminMembers,   label: "Members",   icon: CreditCard,      exact: false },
  { href: ROUTES.adminSponsors,  label: "Sponsors",  icon: Star,            exact: false },
  { href: ROUTES.adminExports,   label: "Exports",   icon: FileDown,        exact: false },
  { href: ROUTES.adminSettings,  label: "Settings",  icon: Settings,        exact: false },
] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NavLink({
  item,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-tvs-red-600/20 text-tvs-red-300 border border-tvs-red-800/40"
          : "text-tvs-charcoal-400 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-800/60 border border-transparent"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive ? "text-tvs-red-400" : "text-tvs-charcoal-500 group-hover:text-tvs-charcoal-300"
        )}
      />
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight className="size-3 text-tvs-red-500/60" />}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar content (shared between desktop and mobile drawer)
// ---------------------------------------------------------------------------

function SidebarContent({ onLinkClick, logoUrl, adminEmail, adminName }: {
  onLinkClick?: () => void;
  logoUrl?: string | null;
  adminEmail?: string | null;
  adminName?: string | null;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-3 py-4 mb-2 border-b border-tvs-charcoal-800/60">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={APP_META.name}
              className="h-8 w-auto object-contain shrink-0"
            />
          ) : (
            <div className="size-8 rounded-lg bg-tvs-red-600 flex items-center justify-center shadow-glow-red shrink-0">
              <span className="text-white font-black text-sm">{APP_META.shortName}</span>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-tvs-charcoal-50 leading-tight">{APP_META.name}</p>
            <p className="text-[10px] text-tvs-charcoal-500 leading-tight">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} onClick={onLinkClick} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-tvs-charcoal-800/60 space-y-0.5">
        {/* Admin identity */}
        {(adminName || adminEmail) && (
          <div className="px-3 py-2 mb-1">
            {adminName && (
              <p className="text-xs font-semibold text-tvs-charcoal-300 truncate">{adminName}</p>
            )}
            {adminEmail && (
              <p className="text-[10px] text-tvs-charcoal-600 truncate">{adminEmail}</p>
            )}
          </div>
        )}
        <Link
          href={ROUTES.home}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-tvs-charcoal-500 hover:text-tvs-charcoal-200 hover:bg-tvs-charcoal-800/60 transition-all duration-150"
        >
          <Globe className="size-4 shrink-0" />
          View Public Site
        </Link>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-tvs-charcoal-500 hover:text-tvs-red-400 hover:bg-tvs-charcoal-800/60 transition-all duration-150"
        >
          <LogOut className="size-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export - renders desktop sidebar + mobile toggle
// ---------------------------------------------------------------------------

interface AdminSidebarProps {
  logoUrl?: string | null;
  adminEmail?: string | null;
  adminName?: string | null;
}

export function AdminSidebar({ logoUrl, adminEmail, adminName }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar - fixed left ── */}
      <aside className="hidden lg:flex flex-col fixed top-16 left-0 h-[calc(100dvh-4rem)] w-60 bg-tvs-charcoal-900 border-r border-tvs-charcoal-800/60 z-30">
        <SidebarContent logoUrl={logoUrl} adminEmail={adminEmail} adminName={adminName} />
      </aside>

      {/* ── Mobile hamburger button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-[4.5rem] left-3 z-40 flex items-center justify-center size-9 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-tvs-charcoal-300 hover:text-tvs-charcoal-50 shadow-md transition-colors"
        aria-label="Open admin menu"
      >
        <Menu className="size-4" />
      </button>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 h-dvh w-72 bg-tvs-charcoal-900 border-r border-tvs-charcoal-800 z-50 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-tvs-charcoal-400 hover:text-tvs-charcoal-50 transition-colors"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <div className="pt-14 h-full">
              <SidebarContent
                onLinkClick={() => setMobileOpen(false)}
                logoUrl={logoUrl}
                adminEmail={adminEmail}
                adminName={adminName}
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
