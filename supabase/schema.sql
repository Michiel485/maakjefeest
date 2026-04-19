-- maakjefeest.nl database schema
-- Run this in the Supabase SQL editor

-- Events table
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  slug text not null unique,
  type text not null check (type in ('bruiloft', 'verjaardag', 'evenement')),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  stripe_payment_id text,
  created_at timestamptz not null default now()
);

-- Pages table
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  type text not null check (type in ('home', 'programma', 'rsvp', 'praktisch', 'wishlist', 'fotos')),
  title text not null,
  content jsonb not null default '{}',
  is_enabled boolean not null default true,
  "order" integer not null default 0
);

-- RSVP table
create table if not exists rsvp (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text not null,
  attending text not null check (attending in ('yes', 'no', 'maybe')),
  message text,
  created_at timestamptz not null default now()
);

-- Magic links table
create table if not exists magic_links (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false
);

-- Indexes
create index if not exists events_user_email_idx on events(user_email);
create index if not exists events_slug_idx on events(slug);
create index if not exists pages_event_id_idx on pages(event_id);
create index if not exists rsvp_event_id_idx on rsvp(event_id);
create index if not exists magic_links_token_idx on magic_links(token);
create index if not exists magic_links_email_idx on magic_links(email);

-- Row Level Security
alter table events enable row level security;
alter table pages enable row level security;
alter table rsvp enable row level security;
alter table magic_links enable row level security;

-- RLS policies: events
-- Owner can do everything (identified by email claim in JWT)
create policy "Owner full access" on events
  for all
  using (user_email = auth.jwt() ->> 'email')
  with check (user_email = auth.jwt() ->> 'email');

-- Published events are publicly readable
create policy "Public read published events" on events
  for select
  using (status = 'published');

-- RLS policies: pages
-- Owner can do everything via event ownership
create policy "Owner full access" on pages
  for all
  using (
    exists (
      select 1 from events
      where events.id = pages.event_id
        and events.user_email = auth.jwt() ->> 'email'
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = pages.event_id
        and events.user_email = auth.jwt() ->> 'email'
    )
  );

-- Pages of published events are publicly readable
create policy "Public read pages of published events" on pages
  for select
  using (
    exists (
      select 1 from events
      where events.id = pages.event_id
        and events.status = 'published'
    )
  );

-- RLS policies: rsvp
-- Anyone can insert an RSVP for a published event
create policy "Public insert rsvp" on rsvp
  for insert
  with check (
    exists (
      select 1 from events
      where events.id = rsvp.event_id
        and events.status = 'published'
    )
  );

-- Owner can read all RSVPs for their events
create policy "Owner read rsvp" on rsvp
  for select
  using (
    exists (
      select 1 from events
      where events.id = rsvp.event_id
        and events.user_email = auth.jwt() ->> 'email'
    )
  );

-- RLS policies: magic_links
-- Only service role (backend) can manage magic links — no anon access
create policy "No anon access" on magic_links
  for all
  using (false);
