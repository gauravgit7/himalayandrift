// =============================================================================
// TVS Nepal - Database Seed Script
// Populates Supabase with all 2026 mock data (marshals, sponsors, chapters,
// rides, ride-sponsor links, homepage content).
//
// Run:   npm run seed
//   or   npx tsx scripts/seed.ts
//
// Requires: SUPABASE_SERVICE_ROLE_KEY set in .env.local
//           The service-role key bypasses RLS for server-side seeding.
//           NEVER expose this key to the browser.
// =============================================================================

import { readFileSync }   from "fs";
import { join }           from "path";
import { createClient }   from "@supabase/supabase-js";
import {
  MOCK_MARSHALS,
  MOCK_SPONSORS,
  MOCK_CHAPTERS,
  MOCK_RIDES,
  MOCK_HOMEPAGE,
} from "@/lib/data/mock";

// ---------------------------------------------------------------------------
// Load .env.local (no dotenv dependency required)
// ---------------------------------------------------------------------------

function loadEnvLocal() {
  try {
    const content = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {
    // .env.local not found - relying on pre-set environment variables
  }
}

loadEnvLocal();

// ---------------------------------------------------------------------------
// Initialise Supabase admin client (service role - bypasses RLS)
// ---------------------------------------------------------------------------

const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "\n❌  Missing environment variables.\n" +
    "    Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local\n"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function must<T>(
  label: string,
  result: { data: T | null; error: { message: string } | null },
): Promise<T> {
  if (result.error) throw new Error(`[${label}] ${result.error.message}`);
  if (result.data === null) throw new Error(`[${label}] no data returned`);
  return result.data;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  console.log("\n🌱  Seeding TVS Nepal database…\n");

  // ── 0. Clear existing data (reverse dependency order) ──────────────────────
  console.log("   Clearing existing data…");
  // ride_sponsors cascades from rides; delete rides first
  for (const [table] of [
    ["rides"],
    ["chapters"],
    ["sponsors"],
    ["marshals"],
  ] as const) {
    const { error } = await supabase
      .from(table)
      .delete()
      .not("id", "is", null);
    if (error) console.warn(`   ⚠  Clear ${table}: ${error.message}`);
  }

  // ── 1. Marshals ─────────────────────────────────────────────────────────────
  process.stdout.write("→  Marshals   ");
  const marshalRows = await must(
    "marshals",
    await supabase
      .from("marshals")
      .insert(
        MOCK_MARSHALS.map((m) => ({
          name:       m.name,
          phone:      m.phone,
          avatar_url: m.avatarUrl,
          chapter:    m.chapter,
          is_active:  true,
        }))
      )
      .select("id, name")
  );
  // Map mock name → real UUID
  const marshalByName = new Map(marshalRows.map((r) => [r.name, r.id as string]));
  console.log(`✓  (${marshalRows.length})`);

  // ── 2. Sponsors ─────────────────────────────────────────────────────────────
  process.stdout.write("→  Sponsors   ");
  const sponsorRows = await must(
    "sponsors",
    await supabase
      .from("sponsors")
      .insert(
        MOCK_SPONSORS.map((s) => ({
          name:        s.name,
          logo_url:    s.logoUrl,
          description: s.description,
          website_url: s.websiteUrl,
          tier:        s.tier,
          is_active:   true,
        }))
      )
      .select("id, name")
  );
  const sponsorByName = new Map(sponsorRows.map((r) => [r.name, r.id as string]));
  console.log(`✓  (${sponsorRows.length})`);

  // ── 3. Chapters ──────────────────────────────────────────────────────────────
  process.stdout.write("→  Chapters   ");
  await must(
    "chapters",
    await supabase
      .from("chapters")
      .insert(
        MOCK_CHAPTERS.map((c) => ({
          name:            c.name,
          region:          c.region,
          description:     c.description,
          cover_image_url: c.coverImageUrl,
          member_count:    c.memberCount,
          marshal_id:      c.marshal ? (marshalByName.get(c.marshal.name) ?? null) : null,
          is_active:       c.isActive,
          is_priority:     c.isPriority,
          coordinates:     c.coordinates
            ? { lng: c.coordinates[0], lat: c.coordinates[1] }
            : null,
        }))
      )
      .select("id")
  );
  console.log(`✓  (${MOCK_CHAPTERS.length})`);

  // ── 4. Rides ─────────────────────────────────────────────────────────────────
  process.stdout.write("→  Rides      ");
  const rideRows = await must(
    "rides",
    await supabase
      .from("rides")
      .insert(
        MOCK_RIDES.map((r) => ({
          title:              r.title,
          slug:               r.slug,
          community:          r.community,
          ride_type:          r.rideType,
          chapter:            r.chapter,
          start_date:         r.startDate,
          end_date:           r.endDate,
          status:             r.status,
          priority:           r.priority,
          description:        r.description,
          short_description:  r.shortDescription,
          banner_image_url:   r.bannerImageUrl,
          expected_riders:    r.expectedRiders,
          registration_link:  r.registrationLink,
          route_data:         r.routeData,
          itinerary:          r.itinerary,
          marshal_id:         r.marshal ? (marshalByName.get(r.marshal.name) ?? null) : null,
          tags:               r.tags,
          is_featured:        r.isFeatured,
          is_recurring:       r.isRecurring,
          recurring_pattern:  r.recurringPattern,
        }))
      )
      .select("id, slug")
  );
  const rideBySlug = new Map(rideRows.map((r) => [r.slug as string, r.id as string]));
  console.log(`✓  (${rideRows.length})`);

  // ── 5. Ride–Sponsor links ────────────────────────────────────────────────────
  process.stdout.write("→  Ride links ");
  const rideSponsorLinks = MOCK_RIDES.flatMap((r) =>
    r.sponsors
      .map((s) => ({
        ride_id:    rideBySlug.get(r.slug),
        sponsor_id: sponsorByName.get(s.name),
      }))
      .filter(
        (link): link is { ride_id: string; sponsor_id: string } =>
          !!link.ride_id && !!link.sponsor_id
      )
  );

  if (rideSponsorLinks.length > 0) {
    const { error } = await supabase
      .from("ride_sponsors")
      .insert(rideSponsorLinks);
    if (error) throw new Error(`[ride_sponsors] ${error.message}`);
  }
  console.log(`✓  (${rideSponsorLinks.length})`);

  // ── 6. Homepage content (singleton upsert) ───────────────────────────────────
  process.stdout.write("→  Homepage   ");

  // Resolve mock IDs → real UUIDs via slug lookup
  const resolveId = (mockId: string): string | null => {
    const ride = MOCK_RIDES.find((r) => r.id === mockId);
    return ride ? (rideBySlug.get(ride.slug) ?? null) : null;
  };

  const { error: hpErr } = await supabase.from("homepage_content").upsert({
    id:                          1,
    hero_title:                  MOCK_HOMEPAGE.heroBanner.title,
    hero_subtitle:               MOCK_HOMEPAGE.heroBanner.subtitle,
    hero_background_image_url:   MOCK_HOMEPAGE.heroBanner.backgroundImageUrl,
    hero_overlay_opacity:        MOCK_HOMEPAGE.heroBanner.overlayOpacity,
    hero_primary_cta_label:      MOCK_HOMEPAGE.heroBanner.primaryCTALabel,
    hero_primary_cta_link:       MOCK_HOMEPAGE.heroBanner.primaryCTALink,
    hero_secondary_cta_label:    MOCK_HOMEPAGE.heroBanner.secondaryCTALabel,
    hero_secondary_cta_link:     MOCK_HOMEPAGE.heroBanner.secondaryCTALink,
    hero_featured_ride_id:
      MOCK_HOMEPAGE.heroBanner.featuredRideId
        ? resolveId(MOCK_HOMEPAGE.heroBanner.featuredRideId)
        : null,
    marquee_ride_ids:
      MOCK_HOMEPAGE.marqueeRideIds.map(resolveId).filter(Boolean),
    featured_upcoming_ride_ids:
      MOCK_HOMEPAGE.featuredUpcomingRideIds.map(resolveId).filter(Boolean),
    show_weather_widget:         MOCK_HOMEPAGE.showWeatherWidget,
    show_sponsor_showcase:       MOCK_HOMEPAGE.showSponsorShowcase,
  });

  if (hpErr) throw new Error(`[homepage_content] ${hpErr.message}`);
  console.log("✓");

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log(
    "\n✅  Database seeded successfully!\n" +
    `   • ${marshalRows.length} marshals\n` +
    `   • ${sponsorRows.length} sponsors\n` +
    `   • ${MOCK_CHAPTERS.length} chapters\n` +
    `   • ${rideRows.length} rides\n` +
    `   • ${rideSponsorLinks.length} ride-sponsor links\n` +
    "   • Homepage content\n"
  );
}

seed().catch((err: Error) => {
  console.error("\n❌  Seed failed:", err.message);
  process.exit(1);
});
