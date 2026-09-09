-- Anonieme bezoekersstatistieken voor de marketingsite (sayingyes.nl).
-- Geen cookies en geen IP-adressen: alleen pad, verwijzer, land, apparaattype en
-- een dagelijks wisselende hash om unieke bezoekers per dag te tellen.
-- Rijen ouder dan 90 dagen worden door de dagelijkse cron verwijderd.
-- Run this in the Supabase SQL editor.

create table if not exists page_views (
  id bigint generated always as identity primary key,
  path text not null,
  referrer_host text,
  country text,
  device text,
  visitor_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on page_views(created_at desc);

alter table page_views enable row level security;

-- Alleen de service role (API-route en cron) schrijft en leest; geen anon-toegang.
create policy "No anon access" on page_views
  for all
  using (false);
