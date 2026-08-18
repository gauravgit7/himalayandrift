# Himalayan Drift — project reference

Architecture notes for anyone changing this codebase. `README.md` covers setup; this file
covers how the thing is put together and why.

---

## 1. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16, App Router | Server Components by default; `--webpack` build |
| UI | React 19, TypeScript | |
| Styling | Tailwind CSS v4 | CSS-first config in `app/globals.css`. **There is no `tailwind.config.js`** — the design tokens live in the `@theme` block |
| Data | Supabase (Postgres + Auth + Storage) | `@supabase/ssr` for cookie-based sessions |
| Animation | Framer Motion | |
| Maps | Leaflet + react-leaflet | Client-only, dynamically imported |
| Exports | `@react-pdf/renderer`, ExcelJS | |
| PWA | Serwist | Service worker, offline page, web push |
| Dates | date-fns + `nepali-date-converter` | Gregorian and Bikram Sambat side by side |

---

## 2. Directory layout

```
app/
  (public)/      calendar, rides, series, marshals, membership, profile, validate
  (auth)/        signin, signup, forgot-password, reset-password
  (admin)/admin/ the admin panel — one folder per section
  api/           rides, ical, export/{pdf,excel}, members/status, push/*, cron/*
  auth/callback/ Supabase email-confirmation and password-reset landing
  login/         admin sign-in (separate from the rider /signin)
  globals.css    Tailwind v4 @theme — the entire design system
components/
  ui/            generic primitives (Button, Modal, ImageUpload, …)
  shared/        app-aware but reusable (RideCard, SeriesBadge, Navbar, Footer, …)
  brand/ maps/ theme/ auth/
features/        one folder per domain area; the substantial screens live here
lib/
  constants.ts   ride types, priorities, routes, buckets, app metadata
  supabase/      client.ts, server.ts, admin.ts, middleware.ts,
                 queries.ts (reads), actions.ts (writes), mappers.ts (row ↔ type)
  exports/       PDF and Excel builders
  weather/       OpenWeather integration
types/index.ts   every shared type
utils/           cn, date, nepali-date, ride helpers
supabase/        schema.sql, storage-policies.sql
scripts/         generate-pwa-icons.mjs, generate-vapid-keys.mjs
```

---

## 3. The data layer

Four files, four jobs. Keep them that way.

- **`mappers.ts`** — the only place that knows Postgres is `snake_case` and the app is
  `camelCase`. Each table has a `Db*` interface and a `map*` function. Nothing outside
  this file should touch a snake_case key.
- **`queries.ts`** — reads. Server-side, one exported function per question the UI asks.
  **Every query catches its own errors and returns an empty value** (`[]`, `null`, a
  default object). This is deliberate: a fresh install has no data and a missing table
  or a bad URL must render an empty page, never a crash. The trade-off is that
  configuration mistakes are quiet — they appear as `[queries] name: …` on the server
  console and an empty page in the browser, so check the console before assuming the
  database is empty.
- **`actions.ts`** — writes. `"use server"`, so **every export must be an async
  function** — a stray exported constant breaks the build. Mutations call
  `revalidatePath()` for the pages they affect.
- **`admin.ts`** — the service-role client. Bypasses RLS. Server-only, never imported
  into a Client Component.

Rides are always selected through the shared constant:

```ts
const RIDE_SELECT = "*, marshals(*), series(*), ride_sponsors(sponsors(*))";
```

so a ride carries its marshal, series and sponsors everywhere it is already loaded. Add a
relation here rather than issuing a second query in a page.

---

## 4. Data model

### Rides

`ride_type` is one of `day | overnight | multiday | marquee` — how long the ride is.
`priority` is one of `standard | signature | marquee` — how much prominence it gets on
cards and the calendar. They are separate on purpose; a `day` ride can be `marquee`
priority.

`location` is free text (the start or meeting point). It replaced the source project's
chapter taxonomy — this is a single-community platform and there are no chapters.

### Series

A series is a named recurring ride that releases in volumes — *Drift in the Mist — Vol
III*. A ride optionally has `series_id` and `volume`.

Series is a **separate axis from `ride_type`**, not a fifth type, because one volume may
be an overnight and the next a multi-day. Two consequences worth knowing:

- `series_id` is `ON DELETE SET NULL`. Deleting a series does **not** delete its rides —
  they become standalone rides and stay on the calendar. The admin delete dialog says so.
- A check constraint (`volume_needs_series`) rejects a volume number without a series, so
  `saveRide` nulls a stray volume rather than letting Postgres throw.

Nothing hardcodes *Drift in the Mist* except the one seed row. Adding a second series is
data entry.

### Ride registration

A ride can collect sign-ups on the site instead of pointing at an external form.
`rides.registration_open` is the switch; while it is on, `registration_link` is ignored
and the ride page links to `/rides/[id]/register` instead. Only one front door ever shows.

- **Free or paid per ride.** `registration_fee` null or 0 means free, and the form drops
  the payment step and the screenshot requirement entirely. Both representations collapse
  to null on save so "is this paid?" has one answer.
- **Payment details resolve per field**, not all-or-nothing: `resolvePaymentDetails()` in
  `utils/ride.ts` falls back from `rides.payment_qr_url` / `rides.payment_instructions` to
  the club-wide `payment_settings` singleton. A ride can borrow a different QR while
  keeping the standard instructions — the common case when one marshal collects.
- **Capacity** counts pending + approved, so rejecting frees the seat. `null` is unlimited.
- **The server re-decides everything.** `submitRideRegistration` re-reads the ride and
  re-checks open/cancelled/finished/full/fee/screenshot from the database. A client can
  post whatever it likes to a server action, so nothing in the payload is trusted. The
  capacity check races by design: two riders can take the last seat simultaneously rather
  than have the table locked, and the admin rejects the extra.
- **Guests are first-class.** Registration is open to signed-out visitors; a signed-in
  rider gets their details prefilled but stays editable, because riders register pillions
  and friends. `user_id` is a convenience link, and the name and phone on the row are the
  authoritative record for the ride. A partial unique index stops one *account* registering
  twice; guests are unconstrained, since nulls are distinct in Postgres.
- **`access_code`** (`HD-R-XXXXXX`) is issued at submission and is the only way a
  signed-out registrant reaches their status, at `/rides/registered/[code]`.

`ride_registrations` has **no public SELECT policy**, unlike `member_cards`. A roster is a
list of names, phone numbers and emergency contacts; open SELECT would hand the lot to
anyone holding the anon key. Signed-in riders may read their own rows, and everything else
goes through the service role.

### Marshals

Community-wide, not assigned to a region. `role` is free text so the community can invent
titles without a migration, with an optional `role_icon_url` badge.

### Profiles and membership

Two separate things that are easy to confuse:

- **`profiles`** — rider accounts (Supabase Auth). Has a `member_status` of
  `pending | approved | rejected` that an admin moves in `/admin/members?tab=registrations`.
- **`member_cards`** — physical/digital ID card applications. Open to signed-out
  visitors. Card numbers are `HD-<YY>-<00001>`, assigned at approval.

**The approval columns are protected at the database level.** `profiles_update_own` grants
a rider UPDATE on their own row, which would otherwise let them PATCH
`member_status = 'approved'` straight to PostgREST with the public anon key. RLS cannot
express "every column except these", so a `BEFORE UPDATE` trigger
(`guard_profile_approval_columns`) restores `member_status`, `admin_notes`, `approved_at`,
`rejected_at` and `email` unless the write carries the service-role JWT or no JWT at all
(SQL editor, psql). The admin actions all use the service-role client, so approval works.
If you add another column that only an admin may set, add it to that trigger.

**Card submissions are protected the same way.** `public_insert_member_cards` has to be
`with check (true)` — applicants are signed out, so there is no `auth.uid()` to check
against. That policy constrains who may insert, not what they may insert, so a
`BEFORE INSERT` trigger (`guard_member_card_submission`) overwrites `status`,
`card_number`, `approved_at`, `valid_until`, `rejection_reason`, `admin_notes`,
`resubmission_count` and all four link columns on any submission not carrying the
service-role JWT, and pins `user_id` to `auth.uid()`. Without it, anyone holding the
public anon key could POST themselves an approved card, number and all, and attach it to
someone else's account.

#### Linking a card to an account

A card can be applied for before an account exists, so the two arrive in either order:

| Route in | `linked_by` | How |
| --- | --- | --- |
| Signed-in rider taps *Request card* | `self` | `user_id` set at insert; nothing inferred |
| Walk-in application, applicant signs up later | `auto` | identity match at sign-up / sign-in / profile save |
| Neither matched | `admin` | merge tool in `/admin/members` |

`lib/membership/identity.ts` holds the judgement and imports nothing — it compares name,
date of birth, licence number, emergency phone and blood group, weights them (a licence
number identifies a person; a blood group is one value in eight), and scores only the
fields present on **both** sides so a sparse profile is not read as a stranger. To link
without a human it demands three shared fields, 70%, and at least one of licence or date
of birth — name and blood group agreeing is not evidence in a club where names repeat.

Two applications clearing the bar for one account is **not** broken by picking the higher
score: that is the case where guessing hands one rider's card to another. Both are left
alone and surface under the *Unlinked* tab in the members admin, where a human can look at
the photos. `lib/membership/link.ts` is the plumbing around that decision — claim,
backfill (empty profile fields only, never overwriting the rider's own answer), rank
candidates, link, unlink.

### Ride pricing and membership tiers

A ride has one list fee (`registration_fee`) and an optional flat discount off it for
everybody (`registration_discount`). On top of that a member's **tier** takes a
percentage off. All of it resolves through [`lib/rides/pricing.ts`](lib/rides/pricing.ts),
which imports nothing but types.

Order of operations, and it matters: **list fee → club discount → tier percentage.** The
tier takes its cut of the already-discounted price, so a ride on offer does not quietly
hand veterans a second compounding discount off the higher number.

> **There was previously a per-ride rate picker** — a list of named rates the rider chose
> from at sign-up. It is gone. The problem was not that different people paid different
> amounts; it was that the form made *every* rider read the whole price table, so a rider
> paying full price could see exactly what they were not getting. A discount that has to
> be compared to be understood is a ranking, not a benefit. The tier lives on the account,
> the form resolves one number, and nobody sees anybody else's.

**Tiers are assigned, never computed.** There is deliberately no engine that promotes
anyone: who counts as a veteran is a judgement about a person, and a rule that awarded it
would turn a compliment into a formula. `profiles.tier_id` is set by hand in
Admin → Members; a null falls back to the tier flagged `is_default`, so a member is never
in limbo — including after their tier is deleted.

Two switches in `membership_settings`, not one. `tiers_enabled` prices rides;
`loyalty_enabled` awards points. Either is useful alone — points with tiers off means
everybody earns at 1×, and tiers with points off is simply a discount scheme.

### Loyalty points

`rides.loyalty_points` and `products.loyalty_points` are base values; a rider earns
`base × tier.reward_factor`, rounded. Awarded **on approval**, never on submission — the
same rule the shop already uses for stock, and for the same reason: an unpaid form is a
claim, not a sale, and paying for it lets abandoned baskets mint points.

`loyalty_ledger` is append-only and every row is **signed** — positive earns, negative
spends. Three things follow from that:

- **The balance is `SUM(points)` and is never stored.** A counter can only drift, and
  cannot answer "where did my 3,400 come from".
- **`base_points` and `factor` are recorded beside the total.** Promoting a rider from 1×
  to 2× must not rewrite what they earned last season, and storing both makes each row
  explain itself on screen.
- **Vouchers need no schema change.** They write negative rows.

A partial unique index on `(source_type, source_id, user_id)` for positive rows makes
awarding idempotent: approving, un-approving and approving again cannot pay three times.
Rejection writes a negative reversal rather than deleting the award, because a history
that loses entries cannot be reconciled.

The ledger has **no insert policy at all** — a table anyone can write to is a table anyone
can pay themselves from. Awarding runs through the service role.

### Music

`anthem_settings` is now just `is_enabled` — the master switch for whether the player
appears at all. The songs live in **`anthem_tracks`**, ordered, with exactly one flagged
`is_anthem` (a partial unique index enforces the "exactly one"). The anthem heads the
queue whatever its `sort_order`; prev/next walks the rest. Re-running `schema.sql` carries
an existing single anthem across, guarded on the table being empty so it never duplicates.

`AnthemProvider` holds the queue and an index. The `<audio>` element must **survive** a
track change — only its `src` changes — because `createMediaElementSource` may be called
once per element for the life of the page, and swapping the node loses the analyser for
good. Changing `src` resets the element, so playback is restarted in an effect keyed on
the index rather than in the handler, where React has not yet committed the new `src`.

### Shop

Three tables, because a T-shirt is not one thing: `products`, `product_variants` (the
sizes), `shop_orders` + `shop_order_items`. **Stock lives on the variant**, which is the
entire reason variants exist — "12 in stock" across S–XL oversells the popular sizes and
strands the rest. A product with no variants carries its own `stock`; null there means
untracked, not zero.

Order flow deliberately mirrors ride registration, because riders have already learnt it:
submit → pay by QR → upload the screenshot → get a code to check status with. No payment
gateway is involved.

Two rules worth not undoing:

- **Prices are re-read server-side on every basket render and again at submission.** The
  browser's basket holds ids and quantities only. A tampered payload cannot buy a jacket
  for one rupee, and a basket left open for a week cannot check out at last week's price.
- **Stock comes off at approval, not submission.** An unpaid order is a claim, not a sale.
  Decrementing at submission lets abandoned baskets empty the shop on paper.

`guard_shop_order_submission` does for `shop_orders` what the membership-card guard does
for `member_cards`: `with check (true)` is unavoidable for signed-out buyers, so a trigger
pins `user_id` to `auth.uid()` and zeroes the money and status columns on any insert not
carrying the service-role key.

---

## 5. Auth and access control

- **Riders** sign up at `/signup`, sign in at `/signin`, manage themselves at `/profile`.
- **Admins** sign in at `/login`. Admin identity is checked in **two independent places**,
  and both must be set for an admin to be useful:

  | Gate | Source | Guards |
  | --- | --- | --- |
  | Page access | `ADMIN_EMAILS` env var | reaching `/admin/*` |
  | Data writes | `profiles.is_admin` | every RLS write policy |

  Two sources because RLS cannot read environment variables — a Postgres policy has no way
  to consult `ADMIN_EMAILS`, so the database needs its own flag. `is_admin` is frozen by
  `guard_profile_approval_columns`, so a rider cannot promote themselves.

  **`to authenticated` is not an admin check.** Any rider who signs up is authenticated and
  holds the anon key that ships in every page; a write policy of `using (true)` would let
  them rewrite the site from the browser console without ever visiting `/admin`. Every write
  policy calls `public.is_admin()`.

  Bootstrapping the first admin needs a manual SQL insert — see the block at the foot of
  `schema.sql`. A dashboard-created account has no `profiles` row, so it must insert.

  > **`ADMIN_EMAILS` must always be set.** The middleware fails closed — an empty list
  > means nobody reaches `/admin`. It used to treat empty as "everyone is an admin",
  > inherited from the source project where it was backwards compatibility for
  > single-admin installs predating public sign-up. That was fixed when public sign-up
  > went live.
- `middleware.ts` refreshes the Supabase session on every request and redirects
  unauthenticated visitors away from `/admin/*` and `/profile`.
- RLS: public tables are readable by everyone and writable by any authenticated user;
  `profiles` is own-row only; `member_cards` accepts anonymous inserts (applicants are
  signed out) and is publicly readable (QR validation is public by design).

---

## 6. Storage

Nine buckets, created by `storage-policies.sql`:

`ride-banners` · `hero-banners` · `brand-logos` · `sponsor-logos` · `rider-avatars` ·
`member-photos` · `pwa-icons` · `payment-qr` · `payment-screenshots`

All are publicly readable with authenticated write, **except `member-photos` and
`payment-screenshots`**, which also allow anonymous INSERT — membership applicants and
ride registrants are both signed out when they upload. Deletes stay authenticated-only.

Public read on `payment-screenshots` is worth a thought before you decide what a payment
screenshot is allowed to show. Object keys are random, so one is unguessable, but it is
not secret to anyone holding the link.

`STORAGE_BUCKETS` in `lib/constants.ts` mirrors this list. The `documents` entry is
reserved; no uploader targets it yet.

---

## 7. Design system

Everything lives in the `@theme` block of `app/globals.css`. Tailwind v4 has no JS config
file, so that block *is* the config.

| Scale | Role |
| --- | --- |
| `hd-ember-*` | Primary. `500` is `#f09020`, the brand orange |
| `hd-bone-*` | Warm off-white for text on dark |
| `hd-clay-*` | Earthy mid-tones |
| `hd-slate-*` | Cool secondary, `500` is `#3e6b78` |
| `hd-ink-*` | Neutrals and surfaces; `950` is `#0a0908`, the page background |

Plus `shadow-glow-ember` / `shadow-glow-slate`, and the `.gradient-brand` and
`.gradient-marquee` utilities. Status colours (planned, confirmed, cancelled …) are
deliberately outside the brand scales — they must stay legible as semantics, not styling.

Brand strings — name, short name, motto, tagline — come from `APP_META` in
`lib/constants.ts`. Do not hardcode them.

---

## 8. Conventions

- **Server Components by default.** Add `"use client"` only for state, effects, event
  handlers or browser APIs. Fetch in the server page, pass plain props down.
- **Routes come from `ROUTES`** in `lib/constants.ts`, not string literals.
- **ISR** on public pages via `export const revalidate`. Mutations call
  `revalidatePath()`.
- Leaflet, the PDF renderer and other browser-only libraries are dynamically imported
  with `ssr: false`.

---

## 9. Changing the schema

`supabase/schema.sql` is the whole schema in one idempotent file, re-run rather than
migrated. That has one sharp edge worth internalising:

> **`create table if not exists` does nothing on a table that already exists.** Adding a
> column to a create-table block only affects brand-new databases. Every existing install
> silently lacks it, and PostgREST reports *"could not find the 'x' column … in the schema
> cache"* the first time something writes to it.

So a new column needs **two** edits: the create-table block, for fresh databases, and

```sql
alter table <table> add column if not exists <column> <type>;
```

immediately after it, for existing ones. Same for constraints, wrapped in a
`do $$ … exception when duplicate_object then null; end $$;` block. `marshals.role_icon_url`
and the `rides.registration_*` columns are the worked examples.

To check a live database against the file, diff the column list PostgREST publishes at
`/rest/v1/` (`Accept: application/openapi+json`) against the create-table blocks.

## 10. Known issues

**Unknown ride and series slugs return HTTP 200.** `/rides/[id]` and `/series/[slug]`
call `notFound()` correctly and render the 404 page, but because those routes are ISR
(`export const revalidate`) the response status is 200. A genuinely unrouted path such as
`/totally-missing` returns a correct 404. This is inherited from the source project and
affects SEO — search engines will index nonexistent rides. Fixing it means giving up ISR
on those two routes, so it is flagged rather than changed.

---

## 11. Provenance

Forked from a multi-community ride-calendar platform and reduced to a single community.
Removed in the fork: the community split, the chapter taxonomy, and all seed and mock
data. Added: the ride series feature, marshal role badges, and the Himalayan Drift
identity. `HANDOFF.md` records the brief and the decisions behind each change.

The fork shares **nothing** with its source — no git history, no remote, no Supabase
project, no credentials. Keep it that way.
