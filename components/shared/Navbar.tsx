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
  { href: ROUTES.chapters,   label: "Chapters",   icon: Map        },
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
          ? "bg-tvs-charcoal-950/95 backdrop-blur-md border-b border-tvs-charcoal-800/80 shadow-cinematic"
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
              <div className="size-8 rounded-lg bg-tvs-red-600 flex items-center justify-center shadow-glow-red group-hover:bg-tvs-red-500 transition-colors shrink-0">
                <span className="text-white font-black text-sm leading-none">{APP_META.shortName}</span>
              </div>
            )}
            <div className="hidden sm:block">
              <span className="text-white font-bold text-sm leading-none">{APP_META.name}</span>
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
                      ? "bg-tvs-red-600/15 text-tvs-red-400"
                      : "text-tvs-charcoal-300 hover:text-tvs-charcoal-50 hover:bg-tvs-charcoal-800"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-tvs-red-400 hover:text-tvs-red-300 border border-tvs-red-800/50 hover:border-tvs-red-700 hover:bg-tvs-red-950/30 transition-all"
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
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-tvs-charcoal-800 transition-colors"
                  >
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="size-7 rounded-full object-cover border border-tvs-charcoal-700"
                      />
                    ) : (
                      <div className="size-7 rounded-full bg-tvs-red-600 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-white">{initials}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-tvs-charcoal-200 max-w-[100px] truncate">
                      {user.fullName}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-tvs-charcoal-900 border border-tvs-charcoal-700 shadow-cinematic py-1 z-50">
                      <Link
                        href={ROUTES.profile}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-tvs-charcoal-200 hover:bg-tvs-charcoal-800 hover:text-white transition-colors"
                      >
                        <User className="size-4" /> My Profile
                      </Link>
                      <div className="h-px bg-tvs-charcoal-800 my-1" />
                      <form action={signOutPublic}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-tvs-red-400 hover:bg-tvs-red-950/40 transition-colors"
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
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-tvs-charcoal-200 hover:text-white border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 transition-all"
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
            className="md:hidden p-2 rounded-lg text-tvs-charcoal-300 hover:text-tvs-charcoal-50 hover:bg-tvs-charcoal-800 transition-colors"
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
        <div className="md:hidden bg-tvs-charcoal-950/98 backdrop-blur-md border-t border-tvs-charcoal-800 animate-fade-in">
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
                      ? "bg-tvs-red-600/15 text-tvs-red-400"
                      : "text-tvs-charcoal-300 hover:text-tvs-charcoal-50 hover:bg-tvs-charcoal-800"
                  )}
                >
                  {Icon && <Icon className="size-4 shrink-0" />}
                  {label}
                </Link>
              );
            })}

            <div className="pt-2 pb-1 border-t border-tvs-charcoal-800 mt-1 flex flex-col gap-1">
              {user?.isAdmin ? (
                /* Admin on public site — back-link only */
                <Link
                  href={ROUTES.admin}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-tvs-red-400 border border-tvs-red-800/40 hover:bg-tvs-red-950/30 transition-colors"
                >
                  <Shield className="size-4 shrink-0" /> Admin Panel
                </Link>
              ) : user ? (
                /* Signed-in rider */
                <>
                  <Link
                    href={ROUTES.profile}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-tvs-charcoal-300 hover:text-white hover:bg-tvs-charcoal-800 transition-colors"
                  >
                    <User className="size-4 shrink-0" /> My Profile
                  </Link>
                  <form action={signOutPublic}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-tvs-red-400 hover:bg-tvs-red-950/30 transition-colors"
                    >
                      <LogOut className="size-4 shrink-0" /> Sign Out
                    </button>
                  </form>
                  <Link
                    href={ROUTES.login}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-tvs-red-400 border border-tvs-red-700/50 hover:bg-tvs-red-600/10 transition-colors"
                  >
                    Admin Panel
                  </Link>
                </>
              ) : (
                /* Signed out */
                <>
                  <Link
                    href={ROUTES.signin}
                    className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-semibold text-tvs-charcoal-200 border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 transition-all"
                  >
                    Riders
                  </Link>
                  <Link
                    href={ROUTES.login}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-tvs-red-400 border border-tvs-red-700/50 hover:bg-tvs-red-600/10 transition-colors"
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
