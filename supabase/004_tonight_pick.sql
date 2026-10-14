-- =====================================================================
-- WatchParty Club — send the wheel's result to the people watching
-- Run this in Supabase → SQL Editor → New query → Run.
-- Safe to run again (also if you ran an earlier version of this file).
--
-- Every spin is saved with WHO IS WATCHING (the people ticked under
-- "Who's watching tonight?"). Only they — and whoever spun — can see it,
-- live: "Tonight's pick for you, Priya & Akshaya: Dune".
-- Others in the club don't see it at all.
-- =====================================================================

create table if not exists public.club_spins (
  id          bigint generated always as identity primary key,
  club_id     uuid not null references public.clubs (id) on delete cascade,
  title_id    text not null,
  title_name  text not null,
  watchers    uuid[] not null default '{}',
  spun_by     uuid default auth.uid() references auth.users (id) on delete set null,
  spun_at     timestamptz not null default now()
);
-- (For an earlier version of this table without "watchers")
alter table public.club_spins add column if not exists watchers uuid[] not null default '{}';
create index if not exists club_spins_latest on public.club_spins (club_id, spun_at desc);

alter table public.club_spins enable row level security;

-- Only the spinner and the people watching see a spin
drop policy if exists "members see spins" on public.club_spins;
drop policy if exists "watchers see spins" on public.club_spins;
create policy "watchers see spins" on public.club_spins
  for select using (
    public.is_club_member(club_id) and (spun_by = auth.uid() or auth.uid() = any (watchers))
  );

-- You can spin in your own clubs, for people in that club
drop policy if exists "members spin" on public.club_spins;
create policy "members spin" on public.club_spins
  for insert with check (
    public.is_club_member(club_id)
    and spun_by = auth.uid()
    and not exists (
      select 1 from unnest(watchers) w
      where not exists (select 1 from public.club_members m where m.club_id = club_spins.club_id and m.user_id = w)
    )
  );

-- Live updates, so the people watching get the result straight away
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'club_spins'
  ) then
    alter publication supabase_realtime add table public.club_spins;
  end if;
end $$;
