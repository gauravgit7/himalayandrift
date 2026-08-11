"use client";

// =============================================================================
// Navbar — main navigation bar
// Transparent on hero, solid on scroll; mobile hamburger menu.
// Shows Sign In / user avatar based on auth state passed from server layout.
// =============================================================================

import { useState, useEffect }  from "react";
import Link                     from "next/link";
import { usePathname }          from "next/navigation";
import { Menu, X, Calendar, Map, BookOpen,
         Shield, CreditCard, LogOut, User } from "lucide-react";
import { cn }                   from "@/utils/cn";
import { ROUTES, APP_META }     from "@/lib/constants";
import { Button }               from "@/components/ui/Button";
import { ThemeToggle }          from "@/components/theme/ThemeToggle";
import { signOutPublic }        from "@/lib/supabase/actions";
import type { BrandLogos }      from "@/types";

const NAV_LINKS = [
  { href: ROUTES.home,       label: "Home",       icon: null       },
  { href: ROUTES.calendar,   label: "Calendar",   icon: Calendar   },
  { href: ROUTES.marshals,   label: "Marshals",   icon: Shield     },
  { href: ROUTES.rides,      label: "Rides",      icon: BookOpen   },
  { href: ROUTES.membership, label: "Membership", icon: CreditCard },
] as const;

interface NavUser {
  fullName:  string;
  avatarUrl: string | null;
  isAdmin:   boolean;
}

interface NavbarProps {
  transparent?: boolean;
  brandLogos?:  BrandLogos;
  user?:        NavUser | null;
}

export function Navbar({ transparent = false, brandLogos, user }: NavbarProps) {
  const pathname     = usePathname();
  const [isScrolled,   setIsScrolled]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!transparent) return;
    const handler = () => setIsScrolled(window.scrollY > 60);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [transparent]);

  useEffect(() => { setIsMobileOpen(false); setUserMenuOpen(false); }, [pathname]);

  const isSolid = !transparent || isScrolled;

  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header
      className={cn(
        "print:hidden fixed top-0 inset-x-0 z-[100] transition-all duration-300",
        isSolid
          ? "bg-hd-ink-950/95 backdrop-blur-md border-b border-hd-ink-800/80 shadow-cinematic"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ── */}
          <Link href={ROUTES.home} className="flex items-center gap-2.5 group">
            {brandLogos?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <span className="shrink-0 inline-flex items-center" style={{ height: "28px" }}>
                <img src={brandLogos.logoUrl} alt={APP_META.name} className="h-full w-auto block" />
              </span>
            ) : (
              <div className="size-8 rounded-lg bg-hd-ember-600 flex items-center justify-center shadow-glow-ember group-hover:bg-hd-ember-500 transition-colors shrink-0">
                <span className="text-white font-black text-sm leading-none">{APP_META.shortName}</span>
              </div>
            )}
            <div className="hidden sm:block">
              <span className="text-white font-bold text-sm leading-none block whitespace-nowrap">
                {APP_META.name}
              </span>
              {/* Motto only on wide viewports - it is too long to sit under the
                  wordmark without wrapping the 4rem navbar on smaller screens. */}
              <span className="hidden xl:block text-hd-ink-400 text-[10px] leading-none mt-0.5 font-medium tracking-wide uppercase whitespace-nowrap">
                {APP_META.motto}
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-hd-ember-600/15 text-hd-ember-400"
                      : "text-hd-ink-300 hover:text-hd-ink-50 hover:bg-hd-ink-800"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right actions ── */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />

            {user?.isAdmin ? (
              /* ── Admin browsing the public site: back-link only, no rider UI ── */
              <Link
                href={ROUTES.admin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-hd-ember-400 hover:text-hd-ember-300 border border-hd-ember-800/50 hover:border-hd-ember-700 hover:bg-hd-ember-950/30 transition-all"
              >
                <Shield className="size-3.5" />
                Admin Panel
              </Link>
            ) : user ? (
              /* ── Signed-in rider: profile dropdown + Admin button ── */
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-hd-ink-800 transition-colors"
                  >
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="size-7 rounded-full object-cover border border-hd-ink-700"
                      />
                    ) : (
                      <div className="size-7 rounded-full bg-hd-ember-600 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-white">{initials}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-hd-ink-200 max-w-[100px] truncate">
                      {user.fullName}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-hd-ink-900 border border-hd-ink-700 shadow-cinematic py-1 z-50">
                      <Link
                        href={ROUTES.profile}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-hd-ink-200 hover:bg-hd-ink-800 hover:text-white transition-colors"
                      >
                        <User className="size-4" /> My Profile
                      </Link>
                      <div className="h-px bg-hd-ink-800 my-1" />
                      <form action={signOutPublic}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-hd-ember-400 hover:bg-hd-ember-950/40 transition-colors"
                        >
                          <LogOut className="size-4" /> Sign Out
                        </button>
                      </form>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = ROUTES.login}>
                  Admin
                </Button>
              </>
            ) : (
              /* ── Signed out: Riders + Admin buttons ── */
              <>
                <Link
                  href={ROUTES.signin}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-hd-ink-200 hover:text-white border border-hd-ink-700 hover:border-hd-ink-500 transition-all"
                >
                  Riders
                </Link>
                <Button variant="outline" size="sm" onClick={() => window.location.href = ROUTES.login}>
                  Admin
                </Button>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-hd-ink-300 hover:text-hd-ink-50 hover:bg-hd-ink-800 transition-colors"
            onClick={() => setIsMobileOpen((v) => !v)}
            aria-label={isMobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {isMobileOpen && (
        <div className="md:hidden bg-hd-ink-950/98 backdrop-blur-md border-t border-hd-ink-800 animate-fade-in">
          <nav className="px-4 py-3 flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-hd-ember-600/15 text-hd-ember-400"
                      : "text-hd-ink-300 hover:text-hd-ink-50 hover:bg-hd-ink-800"
                  )}
                >
                  {Icon && <Icon className="size-4 shrink-0" />}
                  {label}
                </Link>
              );
            })}

            <div className="pt-2 pb-1 border-t border-hd-ink-800 mt-1 flex flex-col gap-1">
              {user?.isAdmin ? (
                /* Admin on public site — back-link only */
                <Link
                  href={ROUTES.admin}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-hd-ember-400 border border-hd-ember-800/40 hover:bg-hd-ember-950/30 transition-colors"
                >
                  <Shield className="size-4 shrink-0" /> Admin Panel
                </Link>
              ) : user ? (
                /* Signed-in rider */
                <>
                  <Link
                    href={ROUTES.profile}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-hd-ink-300 hover:text-white hover:bg-hd-ink-800 transition-colors"
                  >
                    <User className="size-4 shrink-0" /> My Profile
                  </Link>
                  <form action={signOutPublic}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-hd-ember-400 hover:bg-hd-ember-950/30 transition-colors"
                    >
                      <LogOut className="size-4 shrink-0" /> Sign Out
                    </button>
                  </form>
                  <Link
                    href={ROUTES.login}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-hd-ember-400 border border-hd-ember-700/50 hover:bg-hd-ember-600/10 transition-colors"
                  >
                    Admin Panel
                  </Link>
                </>
              ) : (
                /* Signed out */
                <>
                  <Link
                    href={ROUTES.signin}
                    className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-semibold text-hd-ink-200 border border-hd-ink-700 hover:border-hd-ink-500 transition-all"
                  >
                    Riders
                  </Link>
                  <Link
                    href={ROUTES.login}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-hd-ember-400 border border-hd-ember-700/50 hover:bg-hd-ember-600/10 transition-colors"
                  >
                    Admin Panel
                  </Link>
                </>
              )}
              <div className="flex justify-end mt-1 px-1">
                <ThemeToggle />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
