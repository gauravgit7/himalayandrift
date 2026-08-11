// =============================================================================
// MarshalPageClient - public Marshals page display + role filter
// 'use client' - role filter state is client-side
// Marshals sorted by tier: Head Marshal → Senior Marshal → Regional Marshal
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import { Shield, Bike }        from "lucide-react";
import { QRCodeCanvas }        from "qrcode.react";
import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/AnimateIn";
import { cn }        from "@/utils/cn";
import type { Marshal } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoleTier(role: string): 0 | 1 | 2 | 3 {
  if (role === "Head Marshal")   return 0;
  if (role === "Senior Marshal") return 1;
  if (role === "Ride Marshal")   return 2;
  return 3;
}

function parseSpecialties(specialty: string | null): string[] {
  if (!specialty) return [];
  return specialty.split(",").map((s) => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Role badge - colour-coded by tier
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: string }) {
  const tier = getRoleTier(role);
  return (
    <span className={cn(
      "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0",
      tier === 0 && "bg-tvs-red-900/60 text-tvs-red-400 border-tvs-red-800/40",
      tier === 1 && "bg-amber-900/50  text-amber-400  border-amber-800/40",
      tier === 2 && "bg-blue-900/40   text-blue-400   border-blue-800/30",
      tier === 3 && "bg-tvs-charcoal-800 text-tvs-charcoal-400 border-tvs-charcoal-700",
    )}>
      {role}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Avatar placeholder
// ---------------------------------------------------------------------------

function AvatarPlaceholder({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn("flex items-center justify-center font-black text-tvs-charcoal-400", className)}>
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HEAD MARSHAL CARD
// Photo: size-40 sm:size-48 (160/192px). QR: 72px. Full-width horizontal.
// ---------------------------------------------------------------------------

function HeadMarshalCard({ marshal, origin }: { marshal: Marshal; origin: string }) {
  const specialties = parseSpecialties(marshal.specialty);
  const qrValue     = marshal.instagramHandle
    ? `https://instagram.com/${marshal.instagramHandle}`
    : origin ? `${origin}/marshals` : "";

  return (
    <div className="relative flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-gradient-to-br from-tvs-charcoal-900 via-tvs-charcoal-900 to-tvs-red-950/20 border border-tvs-red-800/40 shadow-cinematic overflow-hidden">
      {/* Accent line */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-tvs-red-600/50 to-transparent" />

      {/* Photo — size-40 sm:size-48 */}
      <div className="shrink-0 mx-auto sm:mx-0">
        {marshal.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={marshal.avatarUrl}
            alt={marshal.name}
            className="size-40 sm:size-48 rounded-2xl object-cover object-top border-2 border-tvs-red-800/50"
          />
        ) : (
          <div className="size-40 sm:size-48 rounded-2xl bg-tvs-charcoal-800 border-2 border-tvs-red-800/40">
            <AvatarPlaceholder name={marshal.name} className="size-full text-5xl rounded-2xl" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 text-center sm:text-left min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start flex-wrap">
          <h2 className="text-2xl font-black text-tvs-charcoal-50 truncate">{marshal.name}</h2>
          <RoleBadge role={marshal.role} />
        </div>

        {specialties.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3 justify-center sm:justify-start">
            {specialties.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full bg-tvs-red-950/60 text-tvs-red-400 border border-tvs-red-900/40 font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {marshal.bio && (
          <p className="text-sm text-tvs-charcoal-300 leading-relaxed mb-3 max-w-prose">
            {marshal.bio}
          </p>
        )}

        {marshal.totalRidesLed > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-tvs-charcoal-400 justify-center sm:justify-start">
            <Bike className="size-3.5 text-tvs-charcoal-500" />
            <strong className="text-tvs-charcoal-200">{marshal.totalRidesLed}</strong>
            &nbsp;rides led
          </div>
        )}
      </div>

      {/* QR — 72px, shown on all screen sizes.
          On mobile (flex-col) it appears below the details, centred via mx-auto.
          On sm+ (flex-row) it sits on the right, self-centred vertically. */}
      {qrValue && (
        <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 self-center mx-auto sm:mx-0">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <QRCodeCanvas
              value={qrValue}
              size={72}
              bgColor="#ffffff"
              fgColor="#111827"
              level="M"
            />
          </div>
          <p className="text-[9px] text-tvs-charcoal-500 leading-none text-center truncate max-w-[90px]">
            {marshal.instagramHandle ? `@${marshal.instagramHandle}` : "marshals"}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-variant style + size tokens
// All class strings are complete so Tailwind JIT keeps them.
// ---------------------------------------------------------------------------

const VARIANT_STYLES = {
  senior: {
    // Card
    card:          "border-amber-900/30 hover:border-amber-700/50",
    line:          "bg-gradient-to-r from-transparent via-amber-700/40 to-transparent",
    chip:          "bg-amber-950/50 text-amber-500 border-amber-900/30",
    padding:       "p-4",
    gap:           "gap-3 sm:gap-4",
    // Photo: 120px (size-30 = 30 × 4px)
    photoSize:     "size-30",
    avatarText:    "text-3xl",
    // QR: 56px canvas → container width = 56 + 2×6px padding = 68px
    qrSize:        56 as const,
    qrPadding:     "p-1.5",
    qrContainerW:  "w-[68px]",
    qrLabelMaxW:   "max-w-[78px]",
    // Bio: always shown for senior
    alwaysShowBio: true,
  },
  regional: {
    card:          "border-blue-900/30 hover:border-blue-700/40",
    line:          "bg-gradient-to-r from-transparent via-blue-700/40 to-transparent",
    chip:          "bg-blue-950/50 text-blue-400 border-blue-900/30",
    padding:       "p-3",
    gap:           "gap-2 sm:gap-3",
    // Photo: 100px (size-25 = 25 × 4px)
    photoSize:     "size-25",
    avatarText:    "text-2xl",
    // QR: 44px canvas → container width = 44 + 2×4px padding = 52px
    qrSize:        44 as const,
    qrPadding:     "p-1",
    qrContainerW:  "w-[52px]",
    qrLabelMaxW:   "max-w-[62px]",
    alwaysShowBio: false,
  },
  other: {
    card:          "border-tvs-charcoal-700 hover:border-tvs-charcoal-500",
    line:          "bg-gradient-to-r from-transparent via-tvs-charcoal-600/30 to-transparent",
    chip:          "bg-tvs-charcoal-800 text-tvs-charcoal-400 border-tvs-charcoal-700",
    padding:       "p-3",
    gap:           "gap-2 sm:gap-3",
    photoSize:     "size-25",
    avatarText:    "text-2xl",
    qrSize:        44 as const,
    qrPadding:     "p-1",
    qrContainerW:  "w-[52px]",
    qrLabelMaxW:   "max-w-[62px]",
    alwaysShowBio: false,
  },
} as const;

// ---------------------------------------------------------------------------
// UNIFIED MARSHAL CARD  (Senior + Regional + Other)
// ---------------------------------------------------------------------------

function MarshalCard({
  marshal,
  origin,
  variant,
}: {
  marshal: Marshal;
  origin:  string;
  variant: "senior" | "regional" | "other";
}) {
  const specialties = parseSpecialties(marshal.specialty);
  const s           = VARIANT_STYLES[variant];

  const qrValue = marshal.instagramHandle
    ? `https://instagram.com/${marshal.instagramHandle}`
    : origin ? `${origin}/marshals` : "";

  const showBio =
    marshal.bio && (s.alwaysShowBio || specialties.length === 0);

  return (
    <div className={cn(
      "relative flex flex-row items-center rounded-xl gradient-card border",
      "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card",
      s.padding, s.gap, s.card,
    )}>
      {/* Top accent line */}
      <div className={cn("absolute top-0 left-3 right-3 h-px", s.line)} />

      {/* ── Square photo ──
          Wrap in overflow-hidden so rounded-lg clips on iOS Safari.
          On some iOS versions, border-radius on an <img> alone does not
          create a clipping context — the parent wrapper must own it. */}
      <div className="shrink-0">
        {marshal.avatarUrl ? (
          <div className={cn(
            s.photoSize,
            "overflow-hidden rounded-lg border border-tvs-charcoal-700 shrink-0"
          )}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={marshal.avatarUrl}
              alt={marshal.name}
              className="w-full h-full object-cover object-top"
            />
          </div>
        ) : (
          <div className={cn(
            s.photoSize,
            "overflow-hidden rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 flex items-center justify-center"
          )}>
            <AvatarPlaceholder
              name={marshal.name}
              className={cn(s.avatarText)}
            />
          </div>
        )}
      </div>

      {/* ── Details ── */}
      {/* Flex truncation chain on iOS Safari requires min-w-0 at EVERY
          flex level:  card(flex-row) → details(flex-1 min-w-0) →
          name-row(flex min-w-0) → h3(min-w-0 truncate).
          Without min-w-0 on the name-row div, iOS ignores the truncate
          and the text overflows onto the QR panel. */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* Name + role badge */}
        <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
          <h3 className="font-bold text-tvs-charcoal-50 text-xs sm:text-sm leading-tight truncate min-w-0">
            {marshal.name}
          </h3>
          <RoleBadge role={marshal.role} />
        </div>

        {/* Specialty chips */}
        {specialties.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-1.5">
            {specialties.slice(0, 2).map((spec) => (
              <span
                key={spec}
                className={cn(
                  "text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-medium border whitespace-nowrap",
                  s.chip,
                )}
              >
                {spec}
              </span>
            ))}
            {specialties.length > 2 && (
              <span className="text-[8px] sm:text-[9px] text-tvs-charcoal-600">
                +{specialties.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Bio */}
        {showBio && (
          <p className="text-[9px] sm:text-[10px] text-tvs-charcoal-400 leading-relaxed line-clamp-2 mb-1.5">
            {marshal.bio}
          </p>
        )}

        {/* Rides led */}
        {marshal.totalRidesLed > 0 && (
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-tvs-charcoal-500">
            <Bike className="size-2.5 sm:size-3 shrink-0" />
            <strong className="text-tvs-charcoal-300">{marshal.totalRidesLed}</strong>
            <span>rides led</span>
          </div>
        )}
      </div>

      {/* ── QR panel — fixed width per variant, immune to text overflow ──
          self-center removed: parent card already uses items-center so this
          is redundant. On iOS Safari, duplicate centering instructions on a
          flex child can cause incorrect height calculation. */}
      {qrValue && (
        <div className={cn(
          "shrink-0 flex flex-col items-center gap-1",
          s.qrContainerW,
        )}>
          <div className={cn("bg-white rounded-md shadow-sm", s.qrPadding)}>
            <QRCodeCanvas
              value={qrValue}
              size={s.qrSize}
              bgColor="#ffffff"
              fgColor="#111827"
              level="M"
            />
          </div>
          <p className={cn(
            "text-[7px] sm:text-[8px] text-tvs-charcoal-500 leading-none text-center w-full truncate",
            s.qrLabelMaxW,
          )}>
            {marshal.instagramHandle ? `@${marshal.instagramHandle}` : "marshals"}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component - filter + tiered layout
// ---------------------------------------------------------------------------

interface MarshalPageClientProps {
  marshals:    Marshal[];
  /** Distinct roles actually in use - roles are free text, not a fixed list. */
  activeRoles: string[];
}

export function MarshalPageClient({ marshals, activeRoles }: MarshalPageClientProps) {
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // Resolve window.location.origin once on mount (avoids SSR mismatch)
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const filtered =
    selectedRole === "all"
      ? marshals
      : marshals.filter((m) => m.role === selectedRole);

  const sorted = [...filtered].sort((a, b) => {
    const diff = getRoleTier(a.role) - getRoleTier(b.role);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  const headMarshal    = sorted.find((m) => m.role === "Head Marshal") ?? null;
  const seniorMarshals = sorted.filter((m) => m.role === "Senior Marshal");
  const others         = sorted.filter(
    (m) => m.role !== "Head Marshal" && m.role !== "Senior Marshal"
  );

  return (
    <div className="space-y-10">

      {/* ── Role filter chips ── */}
      {activeRoles.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...activeRoles].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-150",
                selectedRole === role
                  ? "bg-tvs-red-600 text-white shadow-glow-red"
                  : "bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-tvs-charcoal-400 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-700"
              )}
            >
              {role === "all" ? `All (${marshals.length})` : role}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {sorted.length === 0 && (
        <div className="py-20 text-center">
          <Shield className="size-12 mx-auto mb-4 text-tvs-charcoal-700" />
          <p className="text-sm text-tvs-charcoal-500">
            {selectedRole === "all"
              ? "No active marshals yet."
              : `No active ${selectedRole}s yet.`}
          </p>
        </div>
      )}

      {/* ── Head Marshal ── */}
      {headMarshal && (
        <AnimateIn>
          <div className="flex items-center gap-2 mb-4">
            <span className="block w-3 h-px bg-tvs-red-600 rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-widest text-tvs-red-400">
              Head Marshal
            </span>
          </div>
          <HeadMarshalCard marshal={headMarshal} origin={origin} />
        </AnimateIn>
      )}

      {/* ── Senior Marshals ── */}
      {seniorMarshals.length > 0 && (
        <AnimateIn>
          <div className="flex items-center gap-2 mb-4">
            <span className="block w-3 h-px bg-amber-600 rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
              Senior Marshals
            </span>
          </div>
          <StaggerContainer className="grid sm:grid-cols-2 gap-4">
            {seniorMarshals.map((m) => (
              <StaggerItem key={m.id}>
                <MarshalCard marshal={m} origin={origin} variant="senior" />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </AnimateIn>
      )}

      {/* ── Regional / Other Marshals ── */}
      {others.length > 0 && (
        <AnimateIn>
          <div className="flex items-center gap-2 mb-4">
            <span className="block w-3 h-px bg-blue-600 rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              {others.every((m) => m.role === "Regional Marshal")
                ? "Regional Marshals"
                : "Marshals"}
            </span>
          </div>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {others.map((m) => (
              <StaggerItem key={m.id}>
                <MarshalCard
                  marshal={m}
                  origin={origin}
                  variant={getRoleTier(m.role) === 2 ? "regional" : "other"}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </AnimateIn>
      )}
    </div>
  );
}
