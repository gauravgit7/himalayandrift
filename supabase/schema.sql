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

  -- A flat amount off the list fee, for everyone. Kept separate from the fee
  -- itself so the page can honestly show "was 10,000, now 8,000" - one edited
  -- number loses the fact that there is a discount at all.
  registration_discount  numeric(10,2),
  -- Rider classes with their own price: members, veterans, marshals riding
  -- along rather than leading. Shape:
  --   [{ id, label, note, price, requiresMemberCard }]
  -- Empty means one price for everybody and the form asks nothing.
  --
  -- jsonb rather than a table on purpose: these are only ever read as a whole
  -- set alongside their ride, never queried across rides, and a ride's price
  -- list is part of that ride's own record.
  registration_tiers     jsonb not null default '[]',
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

-- Tiered ride pricing post-dates the first release. `create table if not
-- exists` is a no-op on a table that already exists, so the block above only
-- reaches brand-new databases; these reach the rest.
alter table rides add column if not exists registration_discount numeric(10,2);
alter table rides add column if not exists registration_tiers jsonb not null default '[]';

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

-- How the card came to belong to that account. A card applied for while signed
-- out has no user_id at all; when the same person signs up later, the identity
-- matcher claims it for them. Recording the score and the source is what makes
-- an automatic decision reviewable — an admin looking at a linked card can see
-- whether a person or an algorithm decided it, and on what evidence.
--   'self'  — the rider was signed in when they asked for it; nothing inferred
--   'auto'  — matched to an existing application at sign-up or profile save
--   'admin' — linked by hand from the members admin
alter table member_cards add column if not exists linked_by text
  check (linked_by is null or linked_by in ('self', 'auto', 'admin'));
alter table member_cards add column if not exists linked_at timestamptz;
-- 0-1 confidence from the match, null for 'self' and usually for 'admin'.
alter table member_cards add column if not exists link_score numeric;

-- Finding orphans is the common query in the merge tool.
create index if not exists idx_member_cards_unlinked
  on member_cards(created_at desc) where user_id is null;

-- One live card per account. A rejected application does not count, so a rider
-- can fix what was wrong and ask again; nulls are distinct, so signed-out
-- applicants are unconstrained.
create unique index if not exists idx_member_cards_one_per_user
  on member_cards(user_id) where user_id is not null and status <> 'rejected';

drop trigger if exists member_cards_updated_at on member_cards;
create trigger member_cards_updated_at
  before update on member_cards
  for each row execute function set_updated_at();

-- Applications have to be insertable by signed-out visitors, so the RLS policy
-- below is `with check (true)` and cannot be anything else. That policy says
-- nothing about the VALUES, though: without this trigger, anyone holding the
-- public anon key could POST a row with status 'approved', a card number of
-- their choosing, and a user_id pointing at somebody else's account - printing
-- themselves a membership card and attaching it to a stranger.
--
-- So the workflow columns are not the applicant's to set. Same shape as the
-- profiles guard above: direct database connections and the service-role key
-- are left alone, because those are how the committee actually approves.
create or replace function public.guard_member_card_submission()
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
    return new;  -- admin client: submit, approve, reject, link
  end if;

  -- A card belongs to the account that asked for it, and to no other. Anon
  -- applicants get null, which is what makes them claimable later.
  new.user_id            := auth.uid();
  new.linked_by          := case when auth.uid() is null then null else 'self' end;
  new.linked_at          := case when auth.uid() is null then null else now() end;
  new.link_score         := null;

  new.status             := 'pending';
  new.card_number        := null;
  new.approved_at        := null;
  new.valid_until        := null;
  new.rejection_reason   := null;
  new.admin_notes        := null;
  new.resubmission_count := 0;
  return new;
end;
$$;

drop trigger if exists member_cards_guard_submission on member_cards;
create trigger member_cards_guard_submission
  before insert on member_cards
  for each row execute function public.guard_member_card_submission();

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
-- Anthem tracks — the song library
--
-- The anthem started as one song in a singleton row, which is the right shape
-- for exactly one song and the wrong shape for two. Tracks live here now;
-- anthem_settings keeps only is_enabled, the master switch for whether the
-- player appears on the site at all.
--
-- Exactly one track is the anthem. It sorts first and is what plays when the
-- player starts; the rest follow it in sort_order, so prev/next walks the
-- club's own record collection rather than a single track on repeat.
-- ---------------------------------------------------------------------------

create table if not exists anthem_tracks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  audio_url   text not null,
  credits     text,                        -- writer, vocalist, year
  -- Same shape as the old anthem_settings.lyrics: [{ "t": 12.4, "text": "…" }]
  -- Untimed lines (t null) are valid and render as a static sheet.
  lyrics      jsonb not null default '[]',
  cover_url   text,
  -- The one that plays first. Enforced as at-most-one by the partial index.
  is_anthem   boolean not null default false,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_anthem_tracks_order
  on anthem_tracks(is_active, sort_order, created_at);

-- One anthem, not several. A club with two anthems has none.
create unique index if not exists idx_anthem_tracks_single_anthem
  on anthem_tracks(is_anthem) where is_anthem;

drop trigger if exists anthem_tracks_updated_at on anthem_tracks;
create trigger anthem_tracks_updated_at
  before update on anthem_tracks
  for each row execute function set_updated_at();

-- Carry the existing single anthem across on first run. Guarded on the table
-- being empty so re-running this file never duplicates it, and on there being
-- an audio file so an untouched install does not gain a silent track.
do $$
begin
  if not exists (select 1 from anthem_tracks) then
    insert into anthem_tracks (title, audio_url, credits, lyrics, is_anthem, sort_order)
    select coalesce(nullif(s.title, ''), 'Our Anthem'), s.audio_url, s.credits,
           s.lyrics, true, 0
    from anthem_settings s
    where s.id = 1 and s.audio_url is not null and s.audio_url <> '';
  end if;
end $$;

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
  -- A reusable set of rider classes, so a new ride does not need "HD Member /
  -- Veteran / Marshal riding along" retyped from scratch. The ride form copies
  -- these in; the ride then owns its own copy, so editing the defaults never
  -- silently reprices a ride whose sign-ups are already open.
  default_tiers        jsonb not null default '[]',
  updated_at           timestamptz not null default now()
);

insert into payment_settings (id) values (1) on conflict do nothing;

alter table payment_settings add column if not exists default_tiers jsonb not null default '[]';

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

  -- Which rider class was claimed, and what it cost. The label is copied
  -- rather than referenced: a ride's price list can be edited after sign-ups
  -- open, and the roster has to keep saying what was actually owed.
  --
  -- tier_verified is true only where the system could CHECK the claim - today
  -- that means an approved membership card on the rider's own account. An
  -- unverifiable claim is still recorded; it is flagged for the committee
  -- rather than quietly trusted.
  tier_id             text,
  tier_label          text,
  tier_verified       boolean not null default false,

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

alter table ride_registrations add column if not exists tier_id text;
alter table ride_registrations add column if not exists tier_label text;
alter table ride_registrations add column if not exists tier_verified boolean not null default false;

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
-- Shop — merch
--
-- Three tables, because a T-shirt is not one thing:
--
--   products          the item, its price, its photos, its story
--   product_variants  the sizes, each with its OWN stock count
--   shop_orders       who wants what, and whether they have paid
--
-- Stock lives on the variant, not the product, and that is the whole reason
-- variants exist. "12 in stock" across S/M/L/XL is not a fact anyone can act
-- on: it oversells the popular sizes and leaves the rest on the shelf. A
-- product with no variants is a one-size item and carries its own stock.
--
-- The order flow deliberately mirrors ride registration, because riders have
-- already learnt it: submit, pay by QR, upload the screenshot, get a code to
-- check the status with. Nothing here talks to a payment gateway.
-- ---------------------------------------------------------------------------

create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  short_description text,
  description       text,
  category          text not null default 'Merch',
  -- The list price. What a rider pays is this minus discount_percent.
  price             numeric(10,2) not null default 0,
  -- 0-90. Kept as a percentage rather than a second price so the "was/now"
  -- pair on the card can never contradict itself.
  discount_percent  integer not null default 0
                    check (discount_percent >= 0 and discount_percent <= 90),
  -- First image is the card thumbnail; the rest are the gallery.
  image_urls        text[] not null default '{}',
  -- Stock for products with no variants. Null means "not tracked" - a made to
  -- order patch never runs out. Ignored entirely when variants exist.
  stock             integer,
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_products_active on products(is_active, sort_order);

drop trigger if exists products_updated_at on products;
create trigger products_updated_at
  before update on products
  for each row execute function set_updated_at();

create table if not exists product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  -- "S", "M", "XL", "42", "Black" - free text, because a club selling shirts
  -- one year and mugs the next should not need a migration to do it.
  label       text not null,
  -- Added to the product price. A 3XL costing a little more is normal; a
  -- separate absolute price per size is a way to get them out of step.
  price_delta numeric(10,2) not null default 0,
  stock       integer not null default 0 check (stock >= 0),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (product_id, label)
);

create index if not exists idx_product_variants_product
  on product_variants(product_id, sort_order);

create table if not exists shop_settings (
  id             integer primary key default 1 check (id = 1),
  is_enabled     boolean not null default false,
  -- Shown at the top of /shop: a delivery note, a pickup address, a warning
  -- that nothing ships during monsoon. Free text on purpose.
  announcement   text not null default '',
  delivery_note  text not null default '',
  updated_at     timestamptz not null default now()
);

insert into shop_settings (id) values (1) on conflict do nothing;

drop trigger if exists shop_settings_updated_at on shop_settings;
create trigger shop_settings_updated_at
  before update on shop_settings
  for each row execute function set_updated_at();

create table if not exists shop_orders (
  id                     uuid primary key default gen_random_uuid(),
  -- Deleting the account keeps the order: it may already be packed.
  user_id                uuid references auth.users(id) on delete set null,
  -- The only way a signed-out buyer can look their order up again.
  access_code            text unique not null,

  full_name              text not null,
  phone                  text not null,
  email                  text,
  delivery_address       text,
  notes                  text,

  -- Totals are frozen at submission. Re-deriving them later from products that
  -- have since changed price would quietly rewrite what somebody agreed to pay.
  subtotal               numeric(10,2) not null default 0,
  discount_total         numeric(10,2) not null default 0,
  total                  numeric(10,2) not null default 0,

  payment_reference      text,
  payment_screenshot_url text,

  status                 text not null default 'pending'
                         check (status in ('pending', 'approved', 'fulfilled', 'rejected')),
  rejection_reason       text,
  admin_notes            text,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  approved_at            timestamptz,
  fulfilled_at           timestamptz
);

create index if not exists idx_shop_orders_status on shop_orders(status, created_at desc);
create index if not exists idx_shop_orders_user   on shop_orders(user_id);

drop trigger if exists shop_orders_updated_at on shop_orders;
create trigger shop_orders_updated_at
  before update on shop_orders
  for each row execute function set_updated_at();

create table if not exists shop_order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references shop_orders(id) on delete cascade,
  -- Nulled rather than cascaded: an order for a product that has since been
  -- deleted is still an order somebody placed, and the name below preserves
  -- what it was for.
  product_id      uuid references products(id) on delete set null,
  variant_id      uuid references product_variants(id) on delete set null,
  -- Copied at submission, for the same reason the totals are.
  product_name    text not null,
  variant_label   text,
  unit_price      numeric(10,2) not null,
  quantity        integer not null check (quantity > 0),
  line_total      numeric(10,2) not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_shop_order_items_order on shop_order_items(order_id);

-- An order arrives from a signed-out visitor, so its RLS insert policy has to
-- be `with check (true)`. Same problem as membership cards, same answer: the
-- columns that decide money and status are not the buyer's to set.
create or replace function public.guard_shop_order_submission()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  claims text := current_setting('request.jwt.claims', true);
begin
  if claims is null or claims = '' then return new; end if;
  if (claims::jsonb ->> 'role') = 'service_role' then return new; end if;

  new.user_id          := auth.uid();
  new.status           := 'pending';
  new.rejection_reason := null;
  new.admin_notes      := null;
  new.approved_at      := null;
  new.fulfilled_at     := null;
  -- Totals are computed server-side from live prices by the submit action,
  -- which runs as service_role and so never reaches this branch. A direct
  -- PostgREST insert gets zeroes rather than a total of its own choosing.
  new.subtotal         := 0;
  new.discount_total   := 0;
  new.total            := 0;
  return new;
end;
$$;

drop trigger if exists shop_orders_guard_submission on shop_orders;
create trigger shop_orders_guard_submission
  before insert on shop_orders
  for each row execute function public.guard_shop_order_submission();


-- ---------------------------------------------------------------------------
-- Membership programme — tiers and loyalty points
--
-- Two switches, not one. Tiers price rides; points reward taking part. Either
-- is useful without the other: points with tiers off simply means everybody
-- earns at 1x, and tiers with points off is a discount scheme.
-- ---------------------------------------------------------------------------

create table if not exists membership_settings (
  id               integer primary key default 1 check (id = 1),
  -- Off means one price for everybody and no tier badge anywhere.
  tiers_enabled    boolean not null default false,
  -- Off means no points are awarded and none are shown.
  loyalty_enabled  boolean not null default false,
  -- What the club calls them. "points", "drift miles", whatever.
  points_label     text not null default 'points',
  updated_at       timestamptz not null default now()
);

insert into membership_settings (id) values (1) on conflict do nothing;

drop trigger if exists membership_settings_updated_at on membership_settings;
create trigger membership_settings_updated_at
  before update on membership_settings
  for each row execute function set_updated_at();

-- A tier is ASSIGNED by the committee, never computed. There is deliberately no
-- engine that promotes people: who counts as a veteran is a judgement about a
-- person, and pretending a rule can make it turns a compliment into a formula.
create table if not exists membership_tiers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  description       text,
  -- Percentage off ride registration. A percentage rather than a price per
  -- ride: one number to maintain on the tier instead of every tier priced by
  -- hand on every ride.
  discount_percent  integer not null default 0
                    check (discount_percent >= 0 and discount_percent <= 90),
  -- Multiplier on points earned. numeric, so 1.5x is expressible - the useful
  -- range in a real programme is 1 to 2, not 5.
  reward_factor     numeric(4,2) not null default 1 check (reward_factor >= 0),
  -- Hex, for the badge. Falls back to the ember accent when unset.
  colour            text,
  -- Where a new member lands. Exactly one, enforced below.
  is_default        boolean not null default false,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists idx_membership_tiers_one_default
  on membership_tiers(is_default) where is_default;

create index if not exists idx_membership_tiers_order
  on membership_tiers(is_active, sort_order);

drop trigger if exists membership_tiers_updated_at on membership_tiers;
create trigger membership_tiers_updated_at
  before update on membership_tiers
  for each row execute function set_updated_at();

-- Deleting a tier leaves its members without one rather than deleting them;
-- they fall back to the default tier at read time.
alter table profiles add column if not exists tier_id uuid
  references membership_tiers(id) on delete set null;

create index if not exists idx_profiles_tier on profiles(tier_id);

-- ---------------------------------------------------------------------------
-- Loyalty ledger
--
-- Append-only, and every row is SIGNED: positive to earn, negative to spend.
-- A balance is sum(points) and is never stored anywhere, because a stored
-- counter can only ever drift and cannot answer "where did my 3,400 come
-- from". Vouchers, when they arrive, write negative rows here and need no
-- schema change at all.
--
-- base_points and factor are recorded alongside the total on purpose. Promoting
-- a rider from 1x to 2x must NOT rewrite what they earned as a member last
-- season, and keeping both makes each row explain itself.
-- ---------------------------------------------------------------------------

create table if not exists loyalty_ledger (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  points       integer not null,
  base_points  integer not null default 0,
  factor       numeric(4,2) not null default 1,
  -- Shown to the rider in their history, so write it for them, not for a log.
  reason       text not null,
  source_type  text not null
               check (source_type in ('ride', 'order', 'manual', 'voucher')),
  source_id    uuid,
  created_at   timestamptz not null default now()
);

create index if not exists idx_loyalty_ledger_user
  on loyalty_ledger(user_id, created_at desc);

-- One award per thing. Approving a registration, un-approving it and approving
-- it again must not pay three times. Reversals are negative rows, which this
-- index deliberately does not constrain.
create unique index if not exists idx_loyalty_ledger_once
  on loyalty_ledger(source_type, source_id, user_id)
  where source_id is not null and points > 0;

-- Points on the things that award them. 0 means this ride or product earns
-- nothing, which is the sane default for everything that already exists.
alter table rides    add column if not exists loyalty_points integer not null default 0;
alter table products add column if not exists loyalty_points integer not null default 0;

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
alter table anthem_tracks      enable row level security;
alter table products           enable row level security;
alter table product_variants   enable row level security;
alter table shop_settings      enable row level security;
alter table shop_orders        enable row level security;
alter table shop_order_items   enable row level security;
alter table membership_settings enable row level security;
alter table membership_tiers    enable row level security;
alter table loyalty_ledger      enable row level security;
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
drop policy if exists "public_read_anthem_tracks"    on anthem_tracks;

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
create policy "public_read_anthem_tracks"    on anthem_tracks    for select using (true);
-- The shop window is public; the orders behind it are not (see below).
drop policy if exists "public_read_products"         on products;
drop policy if exists "public_read_product_variants" on product_variants;
drop policy if exists "public_read_shop_settings"    on shop_settings;
create policy "public_read_products"         on products         for select using (true);
create policy "public_read_product_variants" on product_variants for select using (true);
create policy "public_read_shop_settings"    on shop_settings    for select using (true);
-- Tiers and the switches are public: a rider has to be able to see what tier
-- they are on and what it is worth. The LEDGER is not - see below.
drop policy if exists "public_read_membership_settings" on membership_settings;
drop policy if exists "public_read_membership_tiers"    on membership_tiers;
create policy "public_read_membership_settings" on membership_settings for select using (true);
create policy "public_read_membership_tiers"    on membership_tiers    for select using (true);

-- ── Authenticated write ────────────────────────────────────────────────────
drop policy if exists "auth_write_marshals"         on marshals;
drop policy if exists "auth_write_series"           on series;
drop policy if exists "auth_write_sponsors"         on sponsors;
drop policy if exists "auth_write_rides"            on rides;
drop policy if exists "auth_write_ride_sponsors"    on ride_sponsors;
drop policy if exists "auth_write_homepage_content" on homepage_content;
drop policy if exists "auth_write_anthem_settings"   on anthem_settings;
drop policy if exists "auth_write_anthem_tracks"     on anthem_tracks;

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
create policy "auth_write_anthem_tracks"    on anthem_tracks    for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "auth_write_products"         on products;
drop policy if exists "auth_write_product_variants" on product_variants;
drop policy if exists "auth_write_shop_settings"    on shop_settings;
create policy "auth_write_products"         on products         for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_product_variants" on product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_shop_settings"    on shop_settings    for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "auth_write_membership_settings" on membership_settings;
drop policy if exists "auth_write_membership_tiers"    on membership_tiers;
create policy "auth_write_membership_settings" on membership_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "auth_write_membership_tiers"    on membership_tiers    for all to authenticated using (public.is_admin()) with check (public.is_admin());

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
--
-- `with check (true)` is as narrow as an anonymous application can be. What
-- keeps it honest is the BEFORE INSERT trigger above, which overwrites every
-- workflow column on a submission that did not come from the service role.
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

-- ── Shop orders ─────────────────────────────────────────────
-- Read is deliberately NOT public: an order carries a name, a phone number
-- and a delivery address. A buyer looks theirs up by access code through the
-- service role, exactly as a ride registration is looked up.
drop policy if exists "public_insert_shop_orders"      on shop_orders;
drop policy if exists "read_own_shop_orders"           on shop_orders;
drop policy if exists "public_insert_shop_order_items" on shop_order_items;

create policy "public_insert_shop_orders"      on shop_orders      for insert
  to anon, authenticated with check (true);
create policy "read_own_shop_orders"           on shop_orders      for select
  to authenticated using (auth.uid() = user_id);
create policy "public_insert_shop_order_items" on shop_order_items for insert
  to anon, authenticated with check (true);

-- ── Loyalty ledger ─────────────────────────────────────────────
-- Read your own rows and nothing else. There is deliberately NO insert policy:
-- points are awarded by the service role on approval, and a table anyone can
-- write to is a table anyone can pay themselves from.
drop policy if exists "read_own_loyalty_ledger" on loyalty_ledger;
create policy "read_own_loyalty_ledger" on loyalty_ledger for select
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
