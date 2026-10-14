-- =====================================================================
-- WatchParty Club — share the wheel's result with the whole club
-- Run this in Supabase → SQL Editor → New query → Run (once).
--
-- Every spin is saved here. Everyone in the club sees the latest one live
-- on the Tonight page ("Priya spun the wheel → Dune").
-- =====================================================================

create table if not exists public.club_spins (
  id          bigint generated always as identity primary key,
  club_id     uuid not null references public.clubs (id) on delete cascade,
  title_id    text not null,
  title_name  text not null,
  spun_by     uuid default auth.uid() references auth.users (id) on delete set null,
  spun_at     timestamptz not null default now()
);
create index if not exists club_spins_latest on public.club_spins (club_id, spun_at desc);

alter table public.club_spins enable row level security;

-- Members see their club's spins, and can add their own
create policy "members see spins" on public.club_spins
  for select using (public.is_club_member(club_id));
create policy "members spin" on public.club_spins
  for insert with check (public.is_club_member(club_id) and spun_by = auth.uid());

-- Live updates, so friends see a new spin straight away
alter publication supabase_realtime add table public.club_spins;
