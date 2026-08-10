// =============================================================================
// TVS Nepal - Mock Data for Development
// Represents a realistic 2026 annual ride schedule
// Replace with Supabase queries once Phase 6 (Supabase integration) is done
// =============================================================================

import type { Ride, Chapter, Sponsor, Marshal, HomepageContent } from "@/types";

// ---------------------------------------------------------------------------
// Marshals
// ---------------------------------------------------------------------------

export const MOCK_MARSHALS: Marshal[] = [
  { id: "m1", name: "Arjun Shrestha",   phone: "+977-98411-00001", avatarUrl: null, chapter: null,       role: "Head Marshal",     specialty: "Route Planning, High Altitude", bio: "Lead of all TVS Nepal rides since 2019. Himalayan veteran.", totalRidesLed: 12, isActive: true, instagramHandle: null },
  { id: "m2", name: "Bikram Tamang",    phone: "+977-98411-00002", avatarUrl: null, chapter: "Gandaki",  role: "Senior Marshal",   specialty: "Navigation",                   bio: null, totalRidesLed: 9,  isActive: true, instagramHandle: null },
  { id: "m3", name: "Chandra Rai",      phone: "+977-98411-00003", avatarUrl: null, chapter: "Narayani", role: "Senior Marshal",   specialty: "Technical Support",            bio: null, totalRidesLed: 8,  isActive: true, instagramHandle: null },
  { id: "m4", name: "Dipesh Karki",     phone: "+977-98411-00004", avatarUrl: null, chapter: "Lumbini",  role: "Senior Marshal",   specialty: "Creative, Media",              bio: null, totalRidesLed: 7,  isActive: true, instagramHandle: null },
  { id: "m5", name: "Eshwar Gurung",    phone: "+977-98411-00005", avatarUrl: null, chapter: "Rapti",    role: "Regional Marshal", specialty: null,                           bio: null, totalRidesLed: 5,  isActive: true, instagramHandle: null },
  { id: "m6", name: "Furkhan Malla",    phone: "+977-98411-00006", avatarUrl: null, chapter: "Bheri",    role: "Regional Marshal", specialty: null,                           bio: null, totalRidesLed: 4,  isActive: true, instagramHandle: null },
  { id: "m7", name: "Govind Paudel",    phone: "+977-98411-00007", avatarUrl: null, chapter: "Mahakali", role: "Regional Marshal", specialty: null,                           bio: null, totalRidesLed: 3,  isActive: true, instagramHandle: null },
  { id: "m8", name: "Hari Subedi",      phone: "+977-98411-00008", avatarUrl: null, chapter: "Koshi",    role: "Regional Marshal", specialty: null,                           bio: null, totalRidesLed: 6,  isActive: true, instagramHandle: null },
  { id: "m9", name: "Indra Limbu",      phone: "+977-98411-00009", avatarUrl: null, chapter: "Mechi",    role: "Regional Marshal", specialty: null,                           bio: null, totalRidesLed: 4,  isActive: true, instagramHandle: null },
];

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------

export const MOCK_SPONSORS: Sponsor[] = [
  { id: "s1", name: "TVS Motor Nepal",        logoUrl: null, description: "Official title sponsor - powering every ride.",    websiteUrl: "https://tvs.com.np",    tier: "title"     },
  { id: "s2", name: "Hulas Motors",           logoUrl: null, description: "Authorized TVS dealer & service partner.",         websiteUrl: null,                    tier: "co"        },
  { id: "s3", name: "Himalayan Trails",       logoUrl: null, description: "Nepal's premier adventure travel company.",        websiteUrl: null,                    tier: "associate" },
  { id: "s4", name: "Gear Up Nepal",          logoUrl: null, description: "Premium riding gear & accessories.",               websiteUrl: null,                    tier: "associate" },
  { id: "s5", name: "Rider's Republic Media", logoUrl: null, description: "Official media partner - capturing every moment.", websiteUrl: null,                    tier: "media"     },
];

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

export const MOCK_CHAPTERS: Chapter[] = [
  {
    id: "c1", name: "Bagmati",   region: "Bagmati Province",       isPriority: true,
    description: "The heart of TVS Nepal riding culture - based in Kathmandu Valley.",
    coverImageUrl: null, memberCount: 142, marshal: MOCK_MARSHALS[0], marshals: [MOCK_MARSHALS[0]],
    isActive: true, totalRidesThisYear: 14, coordinates: [85.3240, 27.7172],
  },
  {
    id: "c2", name: "Gandaki",   region: "Gandaki Province",       isPriority: true,
    description: "Pokhara-based chapter - gateway to the Annapurna circuit.",
    coverImageUrl: null, memberCount: 87, marshal: MOCK_MARSHALS[1], marshals: [MOCK_MARSHALS[1]],
    isActive: true, totalRidesThisYear: 9, coordinates: [84.0148, 28.2096],
  },
  {
    id: "c3", name: "Narayani",  region: "Bagmati Province",       isPriority: true,
    description: "Bharatpur chapter - commanding the Terai-hill crossroads.",
    coverImageUrl: null, memberCount: 73, marshal: MOCK_MARSHALS[2], marshals: [MOCK_MARSHALS[2]],
    isActive: true, totalRidesThisYear: 8, coordinates: [85.1200, 27.6783],
  },
  {
    id: "c4", name: "Lumbini",   region: "Lumbini Province",       isPriority: true,
    description: "Butwal-based chapter - riding through the birthplace of the Buddha.",
    coverImageUrl: null, memberCount: 65, marshal: MOCK_MARSHALS[3], marshals: [MOCK_MARSHALS[3]],
    isActive: true, totalRidesThisYear: 7, coordinates: [83.2762, 27.4833],
  },
  {
    id: "c5", name: "Rapti",     region: "Lumbini Province",       isPriority: false,
    description: "Dang valley chapter - wild western plains riding.",
    coverImageUrl: null, memberCount: 44, marshal: MOCK_MARSHALS[4], marshals: [MOCK_MARSHALS[4]],
    isActive: true, totalRidesThisYear: 5, coordinates: [82.1980, 28.0900],
  },
  {
    id: "c6", name: "Bheri",     region: "Karnali Province",       isPriority: false,
    description: "Surkhet chapter - exploring Karnali's rugged terrain.",
    coverImageUrl: null, memberCount: 31, marshal: MOCK_MARSHALS[5], marshals: [MOCK_MARSHALS[5]],
    isActive: true, totalRidesThisYear: 4, coordinates: [81.6100, 28.2600],
  },
  {
    id: "c7", name: "Mahakali",  region: "Sudurpashchim Province", isPriority: false,
    description: "Far-western chapter - riding the edge of Nepal.",
    coverImageUrl: null, memberCount: 28, marshal: MOCK_MARSHALS[6], marshals: [MOCK_MARSHALS[6]],
    isActive: true, totalRidesThisYear: 3, coordinates: [80.1780, 29.5900],
  },
  {
    id: "c8", name: "Koshi",     region: "Koshi Province",         isPriority: false,
    description: "Biratnagar chapter - eastern gateway rides.",
    coverImageUrl: null, memberCount: 58, marshal: MOCK_MARSHALS[7], marshals: [MOCK_MARSHALS[7]],
    isActive: true, totalRidesThisYear: 6, coordinates: [87.2700, 26.8065],
  },
  {
    id: "c9", name: "Mechi",     region: "Koshi Province",         isPriority: false,
    description: "Birtamod chapter - rides along the eastern frontier.",
    coverImageUrl: null, memberCount: 39, marshal: MOCK_MARSHALS[8], marshals: [MOCK_MARSHALS[8]],
    isActive: true, totalRidesThisYear: 4, coordinates: [88.0900, 26.6400],
  },
];

// ---------------------------------------------------------------------------
// Rides - 2026 annual schedule
// Current date: 2026-05-28
// ---------------------------------------------------------------------------

export const MOCK_RIDES: Ride[] = [
  // ── JANUARY ──────────────────────────────────────────────────────────────
  {
    id: "r001", title: "Nagarkot Winter Sunrise Ride", slug: "nagarkot-winter-sunrise-jan",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-01-04", endDate: "2026-01-04",
    status: "completed", priority: "chapter",
    description: "Classic sunrise run to Nagarkot - crisp winter air, golden Himalayan panoramas.",
    shortDescription: "Winter sunrise run to Nagarkot.",
    bannerImageUrl: null, expectedRiders: 28,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0]],
    tags: ["sunrise", "winter", "nagarkot"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2025-11-01T00:00:00Z", updatedAt: "2026-01-05T00:00:00Z",
  },
  {
    id: "r002", title: "Chandragiri Hills Breakfast Ride", slug: "chandragiri-breakfast-jan",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-01-11", endDate: "2026-01-11",
    status: "completed", priority: "local",
    description: "Morning run up to Chandragiri - dal bhat at the summit.",
    shortDescription: "Chandragiri breakfast run.",
    bannerImageUrl: null, expectedRiders: 22,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0]],
    tags: ["breakfast", "chandragiri"], isFeatured: false,
    isRecurring: true, recurringPattern: { frequency: "monthly", dayOfWeek: 0, weekOfMonth: 2, endDate: "2026-12-31" }, interestCount: 0,
    createdAt: "2025-11-01T00:00:00Z", updatedAt: "2026-01-12T00:00:00Z",
  },
  {
    id: "r003", title: "Pokhara Valley CULT Ride", slug: "pokhara-valley-cult-jan",
    community: "CULT", rideType: "cult", chapter: "Gandaki",
    startDate: "2026-01-17", endDate: "2026-01-17",
    status: "completed", priority: "chapter",
    description: "CULT lifestyle ride through the Pokhara valley - lakeside lunch, Phewa reflections.",
    shortDescription: "Pokhara valley lifestyle & culture ride.",
    bannerImageUrl: null, expectedRiders: 18,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[1], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[4]],
    tags: ["cult", "pokhara", "lakeside"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2025-11-15T00:00:00Z", updatedAt: "2026-01-18T00:00:00Z",
  },
  {
    id: "r004", title: "Daman Viewpoint Ride", slug: "daman-viewpoint-jan",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-01-25", endDate: "2026-01-25",
    status: "completed", priority: "chapter",
    description: "Daman - the best Himalayan panorama in Nepal. A crisp January classic.",
    shortDescription: "Daman - best mountain panorama.",
    bannerImageUrl: null, expectedRiders: 31,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0]],
    tags: ["daman", "mountains"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2025-11-15T00:00:00Z", updatedAt: "2026-01-26T00:00:00Z",
  },

  // ── FEBRUARY ─────────────────────────────────────────────────────────────
  {
    id: "r005", title: "Chitwan National Park Overnight", slug: "chitwan-overnight-feb",
    community: "AOG", rideType: "overnight", chapter: "Narayani",
    startDate: "2026-02-07", endDate: "2026-02-08",
    status: "completed", priority: "national",
    description: "2D1N overnight to Chitwan - jungle resort stay, elephant safari at dawn.",
    shortDescription: "2D1N jungle overnight - Chitwan.",
    bannerImageUrl: null, expectedRiders: 35,
    registrationLink: null, routeData: null,
    itinerary: [
      { day: 1, title: "Ride to Chitwan", description: "Morning departure, afternoon jungle walk.", startLocation: "Bharatpur", endLocation: "Chitwan NP", estimatedKm: 40 },
      { day: 2, title: "Safari & Return", description: "Dawn elephant safari, ride home by noon.", startLocation: "Chitwan NP", endLocation: "Bharatpur", estimatedKm: 40 },
    ],
    marshal: MOCK_MARSHALS[2], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[2]],
    tags: ["overnight", "chitwan", "jungle"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2025-12-01T00:00:00Z", updatedAt: "2026-02-09T00:00:00Z",
  },
  {
    id: "r006", title: "Mustang Highway Preview - CULT", slug: "mustang-highway-cult-feb",
    community: "CULT", rideType: "cult", chapter: "Gandaki",
    startDate: "2026-02-15", endDate: "2026-02-15",
    status: "completed", priority: "chapter",
    description: "CULT recon ride along the new Mustang highway - scouting routes for the marquee.",
    shortDescription: "Mustang highway recon - CULT.",
    bannerImageUrl: null, expectedRiders: 14,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[1], sponsors: [MOCK_SPONSORS[0]],
    tags: ["mustang", "recon", "cult"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2025-12-15T00:00:00Z", updatedAt: "2026-02-16T00:00:00Z",
  },
  {
    id: "r007", title: "Bhaktapur Heritage Breakfast Ride", slug: "bhaktapur-heritage-feb",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-02-22", endDate: "2026-02-22",
    status: "completed", priority: "local",
    description: "Through the ancient streets of Bhaktapur - juju dhau breakfast at Nyatapola square.",
    shortDescription: "Heritage breakfast ride - Bhaktapur.",
    bannerImageUrl: null, expectedRiders: 26,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0]],
    tags: ["bhaktapur", "heritage", "breakfast"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2025-12-15T00:00:00Z", updatedAt: "2026-02-23T00:00:00Z",
  },

  // ── MARCH ────────────────────────────────────────────────────────────────
  {
    id: "r008", title: "Tansen Hill Town Ride", slug: "tansen-lumbini-march",
    community: "AOG", rideType: "chapter", chapter: "Lumbini",
    startDate: "2026-03-08", endDate: "2026-03-08",
    status: "completed", priority: "chapter",
    description: "Switchbacks up to Tansen - Newari architecture, Palpa palace, Srinagar viewpoint.",
    shortDescription: "Tansen hill town run - Lumbini chapter.",
    bannerImageUrl: null, expectedRiders: 21,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[3], sponsors: [MOCK_SPONSORS[0]],
    tags: ["tansen", "palpa", "hills"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-01-15T00:00:00Z", updatedAt: "2026-03-09T00:00:00Z",
  },
  {
    id: "r009", title: "Holi Colour Ride - Kathmandu", slug: "holi-colour-ride-march",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-03-14", endDate: "2026-03-14",
    status: "completed", priority: "national",
    description: "Annual Holi celebration ride - paint-splattered Apaches through the valley.",
    shortDescription: "Holi celebration ride - Kathmandu.",
    bannerImageUrl: null, expectedRiders: 45,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[1]],
    tags: ["holi", "festival", "celebration"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-01-20T00:00:00Z", updatedAt: "2026-03-15T00:00:00Z",
  },
  {
    id: "r010", title: "Koshi Barrage & Inaruwa CULT Ride", slug: "koshi-barrage-cult-march",
    community: "CULT", rideType: "cult", chapter: "Koshi",
    startDate: "2026-03-22", endDate: "2026-03-22",
    status: "completed", priority: "chapter",
    description: "Eastern Terai exploration - Koshi barrage bird sanctuary, riverside culture trail.",
    shortDescription: "Koshi barrage bird sanctuary ride.",
    bannerImageUrl: null, expectedRiders: 16,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[7], sponsors: [MOCK_SPONSORS[0]],
    tags: ["koshi", "barrage", "wildlife", "cult"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-01-20T00:00:00Z", updatedAt: "2026-03-23T00:00:00Z",
  },
  {
    id: "r011", title: "Kalinchok Snowline Ride", slug: "kalinchok-snowline-march",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-03-28", endDate: "2026-03-28",
    status: "completed", priority: "chapter",
    description: "Late-season snow push to Kalinchok - high altitude cold, stunning Langtang views.",
    shortDescription: "Kalinchok snowline - Bagmati chapter.",
    bannerImageUrl: null, expectedRiders: 24,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[3]],
    tags: ["kalinchok", "snow", "altitude"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-02-01T00:00:00Z", updatedAt: "2026-03-29T00:00:00Z",
  },

  // ── APRIL ────────────────────────────────────────────────────────────────
  {
    id: "r012", title: "New Year Ride - Bisket Jatra", slug: "bisket-jatra-new-year-april",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-04-14", endDate: "2026-04-14",
    status: "completed", priority: "national",
    description: "Nepali New Year 2083 - riding through Bhaktapur's Bisket Jatra festival.",
    shortDescription: "Nepali New Year 2083 - Bisket Jatra ride.",
    bannerImageUrl: null, expectedRiders: 52,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[1], MOCK_SPONSORS[4]],
    tags: ["new-year", "bisket", "festival"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-02-15T00:00:00Z", updatedAt: "2026-04-15T00:00:00Z",
  },
  {
    id: "r013", title: "Ilam Tea Garden CULT Overnight", slug: "ilam-tea-cult-overnight-april",
    community: "CULT", rideType: "overnight", chapter: "Mechi",
    startDate: "2026-04-18", endDate: "2026-04-19",
    status: "completed", priority: "national",
    description: "2D1N through Ilam's rolling tea gardens - homestay, tea tasting, Kanyam sunrise.",
    shortDescription: "2D1N Ilam tea garden overnight - CULT.",
    bannerImageUrl: null, expectedRiders: 20,
    registrationLink: null, routeData: null,
    itinerary: [
      { day: 1, title: "Ride to Ilam", description: "Eastern hills ascent, tea garden arrival, homestay dinner.", startLocation: "Birtamod", endLocation: "Ilam", estimatedKm: 62 },
      { day: 2, title: "Tea Trail & Return", description: "Dawn walk through tea rows, Kanyam viewpoint, ride back.", startLocation: "Ilam", endLocation: "Birtamod", estimatedKm: 62 },
    ],
    marshal: MOCK_MARSHALS[8], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[2]],
    tags: ["ilam", "tea", "overnight", "cult"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-02-20T00:00:00Z", updatedAt: "2026-04-20T00:00:00Z",
  },
  {
    id: "r014", title: "Gandaki Classic - Pokhara to Naudanda", slug: "gandaki-classic-april",
    community: "AOG", rideType: "chapter", chapter: "Gandaki",
    startDate: "2026-04-25", endDate: "2026-04-25",
    status: "completed", priority: "chapter",
    description: "The Gandaki spring classic - ridge road to Naudanda, Annapurna in full view.",
    shortDescription: "Pokhara ridge run - Annapurna views.",
    bannerImageUrl: null, expectedRiders: 29,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[1], sponsors: [MOCK_SPONSORS[0]],
    tags: ["pokhara", "naudanda", "annapurna"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-03-01T00:00:00Z", updatedAt: "2026-04-26T00:00:00Z",
  },

  // ── MAY (mix of completed & upcoming) ─────────────────────────────────────
  {
    id: "r015", title: "Bandipur Heritage Town Ride", slug: "bandipur-heritage-may",
    community: "AOG", rideType: "chapter", chapter: "Gandaki",
    startDate: "2026-05-03", endDate: "2026-05-03",
    status: "completed", priority: "chapter",
    description: "Car-free Bandipur - the perfectly preserved Newari hill town above the valley.",
    shortDescription: "Bandipur hill town - Gandaki chapter.",
    bannerImageUrl: null, expectedRiders: 27,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[1], sponsors: [MOCK_SPONSORS[0]],
    tags: ["bandipur", "newari", "heritage"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-03-15T00:00:00Z", updatedAt: "2026-05-04T00:00:00Z",
  },
  {
    id: "r016", title: "Rapti Riverbed CULT Ride", slug: "rapti-riverbed-cult-may",
    community: "CULT", rideType: "cult", chapter: "Rapti",
    startDate: "2026-05-10", endDate: "2026-05-10",
    status: "completed", priority: "chapter",
    description: "CULT sunrise ride along the Rapti riverbed - mist, birds, open horizon.",
    shortDescription: "Rapti riverbed sunrise - CULT.",
    bannerImageUrl: null, expectedRiders: 17,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[4], sponsors: [MOCK_SPONSORS[0]],
    tags: ["rapti", "riverbed", "sunrise", "cult"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-03-20T00:00:00Z", updatedAt: "2026-05-11T00:00:00Z",
  },
  {
    id: "r017", title: "Bagmati Chapter Ride - Godavari", slug: "godavari-bagmati-may",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-05-17", endDate: "2026-05-17",
    status: "completed", priority: "local",
    description: "Botanical garden loop - Godavari forest roads in full monsoon-eve green.",
    shortDescription: "Godavari botanical loop ride.",
    bannerImageUrl: null, expectedRiders: 23,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0]],
    tags: ["godavari", "forest", "botanical"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-04-01T00:00:00Z", updatedAt: "2026-05-18T00:00:00Z",
  },
  {
    id: "r018", title: "Lumbini Peace Ride", slug: "lumbini-peace-ride-may",
    community: "AOG", rideType: "chapter", chapter: "Lumbini",
    startDate: "2026-05-24", endDate: "2026-05-24",
    status: "confirmed", priority: "national",
    description: "Annual ride to Lumbini on Buddha Jayanti - motorcycles circle the sacred garden in silence.",
    shortDescription: "Buddha Jayanti - Lumbini peace ride.",
    bannerImageUrl: null, expectedRiders: 48,
    registrationLink: "https://forms.gle/tvs-lumbini-2026",
    routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[3], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[1], MOCK_SPONSORS[4]],
    tags: ["lumbini", "buddha-jayanti", "peace"], isFeatured: true,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-04-01T00:00:00Z", updatedAt: "2026-05-20T00:00:00Z",
  },

  // ── JUNE - MARQUEE #1 ────────────────────────────────────────────────────
  {
    id: "r019", title: "Upper Mustang Grand Expedition", slug: "upper-mustang-marquee-june",
    community: "AOGxCULT", rideType: "marquee", chapter: "Gandaki",
    startDate: "2026-06-13", endDate: "2026-06-18",
    status: "confirmed", priority: "marquee",
    description: "The crown jewel of 2026 - six days through the forbidden kingdom of Mustang. Jomsom, Kagbeni, Chuksang, Lo Manthang. Restricted area permits, Tibetan-influenced culture, high-altitude desert unlike anywhere in Nepal. AOG & CULT riding as one.",
    shortDescription: "6-day Upper Mustang expedition - AOG × CULT flagship ride of 2026.",
    bannerImageUrl: null, expectedRiders: 60,
    registrationLink: "https://forms.gle/tvs-mustang-2026",
    routeData: {
      waypoints: [
        { name: "Pokhara", coordinates: [84.0148, 28.2096], isStop: true },
        { name: "Jomsom", coordinates: [83.7353, 28.7802], isStop: true },
        { name: "Kagbeni", coordinates: [83.7783, 28.8369], isStop: true },
        { name: "Chuksang", coordinates: [83.8033, 28.9233], isStop: true },
        { name: "Lo Manthang", coordinates: [83.9667, 29.1833], isStop: true },
      ],
      totalDistanceKm: 380, estimatedDurationHours: null, mapboxRouteGeoJSON: null,
    },
    itinerary: [
      { day: 1, title: "Pokhara → Jomsom",     description: "Ride through Kali Gandaki gorge. World's deepest valley.", startLocation: "Pokhara", endLocation: "Jomsom", estimatedKm: 150 },
      { day: 2, title: "Jomsom → Kagbeni",     description: "Ancient fortress town - gateway to Upper Mustang.", startLocation: "Jomsom", endLocation: "Kagbeni", estimatedKm: 18 },
      { day: 3, title: "Kagbeni → Chuksang",   description: "Restricted area entry. Desert landscape begins.", startLocation: "Kagbeni", endLocation: "Chuksang", estimatedKm: 32 },
      { day: 4, title: "Chuksang → Lo Manthang", description: "The ancient walled capital. Cultural exploration.", startLocation: "Chuksang", endLocation: "Lo Manthang", estimatedKm: 55 },
      { day: 5, title: "Lo Manthang Explore",  description: "Rest day - monasteries, caves, local culture.", startLocation: "Lo Manthang", endLocation: "Lo Manthang", estimatedKm: 0 },
      { day: 6, title: "Return to Jomsom",     description: "Epic return descent through the gorge.", startLocation: "Lo Manthang", endLocation: "Jomsom", estimatedKm: 125 },
    ],
    marshal: MOCK_MARSHALS[1], sponsors: MOCK_SPONSORS,
    tags: ["mustang", "marquee", "flagship", "expedition", "restricted-area"], isFeatured: true,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z",
  },
  {
    id: "r020", title: "Narayani Summer Chapter Ride", slug: "narayani-summer-june",
    community: "AOG", rideType: "chapter", chapter: "Narayani",
    startDate: "2026-06-28", endDate: "2026-06-28",
    status: "planned", priority: "chapter",
    description: "Post-monsoon early morning ride - Narayani riverbanks and Devghat confluence.",
    shortDescription: "Narayani riverbank summer ride.",
    bannerImageUrl: null, expectedRiders: 22,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[2], sponsors: [MOCK_SPONSORS[0]],
    tags: ["narayani", "river", "summer"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-04-15T00:00:00Z", updatedAt: "2026-04-15T00:00:00Z",
  },

  // ── JULY ─────────────────────────────────────────────────────────────────
  {
    id: "r021", title: "Monsoon Madness Ride - Bheri", slug: "monsoon-bheri-july",
    community: "AOG", rideType: "chapter", chapter: "Bheri",
    startDate: "2026-07-05", endDate: "2026-07-05",
    status: "tentative", priority: "chapter",
    description: "Surkhet valley in full monsoon green - waterfalls, mist, raw Karnali terrain.",
    shortDescription: "Monsoon green ride - Bheri chapter.",
    bannerImageUrl: null, expectedRiders: 18,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[5], sponsors: [MOCK_SPONSORS[0]],
    tags: ["monsoon", "bheri", "surkhet", "waterfall"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z",
  },
  {
    id: "r022", title: "Janai Purnima Brotherhood Ride", slug: "janai-purnima-july",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-07-18", endDate: "2026-07-18",
    status: "planned", priority: "national",
    description: "Janai Purnima brotherhood ride - Pashupatinath to Gosainkunda (by road) with the community.",
    shortDescription: "Janai Purnima brotherhood ride.",
    bannerImageUrl: null, expectedRiders: 38,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[1]],
    tags: ["janai-purnima", "festival", "brotherhood"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z",
  },
  {
    id: "r023", title: "Begnas Lake CULT Ride", slug: "begnas-lake-cult-july",
    community: "CULT", rideType: "cult", chapter: "Gandaki",
    startDate: "2026-07-25", endDate: "2026-07-25",
    status: "planned", priority: "chapter",
    description: "CULT escape to Begnas - less crowded than Phewa, surrounded by rice terraces.",
    shortDescription: "Begnas lake escape - CULT.",
    bannerImageUrl: null, expectedRiders: 15,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[1], sponsors: [MOCK_SPONSORS[0]],
    tags: ["begnas", "lake", "cult", "terraces"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-05-10T00:00:00Z", updatedAt: "2026-05-10T00:00:00Z",
  },

  // ── AUGUST ────────────────────────────────────────────────────────────────
  {
    id: "r024", title: "Rara Lake Overnight Expedition", slug: "rara-lake-overnight-aug",
    community: "AOGxCULT", rideType: "overnight", chapter: "Bheri",
    startDate: "2026-08-08", endDate: "2026-08-09",
    status: "planned", priority: "national",
    description: "2D1N epic - Nepal's largest lake in Mugu district. Remote, stunning, untouched.",
    shortDescription: "2D1N Rara Lake expedition - AOG × CULT.",
    bannerImageUrl: null, expectedRiders: 24,
    registrationLink: "https://forms.gle/tvs-rara-2026",
    routeData: null,
    itinerary: [
      { day: 1, title: "Surkhet → Rara Approach", description: "Long mountain ride, lodge stay near the lake.", startLocation: "Surkhet", endLocation: "Rara Camp", estimatedKm: 180 },
      { day: 2, title: "Rara Lake & Return",       description: "Dawn at the lake, full return to Surkhet.",  startLocation: "Rara Camp", endLocation: "Surkhet", estimatedKm: 180 },
    ],
    marshal: MOCK_MARSHALS[5], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[2], MOCK_SPONSORS[3]],
    tags: ["rara", "overnight", "remote", "lake"], isFeatured: true,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-05-15T00:00:00Z", updatedAt: "2026-05-15T00:00:00Z",
  },
  {
    id: "r025", title: "Koshi Chapter Terai Run", slug: "koshi-terai-aug",
    community: "AOG", rideType: "chapter", chapter: "Koshi",
    startDate: "2026-08-23", endDate: "2026-08-23",
    status: "planned", priority: "chapter",
    description: "Eastern Terai straight-road blast - Sunsari flatlands at full throttle.",
    shortDescription: "Koshi Terai straight-road blast.",
    bannerImageUrl: null, expectedRiders: 25,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[7], sponsors: [MOCK_SPONSORS[0]],
    tags: ["koshi", "terai", "flatlands"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-05-20T00:00:00Z", updatedAt: "2026-05-20T00:00:00Z",
  },

  // ── SEPTEMBER ─────────────────────────────────────────────────────────────
  {
    id: "r026", title: "Mahakali Frontier Ride", slug: "mahakali-frontier-sep",
    community: "AOG", rideType: "chapter", chapter: "Mahakali",
    startDate: "2026-09-06", endDate: "2026-09-06",
    status: "planned", priority: "chapter",
    description: "Far-west frontier ride - Shuklaphanta to Mahakali river. Nepal's edge.",
    shortDescription: "Mahakali frontier - far-west chapter ride.",
    bannerImageUrl: null, expectedRiders: 20,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[6], sponsors: [MOCK_SPONSORS[0]],
    tags: ["mahakali", "frontier", "far-west"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "r027", title: "Dashain Pre-Ride - Bagmati", slug: "dashain-pre-ride-sep",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-09-20", endDate: "2026-09-20",
    status: "planned", priority: "national",
    description: "Pre-Dashain ritual ride - visiting all valley temples, tika collection route.",
    shortDescription: "Pre-Dashain temple circuit ride.",
    bannerImageUrl: null, expectedRiders: 55,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[1]],
    tags: ["dashain", "festival", "temples"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "r028", title: "Autumn CULT - Sankhu Valley", slug: "sankhu-cult-sep",
    community: "CULT", rideType: "cult", chapter: "Bagmati",
    startDate: "2026-09-27", endDate: "2026-09-27",
    status: "planned", priority: "chapter",
    description: "CULT autumn ride through Sankhu - ancient Vajrayogini temple, valley spice trail.",
    shortDescription: "Sankhu valley autumn - CULT.",
    bannerImageUrl: null, expectedRiders: 19,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0]],
    tags: ["sankhu", "cult", "autumn", "temple"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-06-15T00:00:00Z", updatedAt: "2026-06-15T00:00:00Z",
  },

  // ── OCTOBER ───────────────────────────────────────────────────────────────
  {
    id: "r029", title: "Tihar Light Ride", slug: "tihar-light-ride-oct",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-10-18", endDate: "2026-10-18",
    status: "planned", priority: "national",
    description: "Tihar evening ride - Apaches lit up through the festival of lights. Most photogenic ride of the year.",
    shortDescription: "Tihar evening light ride - most photogenic.",
    bannerImageUrl: null, expectedRiders: 68,
    registrationLink: "https://forms.gle/tvs-tihar-2026",
    routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[1], MOCK_SPONSORS[4]],
    tags: ["tihar", "festival", "lights", "evening"], isFeatured: true,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z",
  },
  {
    id: "r030", title: "Pokhara Lakeside CULT Autumn", slug: "pokhara-lakeside-cult-oct",
    community: "CULT", rideType: "cult", chapter: "Gandaki",
    startDate: "2026-10-25", endDate: "2026-10-25",
    status: "planned", priority: "chapter",
    description: "CULT autumn lakeside - Phewa in crystal clarity, Annapurna reflections, long coffee stops.",
    shortDescription: "Pokhara autumn lakeside - CULT.",
    bannerImageUrl: null, expectedRiders: 21,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[1], sponsors: [MOCK_SPONSORS[0]],
    tags: ["pokhara", "lakeside", "cult", "autumn", "annapurna"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-07-15T00:00:00Z", updatedAt: "2026-07-15T00:00:00Z",
  },

  // ── NOVEMBER ──────────────────────────────────────────────────────────────
  {
    id: "r031", title: "Lumbini Winter Overnight", slug: "lumbini-winter-overnight-nov",
    community: "AOG", rideType: "overnight", chapter: "Lumbini",
    startDate: "2026-11-07", endDate: "2026-11-08",
    status: "planned", priority: "national",
    description: "2D1N to Lumbini in crisp winter air - sacred garden at dawn, firepit evening, brotherhood.",
    shortDescription: "2D1N Lumbini winter overnight - AOG.",
    bannerImageUrl: null, expectedRiders: 32,
    registrationLink: "https://forms.gle/tvs-lumbini-overnight-2026",
    routeData: null,
    itinerary: [
      { day: 1, title: "Ride to Lumbini", description: "Western highway run, sacred garden visit, bonfire night.", startLocation: "Butwal", endLocation: "Lumbini", estimatedKm: 22 },
      { day: 2, title: "Dawn & Return",   description: "Sunrise at Maya Devi temple, return ride.", startLocation: "Lumbini", endLocation: "Butwal", estimatedKm: 22 },
    ],
    marshal: MOCK_MARSHALS[3], sponsors: [MOCK_SPONSORS[0], MOCK_SPONSORS[2]],
    tags: ["lumbini", "overnight", "winter", "sacred"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-01T00:00:00Z",
  },
  {
    id: "r032", title: "Autumn Classic - Nagarjun Forest", slug: "nagarjun-forest-nov",
    community: "AOG", rideType: "chapter", chapter: "Bagmati",
    startDate: "2026-11-22", endDate: "2026-11-22",
    status: "planned", priority: "local",
    description: "Nagarjun forest circuit - autumn leaf fall, crystal-clear Himalayan views.",
    shortDescription: "Nagarjun forest autumn circuit.",
    bannerImageUrl: null, expectedRiders: 26,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0]],
    tags: ["nagarjun", "forest", "autumn"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-08-15T00:00:00Z", updatedAt: "2026-08-15T00:00:00Z",
  },

  // ── DECEMBER - MARQUEE #2 ─────────────────────────────────────────────────
  {
    id: "r033", title: "Helambu Circuit - Year-End Marquee", slug: "helambu-marquee-dec",
    community: "AOGxCULT", rideType: "marquee", chapter: "Bagmati",
    startDate: "2026-12-05", endDate: "2026-12-09",
    status: "planned", priority: "marquee",
    description: "The year-end grand finale - 5 days through the Helambu circuit. Melamchi, Talamarang, Sermathang, Tarke Ghyang. Sherpa villages, rhododendron forests, Jugal Himal backdrop. The perfect close to 2026.",
    shortDescription: "5-day Helambu circuit - year-end AOG × CULT marquee ride.",
    bannerImageUrl: null, expectedRiders: 55,
    registrationLink: "https://forms.gle/tvs-helambu-2026",
    routeData: {
      waypoints: [
        { name: "Kathmandu",   coordinates: [85.3240, 27.7172], isStop: true },
        { name: "Melamchi",    coordinates: [85.5714, 27.8365], isStop: true },
        { name: "Talamarang",  coordinates: [85.6200, 27.8800], isStop: true },
        { name: "Sermathang",  coordinates: [85.6500, 27.9300], isStop: true },
        { name: "Tarke Ghyang",coordinates: [85.5800, 28.0100], isStop: true },
      ],
      totalDistanceKm: 280, estimatedDurationHours: null, mapboxRouteGeoJSON: null,
    },
    itinerary: [
      { day: 1, title: "Kathmandu → Melamchi",    description: "Valley exit, river crossing, first Sherpa village.", startLocation: "Kathmandu", endLocation: "Melamchi", estimatedKm: 40 },
      { day: 2, title: "Melamchi → Talamarang",   description: "Forest roads, elevation gain, local homestay.", startLocation: "Melamchi", endLocation: "Talamarang", estimatedKm: 35 },
      { day: 3, title: "Talamarang → Sermathang", description: "High ridge crossing, Jugal Himal views.", startLocation: "Talamarang", endLocation: "Sermathang", estimatedKm: 28 },
      { day: 4, title: "Sermathang → Tarke Ghyang", description: "Ancient monastery, rhododendron descent.", startLocation: "Sermathang", endLocation: "Tarke Ghyang", estimatedKm: 22 },
      { day: 5, title: "Return to Kathmandu",     description: "Final mountain run home - year complete.", startLocation: "Tarke Ghyang", endLocation: "Kathmandu", estimatedKm: 155 },
    ],
    marshal: MOCK_MARSHALS[0], sponsors: MOCK_SPONSORS,
    tags: ["helambu", "marquee", "flagship", "sherpa", "circuit", "year-end"], isFeatured: true,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-02-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z",
  },
  {
    id: "r034", title: "Year-End CULT Reflection Ride", slug: "year-end-cult-dec",
    community: "CULT", rideType: "cult", chapter: "Bagmati",
    startDate: "2026-12-20", endDate: "2026-12-20",
    status: "planned", priority: "chapter",
    description: "CULT year-close - quiet ride to Shivapuri, journaling at altitude, reflection on the year.",
    shortDescription: "CULT year-end reflection ride - Shivapuri.",
    bannerImageUrl: null, expectedRiders: 16,
    registrationLink: null, routeData: null, itinerary: [],
    marshal: MOCK_MARSHALS[0], sponsors: [MOCK_SPONSORS[0]],
    tags: ["year-end", "cult", "shivapuri", "reflection"], isFeatured: false,
    isRecurring: false, recurringPattern: null, interestCount: 0,
    createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Homepage content
// ---------------------------------------------------------------------------

export const MOCK_HOMEPAGE: HomepageContent = {
  heroBanner: {
    title: "Ride Nepal. Together.",
    subtitle: "Annual ride operations for AOG & CULT - 9 chapters, one community.",
    backgroundImageUrl: null,
    overlayOpacity: 0.6,
    primaryCTALabel: "View Calendar",
    primaryCTALink: "/calendar",
    secondaryCTALabel: "Mustang 2026",
    secondaryCTALink: "/rides/upper-mustang-marquee-june",
    featuredRideId: "r019",
  },
  brandLogos: {
    tvsNepalLogoUrl: null,
    aogLogoUrl:      null,
    cultLogoUrl:     null,
  },
  marqueeRideIds: ["r019", "r033"],
  featuredUpcomingRideIds: ["r018", "r019", "r024", "r029"],
  showWeatherWidget: true,
  showSponsorShowcase: true,
  updatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Helper: get ride by id/slug
// ---------------------------------------------------------------------------

export function getMockRide(idOrSlug: string): Ride | undefined {
  return MOCK_RIDES.find((r) => r.id === idOrSlug || r.slug === idOrSlug);
}

export function getMockRidesByChapter(chapter: string): Ride[] {
  return MOCK_RIDES.filter((r) => r.chapter === chapter);
}

export function getMockFeaturedRides(): Ride[] {
  return MOCK_RIDES.filter((r) => r.isFeatured);
}

export function getMockMarqueeRides(): Ride[] {
  return MOCK_RIDES.filter((r) => r.rideType === "marquee");
}
