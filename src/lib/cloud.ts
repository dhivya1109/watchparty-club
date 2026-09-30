import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SearchResult } from '../types'
import type { ClubData, ClubTitle, Entry, Member, Role, Status } from './club'

/**
 * ☁️ Everything the app says to the shared database (Supabase) lives in this file.
 * The database's own security rules (supabase/schema.sql) decide who may do what —
 * this file just asks.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export interface ClubSummary {
  id: string
  name: string
  inviteCode: string
  role: Role
}

export interface Profile {
  name: string
  color: string
  emoji?: string
  bio?: string
}

// ---------- Rows as they come from the database ----------

interface ProfileRow {
  id: string
  name: string
  emoji: string | null
  color: string
  bio: string | null
  created_at: string
}
interface ClubRow {
  id: string
  name: string
  invite_code: string
}
interface MemberRow {
  club_id: string
  user_id: string
  role: Role
  joined_at: string
}
interface TitleRow {
  title_id: string
  data: SearchResult
  added_by: string | null
  added_at: string
}
interface EntryRow {
  user_id: string
  title_id: string
  status: Status
  progress: number
  rating: number | null
  review: string | null
  updated_at: string
}

function db(): SupabaseClient {
  if (!supabase) throw new Error('The app is missing its Supabase settings (.env.local).')
  return supabase
}

/** Supabase answers { data, error }: return the data, or turn the error into a readable message. */
function ok<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}

const toMember = (p: ProfileRow, role: Role, joinedAt?: string): Member => ({
  id: p.id,
  name: p.name,
  color: p.color,
  emoji: p.emoji ?? undefined,
  bio: p.bio ?? undefined,
  role,
  joinedAt: joinedAt ?? p.created_at,
})

// ---------- Account ----------

export async function currentUserId(): Promise<string | null> {
  const { data } = await db().auth.getSession()
  return data.session?.user.id ?? null
}

/** A private account for this device — no email or password needed. */
export async function signIn(): Promise<string> {
  const existing = await currentUserId()
  if (existing) return existing
  const { data, error } = await db().auth.signInAnonymously()
  if (error || !data.user) throw new Error(error?.message ?? 'Could not create your account.')
  return data.user.id
}

// ---------- Saving your account with email ----------
// Supabase emails a short code. (Codes, not links: on phones a link often opens in a
// different browser — a code keeps you signed in right where you are.)

export interface Account {
  email: string | null
  /** true = a guest account that only lives in this browser */
  isGuest: boolean
}

export async function getAccount(): Promise<Account> {
  const { data } = await db().auth.getUser()
  return { email: data.user?.email ?? null, isGuest: data.user?.is_anonymous ?? true }
}

/** Step 1 of saving a guest account: attach an email. Supabase sends a code to it. */
export async function sendSaveCode(email: string): Promise<void> {
  const { error } = await db().auth.updateUser({ email: email.trim() })
  if (error) throw new Error(friendly(error.message))
}

/** Step 2: the code from the email confirms it — the account is now saved. */
export async function confirmSaveCode(email: string, code: string): Promise<void> {
  const { error } = await db().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email_change' })
  if (error) throw new Error(friendly(error.message))
}

/** On another device: send a sign-in code (only to emails that already have an account). */
export async function sendSignInCode(email: string): Promise<void> {
  const { error } = await db().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } })
  if (error) throw new Error(friendly(error.message))
}

/** …and sign in with it. Returns your account's id. */
export async function confirmSignInCode(email: string, code: string): Promise<string> {
  const { data, error } = await db().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
  if (error || !data.user) throw new Error(friendly(error?.message ?? 'Could not sign in.'))
  return data.user.id
}

export async function signOut(): Promise<void> {
  await db().auth.signOut()
}

/** Supabase's error messages are written for developers — translate the common ones. */
function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('signups not allowed') || m.includes('user not found'))
    return 'No saved account uses that email yet. Check the spelling — or save this account first.'
  if (m.includes('already been registered') || m.includes('already registered'))
    return 'That email is already used by another account. Sign in with it instead.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many emails were sent just now. Please wait a few minutes and try again.'
  // Check the email-format message BEFORE the code message — both contain the word "invalid".
  if (m.includes('email') && (m.includes('format') || m.includes('validate')))
    return 'That doesn’t look like a valid email address.'
  if (m.includes('expired') || m.includes('invalid') || m.includes('token'))
    return 'That code didn’t work — it may be mistyped or expired. Check the latest email, or send a new code.'
  if (m.includes('not authorized')) return 'Emails can’t be sent to that address yet (the app’s email sender is limited).'
  return message
}

export async function fetchProfile(userId: string): Promise<Member | null> {
  const row = ok<ProfileRow | null>(await db().from('profiles').select('*').eq('id', userId).maybeSingle())
  return row ? toMember(row, 'member') : null
}

export async function saveProfile(userId: string, profile: Profile): Promise<void> {
  ok(
    await db().from('profiles').upsert({
      id: userId,
      name: profile.name,
      color: profile.color,
      emoji: profile.emoji ?? null,
      bio: profile.bio ?? null,
    }),
  )
}

// ---------- Clubs ----------

/** Every club I'm in, oldest first. */
export async function fetchMyClubs(userId: string): Promise<ClubSummary[]> {
  const memberships = ok<MemberRow[]>(
    await db().from('club_members').select('club_id, user_id, role, joined_at').eq('user_id', userId).order('joined_at'),
  )
  if (memberships.length === 0) return []
  const clubs = ok<ClubRow[]>(
    await db().from('clubs').select('id, name, invite_code').in('id', memberships.map((m) => m.club_id)),
  )
  return memberships.flatMap((m) => {
    const c = clubs.find((c) => c.id === m.club_id)
    return c ? [{ id: c.id, name: c.name, inviteCode: c.invite_code, role: m.role }] : []
  })
}

/** Everything one club's pages need: its name, members, shelf, and everyone's entries. */
export async function fetchClub(clubId: string): Promise<ClubData> {
  const [club, members, titles] = await Promise.all([
    db().from('clubs').select('id, name, invite_code').eq('id', clubId).single().then((r) => ok<ClubRow>(r)),
    db().from('club_members').select('club_id, user_id, role, joined_at').eq('club_id', clubId).order('joined_at').then((r) => ok<MemberRow[]>(r)),
    db().from('club_titles').select('title_id, data, added_by, added_at').eq('club_id', clubId).then((r) => ok<TitleRow[]>(r)),
  ])
  const userIds = members.map((m) => m.user_id)
  const titleIds = titles.map((t) => t.title_id)
  const [profiles, entries] = await Promise.all([
    userIds.length ? db().from('profiles').select('*').in('id', userIds).then((r) => ok<ProfileRow[]>(r)) : [],
    userIds.length && titleIds.length
      ? db().from('entries').select('*').in('user_id', userIds).in('title_id', titleIds).then((r) => ok<EntryRow[]>(r))
      : [],
  ])

  // The host first, then everyone in the order they joined
  const sorted = [...members].sort((a, b) => (a.role === 'host' ? -1 : b.role === 'host' ? 1 : 0))
  return {
    name: club.name,
    members: sorted.map((m) => {
      const p = profiles.find((p) => p.id === m.user_id)
      return p ? toMember(p, m.role, m.joined_at) : { id: m.user_id, name: 'New member', color: '#8b5cf6', role: m.role, joinedAt: m.joined_at }
    }),
    titles: Object.fromEntries(
      titles.map((t): [string, ClubTitle] => [t.title_id, { ...t.data, id: t.title_id, addedAt: t.added_at, addedBy: t.added_by ?? '' }]),
    ),
    entries: entries.map((e) => ({
      memberId: e.user_id,
      titleId: e.title_id,
      status: e.status,
      progress: e.progress,
      rating: e.rating,
      review: e.review,
      updatedAt: e.updated_at,
    })),
  }
}

export async function createClub(name: string): Promise<ClubSummary> {
  const c = ok<ClubRow>(await db().rpc('create_club', { club_name: name }))
  return { id: c.id, name: c.name, inviteCode: c.invite_code, role: 'host' }
}

/** Accepts a full invite link or just the code. */
export async function joinClub(linkOrCode: string): Promise<ClubSummary> {
  const code = linkOrCode.includes('join=') ? new URL(linkOrCode, location.origin).searchParams.get('join') ?? '' : linkOrCode
  const c = ok<ClubRow>(await db().rpc('join_club', { code: code.trim() }))
  return { id: c.id, name: c.name, inviteCode: c.invite_code, role: 'member' }
}

export function inviteLink(code: string): string {
  return `${location.origin}/?join=${code}`
}

export async function renameClub(clubId: string, name: string): Promise<void> {
  ok(await db().from('clubs').update({ name }).eq('id', clubId))
}

/** Remove a member (host) or leave (yourself). Refused by the database if not allowed. */
export async function removeMember(clubId: string, userId: string): Promise<void> {
  const rows = ok<MemberRow[]>(await db().from('club_members').delete().eq('club_id', clubId).eq('user_id', userId).select())
  if (rows.length === 0) throw new Error('You’re not allowed to do that.')
}

// ---------- The shelf and entries ----------

export async function addTitle(clubId: string, userId: string, result: SearchResult): Promise<void> {
  ok(await db().from('club_titles').upsert({ club_id: clubId, title_id: result.id, data: result }, { ignoreDuplicates: true }))
  // Start your own entry as "want" — unless you already have one from another club.
  ok(await db().from('entries').upsert({ user_id: userId, title_id: result.id, status: 'want' }, { ignoreDuplicates: true }))
}

export async function removeTitle(clubId: string, titleId: string): Promise<void> {
  const rows = ok<TitleRow[]>(await db().from('club_titles').delete().eq('club_id', clubId).eq('title_id', titleId).select())
  if (rows.length === 0) throw new Error('Only the person who added it (or the host) can remove it.')
}

export async function saveEntry(entry: Entry): Promise<void> {
  ok(
    await db().from('entries').upsert({
      user_id: entry.memberId,
      title_id: entry.titleId,
      status: entry.status,
      progress: entry.progress,
      rating: entry.rating,
      review: entry.review,
      updated_at: entry.updatedAt,
    }),
  )
}

/** Moves a club that was saved on this device (before sharing existed) into a cloud club. */
export async function importLocalShelf(clubId: string, userId: string, local: ClubData, localMeId: string): Promise<number> {
  const titles = Object.values(local.titles)
  if (titles.length === 0) return 0
  ok(
    await db()
      .from('club_titles')
      .upsert(
        titles.map(({ addedAt: _a, addedBy: _b, ...result }) => ({ club_id: clubId, title_id: result.id, data: result })),
        { ignoreDuplicates: true },
      ),
  )
  const mine = local.entries.filter((e) => e.memberId === localMeId)
  if (mine.length) {
    ok(
      await db()
        .from('entries')
        .upsert(
          mine.map((e) => ({
            user_id: userId,
            title_id: e.titleId,
            status: e.status,
            progress: e.progress,
            rating: e.rating,
            review: e.review ?? null,
            updated_at: e.updatedAt,
          })),
        ),
    )
  }
  return titles.length
}

// ---------- Live updates ----------

/** Calls `onChange` whenever anything in this club changes — on anyone's phone. Returns a stop function. */
export function watchClub(clubId: string, onChange: () => void): () => void {
  const channel = db()
    .channel(`club-${clubId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'club_titles', filter: `club_id=eq.${clubId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'club_members', filter: `club_id=eq.${clubId}` }, onChange)
    // Entries: the security rules already limit these to people you share a club with
    .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, onChange)
    .subscribe()
  return () => {
    void db().removeChannel(channel)
  }
}
