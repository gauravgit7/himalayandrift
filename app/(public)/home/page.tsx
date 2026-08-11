// =============================================================================
// Homepage - Phase 6 · Supabase data
// Phase 10 · ISR: regenerate every 30 min; server actions call revalidatePath("/")
//            to flush the cache immediately on admin mutations.
// =============================================================================

export const revalidate = 1800; // 30 minutes

import type { Metadata }        from "next";
import { APP_META, DEFAULT_CALENDAR_YEAR } from "@/lib/constants";
import { computeRideStats, sortRidesByDate } from "@/utils/ride";
import { rideIsUpcoming }       from "@/utils/date";

// Supabase query functions
import {
  getHomepageContent,
  getRides,
  getSponsors,
} from "@/lib/supabase/queries";

// Weather
import { fetchWeatherForRides } from "@/lib/weather/openweather";
import type { WeatherItem }     from "@/features/homepage/WeatherWidget";

// Feature components
import { HeroBanner }           from "@/features/homepage/HeroBanner";
import { YearStats }            from "@/features/homepage/YearStats";
import { MarqueeHighlight }     from "@/features/homepage/MarqueeHighlight";
import { UpcomingRidesSection } from "@/features/homepage/UpcomingRidesSection";
import { WeatherWidget }        from "@/features/homepage/WeatherWidget";
import { SponsorShowcase }      from "@/features/homepage/SponsorShowcase";
import { InstallPrompt }        from "@/components/shared/InstallPrompt";

export const metadata: Metadata = {
  title:       APP_META.name,
  description: APP_META.description,
};

export default async function HomePage() {
  // Parallel data fetching
  const [homepage, allRides, sponsors] = await Promise.all([
    getHomepageContent(),
    getRides(),
    getSponsors(),
  ]);

  const heroContent  = homepage.heroBanner;
  const featuredRide = heroContent.featuredRideId
    ? allRides.find((r) => r.id === heroContent.featuredRideId) ?? null
    : null;

  const stats = computeRideStats(allRides);

  const marqueeRides = allRides.filter((r) => r.rideType === "marquee");

  // First upcoming non-cancelled ride for the countdown pill
  const nextRide = sortRidesByDate(
    allRides.filter(
      (r) => rideIsUpcoming(r.startDate) &&
             r.status !== "cancelled" &&
             r.status !== "postponed"
    )
  )[0] ?? null;

  const upcoming = sortRidesByDate(
    allRides.filter(
      (r) => rideIsUpcoming(r.startDate) && r.rideType !== "marquee"
    )
  ).slice(0, 6);

  const weatherRides = sortRidesByDate(
    allRides.filter((r) => rideIsUpcoming(r.startDate))
  ).slice(0, 3);

  // Fetch live weather for the 3 upcoming ride destinations (server-side, cached 30 min)
  const weatherResults = await fetchWeatherForRides(weatherRides);
  const weatherItems: WeatherItem[] = weatherRides.map((ride, i) => ({
    ride,
    weather: weatherResults[i] ?? null,
  }));

  return (
    <>
      <HeroBanner
        heroContent={heroContent}
        featuredRide={featuredRide}
        brandLogos={homepage.brandLogos}
        nextRide={nextRide}
        stats={{
          totalRides:    stats.total,
          upcomingRides: stats.upcoming,
          marqueeCount:  stats.marqueeCount,
          year:          DEFAULT_CALENDAR_YEAR,
        }}
      />

      <InstallPrompt />

      <YearStats
        totalRides={stats.total}
        completedRides={stats.completed}
        upcomingRides={stats.upcoming}
        marqueeCount={stats.marqueeCount}
      />

      <MarqueeHighlight rides={marqueeRides} brandLogos={homepage.brandLogos} />

      <UpcomingRidesSection rides={upcoming} brandLogos={homepage.brandLogos} />

      <WeatherWidget items={weatherItems} />

      <SponsorShowcase sponsors={sponsors} />
    </>
  );
}
