# Himalayan Drift — Project Handoff

**Read this file first.** It is the complete brief for building this project. It was written at the
end of a planning conversation that happened in a different repo; this session starts fresh.

**Status: nothing has been built yet.** This folder contains only this file. Every decision below is
confirmed by the project owner. Do not re-litigate them.

---

## 1. What this project is

A ride-planning and operations platform for the **Himalayan Drift** biking community: a public
calendar of rides, ride detail pages, rider registration with admin approval, digital membership
cards, and an admin panel to manage all of it.

It is a **fork-and-rebrand of an existing, working platform** — the "TVS Calendar" project — with the
multi-community structure stripped out. The source is production-quality Next.js + Supabase code that
already works. The job is to copy it, remove what doesn't apply, rebrand it, and add one new feature
(ride series).

**Source repo (read-only reference):** `D:\TVS Calendar\tvscalendar`

That repo also contains `PROJECT_REFERENCE.md` and `README.md` which document the architecture in
detail. Read both before starting.

---

## 2. Hard constraints

These come directly from the project owner and are not negotiable:

1. **Total isolation from the source repo.** No shared git history, no shared remote, no shared
   Supabase project, no shared credentials, no symlinks, no imports across folders. Someone deleting
   `D:\TVS Calendar` must not affect this project at all.
2. **Do not modify anything inside `D:\TVS Calendar`.** It is a live project. Read from it; never
   write to it.
3. **Don't break working logic while rebranding.** The owner's standing rule on the source project
   was: existing features and logic stay as they are unless a change is explicitly requested. The
   same applies here — the removals listed in §4 are the *only* behavioural changes authorised. Don't
   "improve" working code while you're in there.
4. **Ask before adding scope.** If something in §4 turns out to require a design decision that isn't
   answered in this document, ask rather than guessing.

---

## 3. What to copy

Copy from `D:\TVS Calendar\tvscalendar` into `D:\HimalayanDrift\`:

**Directories:** `app/`, `components/`, `features/`, `hooks/`, `lib/`, `services/`, `styles/`,
`types/`, `utils/`, `public/`, `supabase/`, `scripts/`

**Files:** `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`,
`tsconfig.sw.json`, `postcss.config.mjs`, `middleware.ts`, `sw.ts`, `next-env.d.ts`, `vercel.json`,
`.gitignore`, `.env.local.example`

**Never copy these:**

| Excluded | Why |
|---|---|
| `.git/` | Must be a brand-new history. Run `git init` fresh, no remote. |
| `.env.local` | Contains the source project's live Supabase keys. See §8 — there is a credential-hygiene note. |
| `node_modules/` | Reinstall with `npm install`. |
| `.next/`, `tsconfig.tsbuildinfo` | Build artefacts. |
| `.claude/` | Source project's agent config. |
| `bat-log.txt`, `start.bat` | Source-machine-specific. |
| `PROJECT_REFERENCE.md`, `README.md` | Write new ones for this project. |

After copying: `git init` (no remote), verify `.gitignore` covers `.env*.local`, `node_modules`,
`.next`, then `npm install` and confirm `npx tsc --noEmit` passes **before** changing anything. That
clean baseline is what you measure the rebrand against.

---

## 4. What changes

### 4.1 Remove the multi-community split — CONFIRMED

The source models two communities, **AOG** (Apache Owners Group) and **CULT**, plus a combined
`AOGxCULT`. Himalayan Drift is a **single community**. Remove the concept entirely — not just the
labels. There is no "which community" question anywhere in this product.

Roughly 60 files reference `AOG` or `CULT`. Known touchpoints:

- `types/index.ts` — the `Community` type and every field using it
- `lib/constants.ts` — the `COMMUNITIES` array
- `components/shared/CommunityBadge.tsx` — delete the component and every usage
- `components/shared/RideCard.tsx` — community badge on cards
- `features/calendar/CalendarFilterBar.tsx` — the community filter
- `features/calendar/` — `MonthView`, `YearView`, `ListView` and the three `Bs*` (Bikram Sambat)
  equivalents all colour-code by community
- `features/rides/RidesFilterList.tsx`, `features/admin/RidesTable.tsx`, `features/admin/RideForm.tsx`
- `features/membership/CardRenderer.tsx` — card design is community-branded
- `features/profile/ProfileClient.tsx`, `features/auth/SignUpForm.tsx` — community selector
- `features/homepage/HeroBanner.tsx`, `MarqueeHighlight.tsx`
- `lib/exports/excel.ts`, `lib/exports/pdf.tsx` — community columns and grouping
- `lib/supabase/mappers.ts`, `queries.ts`, `actions.ts`
- `supabase/schema.sql`, `create-member-cards.sql`, `create-profiles.sql` — the `community` columns
- `app/globals.css`, `app/layout.tsx`, `app/manifest.ts`

Delete `lib/data/mock.ts`'s community-shaped fixtures (see §4.3 — mock data goes anyway).

### 4.2 Remove chapters entirely — CONFIRMED

The source has 9 geographic chapters (Bagmati, Gandaki, Narayani, Lumbini, Rapti, Bheri, Mahakali,
Koshi, Mechi) with regions, priority tiers, map coordinates, and 3-letter codes. Himalayan Drift has
**no chapters**. This is a full removal, confirmed explicitly — not "hide the UI".

Touchpoints:

- Delete `app/(public)/chapters/page.tsx` and `app/(public)/chapters/[name]/page.tsx`
- Delete `app/(admin)/admin/chapters/page.tsx` and `features/admin/ChapterEditor.tsx`
- Delete `features/homepage/ChapterHighlights.tsx` and remove it from the homepage
- `lib/constants.ts` — remove `CHAPTERS`, `CHAPTER_NAMES`, `PRIORITY_CHAPTERS`, `CHAPTER_CODES`, and
  the `chapters`/`adminChapters` entries in `ROUTES`
- `types/index.ts` — remove `ChapterName` and the `Chapter` interface
- Remove chapter from: navbar links, footer links, admin sidebar, calendar filters, ride
  create/edit forms, rider registration, profile, marshal records, and both exporters
- `supabase/` — drop the `chapters` table and every `chapter` foreign key / column, including
  `make-marshal-chapter-nullable.sql` which becomes moot
- **Membership card numbers** currently embed a chapter code: `AOG-BAG-26-00001`. Redesign to
  `HD-26-00001` (short name, 2-digit year, 5-digit sequence). Update `create-member-cards.sql`,
  the card generator, `CardRenderer.tsx`, and the `/validate/[cardNumber]` lookup.
- The map components (`components/maps/`) use chapter coordinates in places — rides have their own
  routes, so keep ride mapping and remove only the chapter-location usage.

Marshals stay, but become community-wide rather than chapter-assigned.

### 4.3 Content: clean slate — CONFIRMED

No seed rides, no demo data. Do **not** port `supabase/seed-rides-2026.sql` or `lib/data/mock.ts`.
The site should launch empty with sensible placeholder homepage copy naming Himalayan Drift, and the
owner fills everything in through the admin panel.

Every query function in `lib/supabase/queries.ts` already returns `[]` / `null` / defaults on error
or empty results, so empty pages must render cleanly rather than crash. Verify this — it is the
single most likely source of first-run bugs on a clean database.

### 4.4 Ride types — CONFIRMED

Replace the source's `chapter | cult | overnight | marquee` with exactly four duration-based types:

| Value | Label | Duration |
|---|---|---|
| `day` | Day Ride | 1 day |
| `overnight` | Overnight | 2D1N |
| `multiday` | Multi-Day | 3+ days |
| `marquee` | Marquee | Flagship |

Note `cult` disappears as a ride type — it was community-specific. `chapter` becomes `day`.

Also revisit `RIDE_PRIORITIES` in `lib/constants.ts` (`local | chapter | national | marquee`) — the
`chapter` tier no longer means anything. Propose a replacement to the owner rather than deciding
alone; this one wasn't covered in planning.

### 4.5 NEW FEATURE — Ride series — CONFIRMED

This is the one genuinely new thing, and the only addition authorised.

The community runs recurring named ride series that release in volumes. Their flagship is
**"Drift in the Mist"**, currently on **Vol III**. A series spans ride types — a Drift in the Mist
volume might be an overnight ride or a 3-day ride — so series is a *separate axis* from ride type,
deliberately not a fifth type.

Build it as:

- A `series` table: `id`, `name`, `slug`, `description`, `banner_url`, `created_at`
- On `rides`: nullable `series_id` and an integer `volume`
- Ride cards and ride detail pages show a series badge, e.g. `Drift in the Mist — Vol III`
- A series filter in the calendar filter bar and the rides list
- A `/series` page listing all series, and `/series/[slug]` showing every volume of one series in
  chronological order
- Admin CRUD for series, and series + volume fields on the ride form
- Seed exactly one row: **Drift in the Mist**. Do not seed volumes — the owner adds rides.

Model it generically. Adding a second series later must require zero code changes.

### 4.6 Branding — NEEDS INPUT

**The owner has logo files and will share them at the start of the next session.** Ask for them
before doing any theming work.

- Full name: **Himalayan Drift** — confirm the exact preferred rendering with the owner
- Short name: propose **HD** for the navbar, PWA short name, and card number prefix — confirm it
- The source theme is TVS red (`#DC2626`). Derive the new palette from the logos.
- Files carrying brand: `app/globals.css` (CSS custom properties), `lib/constants.ts` (`APP_META`),
  `app/layout.tsx` (metadata), `app/manifest.ts` (PWA), `components/brand/BrandLogo.tsx`,
  `components/shared/Navbar.tsx`, `Footer.tsx`, `public/icons/` (regenerate every PWA icon size),
  `features/membership/CardRenderer.tsx`, `lib/exports/pdf.tsx`
- `package.json` — set `name` to `himalayan-drift` and rewrite `description`
- Grep for `TVS`, `Apache`, `tvs-` and `tvs_` across the whole tree afterwards; the source uses
  `tvs-red-*` Tailwind colour tokens extensively, so the token names themselves need renaming.

### 4.7 Keep unchanged

Everything else ports as-is: the ride calendar with dual Gregorian/Bikram Sambat views, ride detail
pages, route maps, weather integration, rider auth with email confirmation, the PKCE
`/auth/callback` route, admin approval of registrations, membership cards with QR validation, push
notifications, iCal export, Excel/PDF export, PWA/offline support, and the whole admin panel.

---

## 5. Known incomplete work inherited from the source

The source repo had work in progress at fork time. Carry it forward and finish it here:

- `features/auth/SignUpForm.tsx` — the `signUpPublic` server action was changed to take a single
  `SignUpPayload` object, replacing a positional signature. **Verify the call site matches** before
  trusting registration end to end.
- The extended registration fields (address, bike model, date of birth, licence number, contact
  number, identity photo) exist in the types, mappers, SQL and server actions but the **form UI was
  never built**. Build it here.
- `features/admin/UserRegistrationsAdmin.tsx` exists but the pending → approved/rejected admin flow
  needs finishing, including `approveRegistration`, `rejectRegistration` and
  `updateRegistrationByAdmin` actions.
- `features/profile/ProfileClient.tsx` — needs the member-status badge and the new editable fields.
- Discussed but never built: gating the public calendar to the current month for signed-out visitors,
  with full navigation once signed in. Confirm with the owner whether this still applies.

---

## 6. Supabase setup (owner action, not code)

This project needs its **own Supabase project**. Do not reuse the source project's — that would
couple the two systems through shared data and shared keys.

Steps for the owner, once the schema is written:

1. Create a new Supabase project.
2. Run the consolidated `supabase/schema.sql` in the SQL Editor.
3. Create the storage buckets defined in `STORAGE_BUCKETS` in `lib/constants.ts` and apply
   `supabase/storage-policies.sql`.
4. Copy `.env.local.example` to `.env.local` and fill in the new project's URL, anon key and
   service-role key.
5. Set `ADMIN_EMAILS` to the admin address — **the full address including the domain.** A truncated
   value here caused a long debugging session on the source project; the admin layout and middleware
   both log a warning naming the mismatch, so check the terminal if admin access silently redirects
   to the homepage.
6. Add `http://localhost:3000/auth/callback` to Authentication → URL Configuration → Redirect URLs,
   plus the production URL when deployed.
7. Generate a **fresh VAPID keypair** for push notifications. Do not reuse the source project's.

`ADMIN_EMAILS` is read server-side, so **the dev server must be restarted** after changing it.

Since chapters and communities are being removed, write a **single consolidated `schema.sql`** for
this project rather than porting the source's 15 incremental migration files. A new database doesn't
need the source's migration history, and replaying migrations that add then remove chapter columns
would be needless risk.

---

## 7. Suggested order of work

1. Copy the tree per §3, `git init`, `npm install`, confirm `npx tsc --noEmit` is clean.
2. Get the logos and confirm the short name (§4.6).
3. Strip communities (§4.1) and chapters (§4.2) — types and constants first, then let TypeScript
   errors guide you through every call site. Run `npx tsc --noEmit` continuously.
4. Rewrite `supabase/schema.sql` consolidated and chapter/community-free.
5. Ride types (§4.4), then the series feature (§4.5).
6. Rebrand: palette, logos, icons, metadata, copy (§4.6).
7. Finish the inherited incomplete work (§5).
8. Full pass: `npx tsc --noEmit`, `npm run build`, then click through every route against an empty
   database.
9. Write a fresh `README.md` and `PROJECT_REFERENCE.md`.

Commit at each numbered step. The first commit should be the untouched copy, so the entire rebrand
is reviewable as a diff against working code.

---

## 8. Credential hygiene

The source project's `.env.local` was pasted into a chat log during development, exposing its
Supabase service-role key, anon key, OpenWeather key and VAPID private key. The owner has been
advised to rotate those.

For this project: **generate every credential fresh.** Do not copy any value from the source
`.env.local`, even temporarily to "get it running". `.env.local` must never be committed — confirm
`.gitignore` covers it before the first commit.

---

## 9. Decisions still open

Flag these to the owner early; none of them block starting:

- Exact short name / card prefix (`HD`?)
- What replaces the `chapter` tier in `RIDE_PRIORITIES` (§4.4)
- Whether the signed-out calendar gating from §5 still applies
- Whether marshals stay a feature at all, now that they're not chapter-assigned
- Deployment target — the source has a `vercel.json`, so Vercel is assumed unless told otherwise
