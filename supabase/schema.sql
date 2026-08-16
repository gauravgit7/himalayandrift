-- =============================================================================
-- Himalayan Drift — consolidated database schema
--
-- Run ONCE in: Supabase Dashboard → SQL Editor → New query
-- Then run storage-policies.sql to create the storage buckets.
--
-- This is the whole schema in one file. It replaces the source project's
-- incremental migration history — a new database has no history to replay, and
-- replaying migrations that add then remove chapter/community columns would be
-- needless risk.
--
-- Safe to re-run: every statement is idempotent.
--
-- IMPORTANT when adding a column later: `create table if not exists` does
-- nothing at all on a table that already exists, so editing a create-table
-- block only affects brand-new databases. Every column added after a release
-- must ALSO appear as `alter table <t> add column if not exists <c> <type>;`
-- right after its table, or existing installs will silently lack it and
-- PostgREST will report it "not found in the schema cache".
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type ride_type as enum ('day', 'overnight', 'multiday', 'marquee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ride_status as enum
    ('planned', 'tentative', 'confirmed', 'postponed', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ride_priority as enum ('standard', 'signature', 'marquee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sponsor_tier as enum ('title', 'co', 'associate', 'media');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recurring_frequency as enum ('weekly', 'biweekly', 'monthly', 'quarterly');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared trigger function — keeps updated_at honest
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Marshals
-- Community-wide, not chapter-assigned. `role` is deliberately free text so
-- the community can invent titles (Head / Navigator / Creative …) without a
-- migration; the public page builds its filter from the roles in use.
-- ---------------------------------------------------------------------------

create table if not exists marshals (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  phone             text,
  avatar_url        text,
  role              text not null default 'Ride Marshal',
  -- Optional badge art for the role (e.g. the Marshal-Head / Marshal-Navigator
  -- stickers). Falls back to the role text when unset.
  role_icon_url     text,
  specialty         text,          -- comma-separated tags, shown as chips
  bio               text,
  total_rides_led   integer not null default 0,
  instagram_handle  text,          -- without the @
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- role_icon_url post-dates the first release. `create table if not exists` is a
-- no-op on a table that already exists, so it never ADDS a column - a database
-- created before this column would silently lack it, and the admin form would
-- fail with "could not find the 'role_icon_url' column in the schema cache".
-- Every column added after a release needs an alter like this one.
alter table marshals add column if not exists role_icon_url text;

create index if not exists idx_marshals_is_active on marshals(is_active);

-- ---------------------------------------------------------------------------
-- Ride series
-- A named series that releases in volumes, e.g. "Drift in the Mist — Vol III".
-- Deliberately a separate axis from ride_type: a volume may be an overnight
-- one year and a multi-day the next. Adding a second series is data, not code.
-- ---------------------------------------------------------------------------

create table if not exists series (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  banner_url  text,
  created_at  timestamptz not null default now()
);

-- The community's flagship series. The only seeded content in this file.
-- Volumes are not seeded — those arrive as rides via the admin panel.
insert into series (name, slug, description)
values (
  'Drift in the Mist',
  'drift-in-the-mist',
  'Our flagship series. Each volume chases the mist somewhere new.'
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Sponsors
-- ---------------------------------------------------------------------------

create table if not exists sponsors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  description text,
  website_url text,
  tier        sponsor_tier not null default 'associate',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Rides (core table)
-- ---------------------------------------------------------------------------

create table if not exists rides (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  slug                text not null unique,
  ride_type           ride_type not null default 'day',
  -- Free-text start/meeting point, e.g. "Kathmandu". Replaces the old chapter
  -- taxonomy: still the ride's "where" on cards, exports and the iCal feed.
  location            text not null default '',
  start_date          date not null,
  end_date            date not null,
  status              ride_status not null default 'planned',
  priority            ride_priority not null default 'standard',
  description         text,
  short_description   text,
  banner_image_url    text,
  expected_riders     integer not null default 0,
  -- An external form (Google Forms and the like). Ignored when the built-in
  -- registration below is switched on.
  registration_link   text,

  -- ── Built-in registration ────────────────────────────────────────────────
  -- Off by default: a ride announces itself long before sign-ups open.
  registration_open      boolean not null default false,
  -- null or 0 means a free ride: the form collects details and skips payment.
  registration_fee       numeric(10,2),
  -- null means unlimited. Counted against pending + approved, not rejected.
  registration_capacity  integer,
  -- Per-ride overrides for the club-wide payment details in payment_settings.
  -- Set when a particular marshal is collecting for this ride.
  payment_qr_url         text,
  payment_instructions   text,
  route_data          jsonb,   -- RouteData  { waypoints, totalDistanceKm, … }
  itinerary           jsonb,   -- ItineraryDay[]
  marshal_id          uuid references marshals(id) on delete set null,
  -- Series is optional; a ride either belongs to one volume of one series or
  -- stands alone.
  series_id           uuid references series(id) on delete set null,
  volume              integer,
  tags                text[] not null default '{}',
  is_featured         boolean not null default false,
  is_recurring        boolean not null default false,
  recurring_pattern   jsonb,   -- RecurringPattern
  interest_count      integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint end_after_start check (end_date >= start_date),
  -- A volume number without a series is meaningless.
  constraint volume_needs_series check (volume is null or series_id is not null),
  constraint fee_not_negative      check (registration_fee is null or registration_fee >= 0),
  constraint capacity_positive     check (registration_capacity is null or registration_capacity > 0)
);

-- The registration columns above post-date the first release, so a database
-- created before them needs them added. `create table if not exists` is a no-op
-- on an existing table, which is why these are repeated as alters.
alter table rides add column if not exists registration_open     boolean not null default false;
alter table rides add column if not exists registration_fee      numeric(10,2);
alter table rides add column if not exists registration_capacity integer;
alter table rides add column if not exists payment_qr_url        text;
alter table rides add column if not exists payment_instructions  text;

do $$ begin
  alter table rides add constraint fee_not_negative
    check (registration_fee is null or registration_fee >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table rides add constraint capacity_positive
    check (registration_capacity is null or registration_capacity > 0);
exception when duplicate_object then null; end $$;

create index if not exists idx_rides_start_date  on rides(start_date);
create index if not exists idx_rides_ride_type   on rides(ride_type);
create index if not exists idx_rides_status      on rides(status);
create index if not exists idx_rides_is_featured on rides(is_featured);
create index if not exists idx_rides_series      on rides(series_id);

drop trigger if exists rides_updated_at on rides;
create trigger rides_updated_at
  before update on rides
  for each row execute function set_updated_at();

-- Atomic interest counters — concurrent taps must not lose increments.
create or replace function increment_ride_interest(ride_id uuid)
returns integer language plpgsql security definer as $$
declare new_count integer;
begin
  update rides set interest_count = interest_count + 1
   where id = ride_id
  returning interest_count into new_count;
  return coalesce(new_count, 0);
end;
$$;

create or replace function decrement_ride_interest(ride_id uuid)
returns integer language plpgsql security definer as $$
declare new_count integer;
begin
  update rides set interest_count = greatest(interest_count - 1, 0)
   where id = ride_id
  returning interest_count into new_count;
  return coalesce(new_count, 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- Ride ↔ Sponsor (many-to-many)
-- ---------------------------------------------------------------------------

create table if not exists ride_sponsors (
  ride_id     uuid not null references rides(id)    on delete cascade,
  sponsor_id  uuid not null references sponsors(id) on delete cascade,
  primary key (ride_id, sponsor_id)
);

-- ---------------------------------------------------------------------------
-- Homepage content (single row, id = 1)
-- ---------------------------------------------------------------------------

create table if not exists homepage_content (
  id                          integer primary key default 1,
  hero_title                  text not null default 'Grit. Brotherhood. Adventure.',
  hero_subtitle               text not null default 'Riding the raw side of Nepal, together.',
  hero_background_image_url   text,
  hero_overlay_opacity        numeric(3,2) not null default 0.55,
  hero_primary_cta_label      text not null default 'View Calendar',
  hero_primary_cta_link       text not null default '/calendar',
  hero_secondary_cta_label    text,
  hero_secondary_cta_link     text,
  hero_featured_ride_id       uuid references rides(id) on delete set null,
  -- Single brand mark; the source project carried three community logos here.
  brand_logo_url              text,
  marquee_ride_ids            uuid[] not null default '{}',
  featured_upcoming_ride_ids  uuid[] not null default '{}',
  show_weather_widget         boolean not null default true,
  show_sponsor_showcase       boolean not null default true,
  updated_at                  timestamptz not null default now(),
  constraint homepage_singleton check (id = 1)
);

insert into homepage_content (id) values (1) on conflict do nothing;

drop trigger if exists homepage_content_updated_at on homepage_content;
create trigger homepage_content_updated_at
  before update on homepage_content
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Profiles — one row per registered rider, keyed to auth.users
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null default '',
  email           text,            -- captured at sign-up so admin can search
  phone           text,
  avatar_url      text,            -- doubles as the identity verification photo
  address         text,
  bike_model      text,
  date_of_birth   date,
  license_number  text,
  -- Collected at sign-up purely so a membership card can be issued later
  -- without asking for anything twice. Nullable: accounts created before this
  -- existed have neither, and the card request tells them what is missing.
  blood_group     text,
  emergency_name  text,
  emergency_phone text,
  -- Committee access. This is the ONLY thing the database uses to tell an
  -- admin from a rider - RLS cannot read environment variables, so a policy
  -- has no way to consult ADMIN_EMAILS. Frozen by the trigger below, so a
  -- rider cannot promote themselves.
  is_admin        boolean not null default false,
  -- Approval workflow
  member_status   text not null default 'pending'
                  check (member_status in ('pending', 'approved', 'rejected')),
  admin_notes     text,
  approved_at     timestamptz,
  rejected_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Post-dates the first release; see the note at the top of this file about
-- create-table blocks being a no-op on existing tables.
alter table profiles add column if not exists is_admin        boolean not null default false;
alter table profiles add column if not exists blood_group     text;
alter table profiles add column if not exists emergency_name  text;
alter table profiles add column if not exists emergency_phone text;

create index if not exists idx_profiles_member_status on profiles(member_status);

-- Is the caller a committee member? Used by every write policy below.
--
-- SECURITY DEFINER on purpose: it runs as the owner, so it can read profiles
-- without tripping that table's own RLS. Without it, a policy that consults
-- profiles while profiles is itself protected would recurse.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from profiles p where p.id = auth.uid()),
    false
  );
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Riders may edit their own profile row (RLS below allows it), but the approval
-- columns are not theirs to touch. Without this a pending member could PATCH
-- member_status = 'approved' straight to PostgREST with the public anon key and
-- approve themselves. Row-level security cannot express "all columns except
-- these", so the restriction is enforced here instead.
--
-- Writes that carry no PostgREST JWT (the SQL editor, psql, migrations) and
-- writes made with the service-role key are left alone - that is how the admin
-- actions approve, reject and annotate.
create or replace function public.guard_profile_approval_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  claims text := current_setting('request.jwt.claims', true);
begin
  if claims is null or claims = '' then
    return new;  -- direct database connection, not a PostgREST request
  end if;
  if (claims::jsonb ->> 'role') = 'service_role' then
    return new;  -- admin client
  end if;

  -- is_admin is the important one: without it, a rider could PATCH themselves
  -- into the committee with the public anon key and gain write access to every
  -- table on the site.
  new.is_admin      := old.is_admin;
  new.member_status := old.member_status;
  new.admin_notes   := old.admin_notes;
  new.approved_at   := old.approved_at;
  new.rejected_at   := old.rejected_at;
  new.email         := old.email;  -- authoritative copy lives in auth.users
  return new;
end;
$$;

drop trigger if exists profiles_guard_approval on profiles;
create trigger profiles_guard_approval
  before update on profiles
  for each row execute function public.guard_profile_approval_columns();

-- ---------------------------------------------------------------------------
-- Membership cards
-- ---------------------------------------------------------------------------

create table if not exists member_cards (
  id                  uuid primary key default gen_random_uuid(),
  -- Set when a signed-in rider requests a card, so it can be shown back to
  -- them on their profile. Null for applications from signed-out visitors,
  -- who have only their access_code. Deleting the account keeps the card
  -- record - it may already be printed and in a wallet.
  user_id             uuid references auth.users(id) on delete set null,
  -- Private code shown once after submission; used to check status later.
  access_code         text unique not null,
  -- Public number assigned on approval: HD-26-00001
  card_number         text unique,

  full_name           text not null,
  photo_url           text not null,
  date_of_birth       date not null,
  blood_group         text not null,
  emergency_phone     text not null,
  license_number      text not null,   -- stored, never printed on the card
  consent_accepted    boolean not null default false,

  status              text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  rejection_reason    text,
  admin_notes         text,
  resubmission_count  integer not null default 0,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  approved_at         timestamptz,
  valid_until         date
);

create index if not exists idx_member_cards_status on member_cards(status);

alter table member_cards add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_member_cards_user on member_cards(user_id);

-- One live card per account. A rejected application does not count, so a rider
-- can fix what was wrong and ask again; nulls are distinct, so signed-out
-- applicants are unconstrained.
create unique index if not exists idx_member_cards_one_per_user
  on member_cards(user_id) where user_id is not null and status <> 'rejected';

drop trigger if exists member_cards_updated_at on member_cards;
create trigger member_cards_updated_at
  before update on member_cards
  for each row execute function set_updated_at();

create table if not exists card_settings (
  id                    integer primary key default 1 check (id = 1),
  tagline               text not null default 'GRIT · BROTHERHOOD · ADVENTURE',
  disclaimer            text not null default
    'If found, please return to the original owner or contact Himalayan Drift.',
  validity_years        integer not null default 2,
  show_blood_group      boolean not null default true,
  show_dob              boolean not null default true,
  show_emergency_phone  boolean not null default true,
  benefits              jsonb not null default '[]',
  updated_at            timestamptz not null default now()
);

insert into card_settings (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Anthem (singleton)
--
-- The community anthem: one audio file plus its lyrics. Lyrics are stored as a
-- jsonb array of { t, text } - `t` is the second the line starts at, or null
-- when that line has not been synced yet. Keeping the timing beside the text
-- rather than in a parallel array means a line can never drift away from its
-- own timestamp when lines are added or reordered.
--
-- Untimed lyrics are valid and render as a static sheet, so the anthem is
-- usable the moment the words are pasted in, before anything is synced.
-- ---------------------------------------------------------------------------

create table if not exists anthem_settings (
  id          integer primary key default 1 check (id = 1),
  title       text not null default 'Our Anthem',
  audio_url   text,
  credits     text,                        -- writer, vocalist, year
  lyrics      jsonb not null default '[]', -- [{ "t": 12.4, "text": "…" }, …]
  -- Off until there is something to play. The hero shows no control while off.
  is_enabled  boolean not null default false,
  updated_at  timestamptz not null default now()
);

insert into anthem_settings (id) values (1) on conflict do nothing;

drop trigger if exists anthem_settings_updated_at on anthem_settings;
create trigger anthem_settings_updated_at
  before update on anthem_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Payment settings (singleton)
--
-- The club-wide payment details shown on every paid ride's registration form.
-- Kept as one QR image plus one free-text block on purpose: Nepali riders pay
-- by eSewa, Khalti or bank transfer, and a fixed set of columns would fit one
-- and fight the others. Any ride can override both via rides.payment_qr_url /
-- rides.payment_instructions.
-- ---------------------------------------------------------------------------

create table if not exists payment_settings (
  id                   integer primary key default 1 check (id = 1),
  qr_url               text,
  -- Free text: account name and number, eSewa ID, wallet handle, whatever the
  -- club actually uses. Rendered with line breaks preserved.
  payment_instructions text not null default '',
  -- Shown next to the fee, e.g. "NPR". Not a currency conversion feature.
  currency_label       text not null default 'NPR',
  updated_at           timestamptz not null default now()
);

insert into payment_settings (id) values (1) on conflict do nothing;

drop trigger if exists payment_settings_updated_at on payment_settings;
create trigger payment_settings_updated_at
  before update on payment_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Ride registrations
--
-- One rider signing up for one ride. Open to signed-out visitors, so this
-- follows member_cards: an access_code is issued at submission and is the only
-- way the registrant can look their status up again.
--
-- user_id is set when a signed-in rider registers, and is only ever a
-- convenience link - the name and phone captured here are the authoritative
-- record for the ride, because riders register pillions and friends too.
-- ---------------------------------------------------------------------------

create table if not exists ride_registrations (
  id                  uuid primary key default gen_random_uuid(),
  ride_id             uuid not null references rides(id) on delete cascade,
  -- Deleting the account keeps the registration: the marshal still needs the
  -- roster for a ride that already happened.
  user_id             uuid references auth.users(id) on delete set null,

  access_code         text unique not null,

  full_name           text not null,
  phone               text not null,
  email               text,
  emergency_name      text,
  emergency_phone     text,
  bike_model          text,
  -- Riders bringing someone on the back. Affects the head count, not the fee.
  pillion_count       integer not null default 0 check (pillion_count >= 0),
  notes               text,

  -- Payment. All null on a free ride.
  amount_paid         numeric(10,2),
  payment_reference   text,   -- transaction ID, if the rider quotes one
  payment_screenshot_url text,

  status              text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  rejection_reason    text,
  admin_notes         text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  approved_at         timestamptz,
  rejected_at         timestamptz
);

create index if not exists idx_ride_registrations_ride   on ride_registrations(ride_id);
create index if not exists idx_ride_registrations_status on ride_registrations(status);
create index if not exists idx_ride_registrations_user   on ride_registrations(user_id);

-- One account cannot register twice for the same ride. Guests registering
-- without an account are not constrained - user_id is null for them, and
-- Postgres treats nulls as distinct in a unique index.
create unique index if not exists idx_ride_registrations_one_per_user
  on ride_registrations(ride_id, user_id) where user_id is not null;

drop trigger if exists ride_registrations_updated_at on ride_registrations;
create trigger ride_registrations_updated_at
  before update on ride_registrations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Web push
-- ---------------------------------------------------------------------------

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,
  p256dh      text not null,   -- public key
  auth        text not null,   -- auth secret
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_created_at
  on push_subscriptions(created_at);

create table if not exists push_settings (
  id                 integer primary key default 1 check (id = 1),
  enabled            boolean not null default true,
  prompt_style       text not null default 'banner'
                     check (prompt_style in ('banner', 'modal')),
  prompt_delay_secs  integer not null default 5,
  prompt_page        text not null default 'rides'
                     check (prompt_page in ('home', 'rides', 'any')),
  updated_at         timestamptz not null default now()
);

insert into push_settings (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------------------
-- PWA settings — app name and icon, editable from the admin panel
-- ---------------------------------------------------------------------------

create table if not exists pwa_settings (
  id          integer primary key default 1 check (id = 1),
  app_name    text not null default 'Himalayan Drift',
  short_name  text not null default 'HD',
  icon_url    text,   -- Supabase Storage URL; null falls back to /icons/*
  updated_at  timestamptz not null default now()
);

insert into pwa_settings (id) values (1) on conflict do nothing;

-- =============================================================================
-- Row Level Security
--
-- Shape: the public site reads with the anon key, so public-facing tables are
-- world-readable. Writes require an authenticated session. Admin-only work
-- (approvals, settings) goes through the service-role key, which bypasses RLS
-- entirely — so those need no policy of their own.
-- =============================================================================

alter table marshals           enable row level security;
alter table series             enable row level security;
alter table sponsors           enable row level security;
alter table rides              enable row level security;
alter table ride_sponsors      enable row level security;
alter table homepage_content   enable row level security;
alter table profiles           enable row level security;
alter table member_cards       enable row level security;
alter table card_settings      enable row level security;
alter table push_subscriptions enable row level security;
alter table push_settings      enable row level security;
alter table pwa_settings       enable row level security;
alter table payment_settings   enable row level security;
alter table anthem_settings    enable row level security;
alter table ride_registrations enable row level security;

-- ── Public read ────────────────────────────────────────────────────────────
drop policy if exists "public_read_marshals"         on marshals;
drop policy if exists "public_read_series"           on series;
drop policy if exists "public_read_sponsors"         on sponsors;
drop policy if exists "public_read_rides"            on rides;
drop policy if exists "public_read_ride_sponsors"    on ride_sponsors;
drop policy if exists "public_read_homepage_content" on homepage_content;
drop policy if exists "public_read_card_settings"    on card_settings;
drop policy if exists "public_read_push_settings"    on push_settings;
drop policy if exists "public_read_pwa_settings"     on pwa_settings;
drop policy if exists "public_read_payment_settings" on payment_settings;
drop policy if exists "public_read_anthem_settings"  on anthem_settings;

create policy "public_read_marshals"         on marshals         for select using (true);
create policy "public_read_series"           on series           for select using (true);
create policy "public_read_sponsors"         on sponsors         for select using (true);
create policy "public_read_rides"            on rides            for select using (true);
create policy "public_read_ride_sponsors"    on ride_sponsors    for select using (true);
create policy "public_read_homepage_content" on homepage_content for select using (true);
create policy "public_read_card_settings"    on card_settings    for select using (true);
create policy "public_read_push_settings"    on push_settings    for select using (true);
create policy "public_read_pwa_settings"     on pwa_settings     for select using (true);
-- The registration form must render the QR and instructions to signed-out
-- visitors, so this one is public read too. Keep it free of anything private.
create policy "public_read_payment_settings" on payment_settings for select using (true);
create policy "public_read_anthem_settings"  on anthem_settings  for select using (true);

-- ── Authenticated write ────────────────────────────────────────────────────
drop policy if exists "auth_write_marshals"         on marshals;
drop policy if exists "auth_write_series"           on series;
drop policy if exists "auth_write_sponsors"         on sponsors;
drop policy if exists "auth_write_rides"            on rides;
drop policy if exists "auth_write_ride_sponsors"    on ride_sponsors;
drop policy if exists "auth_write_homepage_content" on homepage_content;
drop policy if exists "auth_write_anthem_settings"   on anthem_settings;

-- `to authenticated` is NOT enough. Any rider who signs up on the public site
-- is authenticated, holds the anon key that ships in every page, and could
-- otherwise delete every ride straight from the browser console without ever
-- visiting /admin. The middleware guards the admin PAGES; only these policies
-- guard the DATA. They must require committee membership, not merely a login.
create policy "auth_write_marshals"         on marshals         for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_series"           on series           for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_sponsors"         on sponsors         for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_rides"            on rides            for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_ride_sponsors"    on ride_sponsors    for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_homepage_content" on homepage_content for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_anthem_settings"  on anthem_settings  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- These four had public read and NO write policy at all, while their admin
-- forms write through the anon client - so every save was silently refused by
-- RLS. Adding the missing policies fixes that and gates them behind the
-- committee flag at the same time.
drop policy if exists "auth_write_card_settings"    on card_settings;
drop policy if exists "auth_write_payment_settings" on payment_settings;
drop policy if exists "auth_write_pwa_settings"     on pwa_settings;
drop policy if exists "auth_write_push_settings"    on push_settings;

create policy "auth_write_card_settings"    on card_settings    for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_payment_settings" on payment_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_pwa_settings"     on pwa_settings     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_push_settings"    on push_settings    for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Profiles: each rider sees and edits only their own row ─────────────────
-- Admin listing of all riders uses the service-role client, which bypasses RLS.
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;

create policy "profiles_select_own" on profiles for select to authenticated
  using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert to authenticated
  with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ── Membership cards ───────────────────────────────────────────────────────
-- Applications come from signed-out visitors, so anon must be able to INSERT.
-- Reads are open because status-check and QR validation are both public, and
-- the card number is the only thing needed to look one up. Approval, rejection
-- and card-number assignment run through the service role.
drop policy if exists "public_insert_member_cards" on member_cards;
drop policy if exists "public_read_member_cards"   on member_cards;

create policy "public_insert_member_cards" on member_cards for insert
  to anon, authenticated with check (true);
create policy "public_read_member_cards"   on member_cards for select
  to anon, authenticated using (true);

-- ── Ride registrations ─────────────────────────────────────────────────────
-- Anyone may register, including signed-out visitors, so anon needs INSERT.
--
-- Reads are deliberately NOT public. Unlike a membership card, which is looked
-- up by a number the holder already has, a ride roster is a list of names,
-- phone numbers and emergency contacts - open SELECT would hand the whole
-- roster to anyone with the anon key. A signed-in rider may read their own
-- rows; everything else (the admin roster, and anonymous status lookup by
-- access code) goes through the service role, which bypasses RLS.
drop policy if exists "public_insert_ride_registrations" on ride_registrations;
drop policy if exists "read_own_ride_registrations"      on ride_registrations;

create policy "public_insert_ride_registrations" on ride_registrations for insert
  to anon, authenticated with check (true);
create policy "read_own_ride_registrations"      on ride_registrations for select
  to authenticated using (auth.uid() = user_id);

-- ── Push subscriptions: write-only for the public ──────────────────────────
-- Anyone may subscribe or unsubscribe; nobody may read the endpoint list back,
-- since those are per-device identifiers. The send route uses the service role.
drop policy if exists "public_insert_push_subscriptions" on push_subscriptions;
drop policy if exists "public_delete_push_subscriptions" on push_subscriptions;

create policy "public_insert_push_subscriptions" on push_subscriptions for insert
  to anon, authenticated with check (true);
create policy "public_delete_push_subscriptions" on push_subscriptions for delete
  to anon, authenticated using (true);

-- =============================================================================
-- Bootstrapping the first admin
--
-- Write access is gated on profiles.is_admin, and nobody has it on a fresh
-- database — including you. Run this ONCE, with your own address, or the admin
-- panel will load and then refuse to save anything.
--
-- An account created through the Supabase dashboard has no profiles row at all
-- (only public sign-up creates one), so this inserts rather than updates.
-- Deliberately not run automatically: a hardcoded email does not belong in a
-- committed file, and "promote whoever exists" is not something a schema file
-- should decide on its own.
--
--   insert into profiles (id, email, full_name, is_admin, member_status)
--   select u.id,
--          u.email,
--          coalesce(u.raw_user_meta_data->>'full_name', ''),
--          true,
--          'approved'
--     from auth.users u
--    where lower(u.email) = lower('YOU@EXAMPLE.COM')
--   on conflict (id) do update
--      set is_admin = true,
--          member_status = 'approved';
--
-- To add a committee member later, do the same with their address, or flip
-- is_admin on their existing row once they have signed up.
-- =============================================================================

-- =============================================================================
-- Next: run storage-policies.sql to create the storage buckets.
-- =============================================================================
