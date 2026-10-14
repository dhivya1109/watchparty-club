-- =====================================================================
-- WatchParty Club — the Admin page
-- Run this in Supabase → SQL Editor → New query → Run (once).
--
-- Who is an admin lives in the "admins" table. The app can't read or change
-- that table; only you can, here in the SQL Editor. Every admin action below
-- is a database function that checks the list first — so hiding the Admin
-- button isn't the only protection: the database itself refuses non-admins.
-- =====================================================================

create table if not exists public.admins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  added_at  timestamptz not null default now()
);
alter table public.admins enable row level security;
-- (No rules on purpose: nobody can read or write "admins" from the app.)

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Stops the action unless the caller is an admin
create or replace function public.require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only admins can do this'; end if;
end $$;

-- ---------- Looking ----------------------------------------------------

-- Big numbers for the top of the page
create or replace function public.admin_summary() returns json
language plpgsql security definer set search_path = public, auth as $$
begin
  perform require_admin();
  return json_build_object(
    'users',   (select count(*) from auth.users),
    'clubs',   (select count(*) from clubs),
    'titles',  (select count(*) from club_titles),
    'ratings', (select count(*) from entries where rating is not null),
    'reviews', (select count(*) from entries where review is not null)
  );
end $$;

-- Every club, with its host, size and last activity
create or replace function public.admin_clubs()
returns table (id uuid, name text, invite_code text, created_at timestamptz, host_name text, members int, titles int, last_added timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  return query
    select c.id, c.name, c.invite_code, c.created_at,
      (select p.name from club_members m join profiles p on p.id = m.user_id
        where m.club_id = c.id and m.role = 'host' limit 1),
      (select count(*)::int from club_members m where m.club_id = c.id),
      (select count(*)::int from club_titles t where t.club_id = c.id),
      (select max(t.added_at) from club_titles t where t.club_id = c.id)
    from clubs c
    order by c.created_at desc;
end $$;

-- The people in one club
create or replace function public.admin_club_members(target uuid)
returns table (user_id uuid, name text, emoji text, color text, role text, joined_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  return query
    select m.user_id, coalesce(p.name, '(no profile)'), p.emoji, coalesce(p.color, '#8b5cf6'), m.role, m.joined_at
    from club_members m left join profiles p on p.id = m.user_id
    where m.club_id = target
    order by m.role desc, m.joined_at;
end $$;

-- Every account, with email and activity
create or replace function public.admin_users()
returns table (id uuid, email text, name text, emoji text, color text, created_at timestamptz,
               last_sign_in_at timestamptz, clubs int, entries int, is_admin boolean)
language plpgsql security definer set search_path = public, auth as $$
begin
  perform require_admin();
  return query
    select u.id, u.email::text, p.name, p.emoji, p.color, u.created_at, u.last_sign_in_at,
      (select count(*)::int from club_members m where m.user_id = u.id),
      (select count(*)::int from entries e where e.user_id = u.id),
      exists (select 1 from admins a where a.user_id = u.id)
    from auth.users u left join profiles p on p.id = u.id
    order by u.last_sign_in_at desc nulls last;
end $$;

-- ---------- Changing ---------------------------------------------------

create or replace function public.admin_rename_club(target uuid, new_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  update clubs set name = trim(new_name) where id = target;
end $$;

-- Deletes the club, its member list and its shelf (people's own ratings stay with them)
create or replace function public.admin_delete_club(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  delete from clubs where id = target;
end $$;

create or replace function public.admin_remove_member(target_club uuid, target_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  delete from club_members where club_id = target_club and user_id = target_user;
end $$;

-- Make someone a host of a club (or a member again) — a club can have more than one host
create or replace function public.admin_set_role(target_club uuid, target_user uuid, new_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  if new_role not in ('host', 'member') then raise exception 'Role must be host or member'; end if;
  update club_members set role = new_role where club_id = target_club and user_id = target_user;
end $$;

-- Deletes an account and everything that's theirs — including clubs they created
create or replace function public.admin_delete_user(target uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  perform require_admin();
  if target = auth.uid() then raise exception 'You can’t delete your own account from here'; end if;
  delete from auth.users where id = target;
end $$;

-- Start fresh: clears every club, shelf, rating, review and profile.
-- With delete_accounts = true, also deletes every login except the admins'.
create or replace function public.admin_reset(delete_accounts boolean) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  perform require_admin();
  truncate table entries, club_titles, club_members, clubs, profiles restart identity cascade;
  if delete_accounts then
    delete from auth.users where id not in (select user_id from admins);
  end if;
end $$;

-- Only signed-in people may even call these (and then require_admin decides)
revoke all on function
  public.require_admin(), public.admin_summary(), public.admin_clubs(), public.admin_club_members(uuid),
  public.admin_users(), public.admin_rename_club(uuid, text), public.admin_delete_club(uuid),
  public.admin_remove_member(uuid, uuid), public.admin_set_role(uuid, uuid, text), public.admin_delete_user(uuid),
  public.admin_reset(boolean)
from public, anon;
grant execute on function
  public.is_admin(), public.admin_summary(), public.admin_clubs(), public.admin_club_members(uuid),
  public.admin_users(), public.admin_rename_club(uuid, text), public.admin_delete_club(uuid),
  public.admin_remove_member(uuid, uuid), public.admin_set_role(uuid, uuid, text), public.admin_delete_user(uuid),
  public.admin_reset(boolean)
to authenticated;

-- ---------- Make yourself the admin -----------------------------------
-- Put YOUR login email between the quotes, then run this file.
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com'
on conflict do nothing;
