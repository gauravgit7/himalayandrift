# Himalayan Drift

**Grit, Brotherhood, Adventure** — riding the raw side of Nepal, together.

Ride planning and operations for the Himalayan Drift motorcycling community: a public
calendar and ride catalogue, a marshal roster, membership ID cards, and an admin panel
that runs all of it.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase.

---

## Getting started

### Windows, the short way

Double-click **`start.bat`**. It installs dependencies if they are missing, creates
`.env.local` from the example if you have not got one, starts the dev server and opens
your browser. If `.env.local` still holds the placeholder Supabase URL it will warn you
before starting.

### Any platform

```bash
npm install
cp .env.local.example .env.local   # then fill it in — see below
npm run dev
```

The app runs at <http://localhost:3000>.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run type-check` | `tsc --noEmit` |

---

## First-time setup

### 1. Create the Supabase project

Make a **new, empty** Supabase project. Do not reuse one from another deployment.

### 2. Run the SQL

In the Supabase dashboard → **SQL Editor → New query**, run these two files in order:

1. `supabase/schema.sql` — every table, enum, index, trigger and RLS policy.
2. `supabase/storage-policies.sql` — the seven storage buckets and their access rules.

Both are idempotent: re-running them is safe and will not destroy data.

`schema.sql` seeds only the singleton settings rows and one ride series
(*Drift in the Mist*). There is no demo content — the calendar starts genuinely empty.

### 3. Fill in `.env.local`

Copy `.env.local.example` and fill it in. Every key is documented inline there. The two
that trip people up:

- **`NEXT_PUBLIC_SUPABASE_URL`** must be the **project API URL**, which looks like
  `https://abcdefghijklmnop.supabase.co`. Find it under
  **Project Settings → API → Project URL**. It is *not* the `supabase.com/dashboard/...`
  address in your browser's address bar — that one returns the dashboard's HTML to every
  query, and because the app falls back to empty results on error, the site will look
  like it is working while showing nothing at all.
- **`ADMIN_EMAILS`** is a comma-separated list of **full email addresses**. Anyone listed
  gets the admin panel; nobody else does. Next.js reads it at server start, so restart
  the dev server after changing it.

### 4. Create your admin user

Supabase dashboard → **Authentication → Users → Add user**. Use an address you listed in
`ADMIN_EMAILS`, then sign in at `/login`.

### 5. Optional extras

| Feature | Needs | Without it |
| --- | --- | --- |
| Weather on ride pages | `OPENWEATHER_API_KEY` | Weather panel is hidden |
| Push notifications | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — generate with `node scripts/generate-vapid-keys.mjs` | Push admin page reports it is unconfigured |
| Scheduled ride reminders | `CRON_SECRET` plus a scheduler hitting `/api/cron/ride-reminders` | No automatic reminders |
| PWA icons | `node scripts/generate-pwa-icons.mjs "public/brand/logo-primary.jpeg"` | Default icons |

---

## What's in the box

**Public**

- `/` and `/home` — hero, featured rides, sponsors, all editable from the admin panel
- `/calendar` — year calendar with filters (ride type, series, status, priority, date,
  search) and a Bikram Sambat dual-date toggle
- `/rides`, `/rides/[id]` — ride catalogue and detail pages with route maps, itineraries,
  weather, an interest counter and an `.ics` download
- `/series`, `/series/[slug]` — ride series and their volumes
- `/marshals` — the marshal roster
- `/membership` — membership ID card applications, `/validate/[cardNumber]` to verify one
- `/signup`, `/signin`, `/profile` — rider accounts

**Admin** (`/admin`, gated by `ADMIN_EMAILS`)

Dashboard · Rides · Series · Calendar · Homepage · Marshals · Members · Sponsors ·
Exports (PDF and Excel) · Settings (membership card design, PWA, push).

---

## Documentation

`PROJECT_REFERENCE.md` is the architecture reference — data model, directory layout,
conventions, and the decisions worth knowing before you change anything.

---

## Credentials

`.env.local` is gitignored and must stay that way. Never commit it, never paste its
contents into a chat, an issue or a pull request. If a key is ever exposed, rotate it in
the Supabase dashboard rather than hoping nobody noticed.
