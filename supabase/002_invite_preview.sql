-- =====================================================================
-- WatchParty Club — invite preview
-- Paste into Supabase → SQL Editor → New snippet → Run (after schema.sql).
--
-- Lets someone holding an invite code see WHO invited them to WHICH club
-- before joining — just the club's name, the host's name and how many
-- members it has. Without the secret code it reveals nothing.
-- =====================================================================

create or replace function public.club_preview(code text)
returns table (club_name text, host_name text, member_count int)
language sql stable security definer set search_path = public as $$
  select
    c.name,
    (select p.name
       from club_members m join profiles p on p.id = m.user_id
      where m.club_id = c.id and m.role = 'host'
      limit 1),
    (select count(*)::int from club_members m where m.club_id = c.id)
  from clubs c
  where c.invite_code = lower(trim(code));
$$;

-- Callable before signing in (the invite screen shows it first)
grant execute on function public.club_preview(text) to anon, authenticated;
