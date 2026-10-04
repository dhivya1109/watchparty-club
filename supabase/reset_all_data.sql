-- ⚠️ RESET: start the app fresh. This PERMANENTLY deletes data — there is no undo.
-- Run it in Supabase → SQL Editor. The tables, rules and functions stay; only the data goes.

-- ============================================================
-- PART 1 — Clear all content: every club, member list, title, status, rating, review and profile.
-- People keep their login (email), but see "Who are you?" again and start with no clubs.
-- ============================================================
truncate table
  public.entries,
  public.club_titles,
  public.club_members,
  public.clubs,
  public.profiles
restart identity cascade;

-- ============================================================
-- PART 2 (optional) — Also delete every login account.
-- Everyone (you too) signs up again with their email and a new code.
-- To use it: remove the two dashes at the start of the next line, then run.
-- ============================================================
-- delete from auth.users;
