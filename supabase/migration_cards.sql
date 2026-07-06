-- Digitale kaarten: Save the Date en trouwkaarten met deelbare link
-- (envelop-animatie voor gasten, beheer in het dashboard).
-- Run this in the Supabase SQL editor.

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  type text not null check (type in ('save_the_date', 'trouwkaart')),
  template text not null default 'klassiek' check (template in ('klassiek', 'foto')),
  share_token text not null unique,
  content jsonb not null default '{}',
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists cards_event_id_idx on cards(event_id);
create index if not exists cards_share_token_idx on cards(share_token);

alter table cards enable row level security;

-- Alle toegang loopt via API-routes met de service role (die RLS omzeilt);
-- zelfde patroon als guest_photos en magic_links.
create policy "No anon access" on cards
  for all
  using (false);

-- Atomische kijkteller voor de gastenpagina
create or replace function increment_card_views(card_token text)
returns void
language sql
security definer
as $$
  update cards set view_count = view_count + 1 where share_token = card_token;
$$;
