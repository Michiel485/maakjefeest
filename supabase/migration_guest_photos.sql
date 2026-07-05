-- Gastenfotomuur: gasten uploaden foto's via een QR-code, het bruidspaar
-- krijgt een live fotomuur + slideshow op de trouwsite.
-- Run this in the Supabase SQL editor.

-- Feature-instellingen per event
alter table events add column if not exists guest_photos_enabled boolean not null default false;
alter table events add column if not exists guest_photos_moderation text not null default 'live';

-- Check constraint apart, zodat 'add column if not exists' idempotent blijft
do $$ begin
  alter table events add constraint events_guest_photos_moderation_check
    check (guest_photos_moderation in ('live', 'approve'));
exception when duplicate_object then null; end $$;

-- Foto's geüpload door gasten
create table if not exists guest_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  caption text,
  storage_path text not null,
  url text not null,
  status text not null default 'approved' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

create index if not exists guest_photos_event_status_idx
  on guest_photos(event_id, status, created_at desc);

alter table guest_photos enable row level security;

-- Alle toegang loopt via API-routes met de service role (die RLS omzeilt);
-- directe anon-toegang is niet nodig — zelfde patroon als magic_links.
create policy "No anon access" on guest_photos
  for all
  using (false);

-- Storage: de bucket 'guest-photos' (public read) wordt automatisch aangemaakt
-- bij de eerste upload. Handmatig kan ook: Storage → New bucket → 'guest-photos',
-- met "Public bucket" aangevinkt.
