-- =====================================================================
-- WatchParty Club — shared clubs
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
--
-- One person can be in many clubs. People create a club (they become
-- the host) or join one with its invite code. Ratings & reviews belong
-- to the person, so every club they're in sees the same ones.
--
-- Security lives HERE, in Row Level Security (RLS) rules: the database
-- itself refuses anything a person isn't allowed to do.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tables ----------------------------------------------------

-- One profile per person
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 30),
  emoji       text,
  color       text not null default '#8b5cf6',
  bio         text check (char_length(bio) <= 80),
  created_at  timestamptz not null default now()
);

-- A club, with a secret code for its invite link
create table public.clubs (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 40),
  invite_code  text not null unique default encode(gen_random_bytes(5), 'hex'),
  created_by   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- Who is in which club, and their role
create table public.club_members (
  club_id    uuid not null references public.clubs (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'member' check (role in ('host', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (club_id, user_id)
);

-- What's on each club's shelf (the title's details are kept as JSON)
create table public.club_titles (
  club_id   uuid not null references public.clubs (id) on delete cascade,
  title_id  text not null,
  data      jsonb not null,
  added_by  uuid default auth.uid() references auth.users (id) on delete set null,
  added_at  timestamptz not null default now(),
  primary key (club_id, title_id)
);

-- Each person's status, progress, rating and review for a title
create table public.entries (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title_id    text not null,
  status      text not null default 'want' check (status in ('want', 'watching', 'completed', 'dropped')),
  progress    int  not null default 0 check (progress >= 0),
  rating      int  check (rating between 1 and 10),
  review      text check (char_length(review) <= 500),
  updated_at  timestamptz not null default now(),
  primary key (user_id, title_id)
);

create index on public.club_members (user_id);
create index on public.entries (title_id);

-- ---------- Helper checks (used by the security rules) ----------------
-- "security definer" lets these look at club_members without tripping
-- over club_members' own rules.

create function public.is_club_member(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from club_members where club_id = c and user_id = auth.uid());
$$;

create function public.is_club_host(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from club_members where club_id = c and user_id = auth.uid() and role = 'host');
$$;

-- Do I share at least one club with this person?
create function public.shares_club_with(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from club_members a join club_members b on a.club_id = b.club_id
    where a.user_id = auth.uid() and b.user_id = u
  );
$$;

-- ---------- Actions ---------------------------------------------------

-- Create a club and become its host (both happen together, or neither)
create function public.create_club(club_name text) returns public.clubs
language plpgsql security definer set search_path = public as $$
declare c clubs;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  insert into clubs (name, created_by) values (trim(club_name), auth.uid()) returning * into c;
  insert into club_members (club_id, user_id, role) values (c.id, auth.uid(), 'host');
  return c;
end $$;

-- Join a club with its invite code (joining twice is harmless)
create function public.join_club(code text) returns public.clubs
language plpgsql security definer set search_path = public as $$
declare c clubs;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into c from clubs where invite_code = lower(trim(code));
  if not found then raise exception 'This invite link is not valid'; end if;
  insert into club_members (club_id, user_id, role) values (c.id, auth.uid(), 'member')
  on conflict do nothing;
  return c;
end $$;

-- ---------- Security rules (Row Level Security) -----------------------

alter table public.profiles     enable row level security;
alter table public.clubs        enable row level security;
alter table public.club_members enable row level security;
alter table public.club_titles  enable row level security;
alter table public.entries      enable row level security;

-- Profiles: see your own and your club-mates'; edit only your own
create policy "read own and club-mates' profiles" on public.profiles
  for select using (id = auth.uid() or public.shares_club_with(id));
create policy "create own profile" on public.profiles
  for insert with check (id = auth.uid());
create policy "edit own profile" on public.profiles
  for update using (id = auth.uid());

-- Clubs: members can see them; only the host renames or deletes.
-- (New clubs are made through create_club, so there's no insert rule.)
create policy "members see their clubs" on public.clubs
  for select using (public.is_club_member(id));
create policy "host renames club" on public.clubs
  for update using (public.is_club_host(id));
create policy "host deletes club" on public.clubs
  for delete using (public.is_club_host(id));

-- Members: see who's in your clubs; the host removes others; members may leave
create policy "see members of my clubs" on public.club_members
  for select using (public.is_club_member(club_id));
create policy "host removes members, members leave" on public.club_members
  for delete using (
    (public.is_club_host(club_id) and user_id <> auth.uid())
    or (user_id = auth.uid() and role = 'member')
  );

-- Shelf: members see and add titles; the person who added it (or the host) removes it
create policy "members see the shelf" on public.club_titles
  for select using (public.is_club_member(club_id));
create policy "members add titles" on public.club_titles
  for insert with check (public.is_club_member(club_id) and added_by = auth.uid());
create policy "adder or host removes titles" on public.club_titles
  for delete using (added_by = auth.uid() or public.is_club_host(club_id));

-- Ratings & reviews: club-mates can read them; only you can write yours
create policy "read mine and club-mates' entries" on public.entries
  for select using (user_id = auth.uid() or public.shares_club_with(user_id));
create policy "write own entries" on public.entries
  for insert with check (user_id = auth.uid());
create policy "update own entries" on public.entries
  for update using (user_id = auth.uid());
create policy "delete own entries" on public.entries
  for delete using (user_id = auth.uid());

-- ---------- Live updates ----------------------------------------------
-- Changes to these tables are pushed to everyone's phones instantly.
alter publication supabase_realtime add table public.club_titles, public.entries, public.club_members;
