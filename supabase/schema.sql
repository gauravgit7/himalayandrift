-- =============================================================================
-- TVS Nepal Ride Operations Platform - Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM types
-- ---------------------------------------------------------------------------

create type community_type as enum ('AOG', 'CULT', 'AOGxCULT');
create type ride_type as enum ('chapter', 'cult', 'overnight', 'marquee');
create type ride_status as enum ('planned', 'tentative', 'confirmed', 'postponed', 'cancelled', 'completed');
create type ride_priority as enum ('local', 'chapter', 'national', 'marquee');
create type chapter_name as enum (
  'Bagmati', 'Narayani', 'Gandaki', 'Lumbini',
  'Rapti', 'Bheri', 'Mahakali', 'Koshi', 'Mechi'
);
create type sponsor_tier as enum ('title', 'co', 'associate', 'media');
create type recurring_frequency as enum ('weekly', 'biweekly', 'monthly', 'quarterly');

-- ---------------------------------------------------------------------------
-- Marshals / Lead Riders
-- ---------------------------------------------------------------------------

create table marshals (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  avatar_url  text,
  chapter     chapter_name not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Chapters
-- ---------------------------------------------------------------------------

create table chapters (
  id              uuid primary key default gen_random_uuid(),
  name            chapter_name not null unique,
  region          text not null,
  description     text,
  cover_image_url text,
  member_count    integer not null default 0,
  marshal_id      uuid references marshals(id) on delete set null,
  is_active       boolean not null default true,
  is_priority     boolean not null default false,
  coordinates     jsonb,   -- {"lng": 85.32, "lat": 27.72}
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Priority chapters
update chapters set is_priority = true
where name in ('Bagmati', 'Gandaki', 'Narayani', 'Lumbini');

-- ---------------------------------------------------------------------------
-- Sponsors
-- ---------------------------------------------------------------------------

create table sponsors (
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

create table rides (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  slug                text not null unique,
  community           community_type not null,
  ride_type           ride_type not null,
  chapter             chapter_name not null,
  start_date          date not null,
  end_date            date not null,
  status              ride_status not null default 'planned',
  priority            ride_priority not null default 'local',
  description         text,
  short_description   text,
  banner_image_url    text,
  expected_riders     integer not null default 0,
  registration_link   text,
  route_data          jsonb,     -- RouteData object
  itinerary           jsonb,     -- ItineraryDay[]
  marshal_id          uuid references marshals(id) on delete set null,
  tags                text[] not null default '{}',
  is_featured         boolean not null default false,
  is_recurring        boolean not null default false,
  recurring_pattern   jsonb,     -- RecurringPattern object
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint end_after_start check (end_date >= start_date)
);

create index idx_rides_start_date  on rides(start_date);
create index idx_rides_community   on rides(community);
create index idx_rides_chapter     on rides(chapter);
create index idx_rides_status      on rides(status);
create index idx_rides_is_featured on rides(is_featured);

-- ---------------------------------------------------------------------------
-- Ride ↔ Sponsor (many-to-many)
-- ---------------------------------------------------------------------------

create table ride_sponsors (
  ride_id     uuid not null references rides(id) on delete cascade,
  sponsor_id  uuid not null references sponsors(id) on delete cascade,
  primary key (ride_id, sponsor_id)
);

-- ---------------------------------------------------------------------------
-- Homepage Content (singleton row - one record, id = 1)
-- ---------------------------------------------------------------------------

create table homepage_content (
  id                          integer primary key default 1,
  hero_title                  text not null default 'Ride Nepal. Together.',
  hero_subtitle               text not null default 'Annual ride operations for AOG & CULT communities',
  hero_background_image_url   text,
  hero_overlay_opacity        numeric(3,2) not null default 0.55,
  hero_primary_cta_label      text not null default 'View Calendar',
  hero_primary_cta_link       text not null default '/calendar',
  hero_secondary_cta_label    text,
  hero_secondary_cta_link     text,
  hero_featured_ride_id       uuid references rides(id) on delete set null,
  marquee_ride_ids            uuid[] not null default '{}',
  featured_upcoming_ride_ids  uuid[] not null default '{}',
  show_weather_widget         boolean not null default true,
  show_sponsor_showcase       boolean not null default true,
  updated_at                  timestamptz not null default now(),
  constraint singleton check (id = 1)
);

-- Insert default homepage content
insert into homepage_content (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Auto-update updated_at
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger rides_updated_at
  before update on rides
  for each row execute function set_updated_at();

create trigger chapters_updated_at
  before update on chapters
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------

-- Enable RLS on all tables
alter table rides           enable row level security;
alter table chapters        enable row level security;
alter table sponsors        enable row level security;
alter table marshals        enable row level security;
alter table ride_sponsors   enable row level security;
alter table homepage_content enable row level security;

-- Public can read everything (no auth needed for public-facing pages)
create policy "Public read rides"            on rides            for select using (true);
create policy "Public read chapters"         on chapters         for select using (true);
create policy "Public read sponsors"         on sponsors         for select using (true);
create policy "Public read marshals"         on marshals         for select using (true);
create policy "Public read ride_sponsors"    on ride_sponsors    for select using (true);
create policy "Public read homepage_content" on homepage_content for select using (true);

-- Only authenticated users (superadmin) can write
create policy "Auth write rides"            on rides            for all using (auth.role() = 'authenticated');
create policy "Auth write chapters"         on chapters         for all using (auth.role() = 'authenticated');
create policy "Auth write sponsors"         on sponsors         for all using (auth.role() = 'authenticated');
create policy "Auth write marshals"         on marshals         for all using (auth.role() = 'authenticated');
create policy "Auth write ride_sponsors"    on ride_sponsors    for all using (auth.role() = 'authenticated');
create policy "Auth write homepage_content" on homepage_content for all using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Storage Buckets (run separately in Supabase Storage settings)
-- ---------------------------------------------------------------------------
-- Create these buckets manually in Supabase Dashboard → Storage:
--   ride-banners    (public)
--   hero-banners    (public)
--   sponsor-logos   (public)
--   rider-avatars   (public)
--   ride-documents  (public)
