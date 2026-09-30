import type { SearchResult } from '../types'

/**
 * The club's data and the rules for changing it.
 * These are "pure functions": they take the old data and return new data,
 * without touching the screen or the browser — which makes them easy to test.
 */

export type Status = 'want' | 'watching' | 'completed' | 'dropped'

export const STATUSES: { value: Status; label: string; emoji: string }[] = [
  { value: 'want', label: 'Want to', emoji: '📌' },
  { value: 'watching', label: 'In progress', emoji: '▶️' },
  { value: 'completed', label: 'Completed', emoji: '✅' },
  { value: 'dropped', label: 'Dropped', emoji: '💤' },
]

export type Role = 'host' | 'member'

export interface Member {
  id: string
  name: string
  color: string
  /** Optional emoji shown on the avatar instead of the first letter */
  emoji?: string
  /** A short line about their taste, e.g. "Horror fan, cries at anime" */
  bio?: string
  /** The host started the club and manages its members */
  role?: Role
  joinedAt?: string
}

export type MemberChange = Partial<Pick<Member, 'name' | 'color' | 'emoji' | 'bio'>>

export const MEMBER_COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316']
export const MEMBER_EMOJIS = ['🍿', '🎬', '🦊', '🐼', '🌸', '🚀', '👻', '🐉', '🎧', '🌙', '⚡', '🧋']
export const BIO_MAX_LENGTH = 80

/** A title that someone added to the club. */
export interface ClubTitle extends SearchResult {
  addedAt: string
  addedBy: string
}

/** One member's relationship with one title (see PLAN.md → Data design). */
export interface Entry {
  memberId: string
  titleId: string
  status: Status
  progress: number
  rating: number | null
  /** What this member felt about it, in their own words */
  review: string | null
  updatedAt: string
}

export interface ClubData {
  /** The club's name, e.g. "Goa Gang" */
  name?: string
  members: Member[]
  titles: Record<string, ClubTitle>
  entries: Entry[]
}

export type EntryChange = Partial<Pick<Entry, 'status' | 'progress' | 'rating' | 'review'>>

export const REVIEW_MAX_LENGTH = 500

export const emptyClub: ClubData = { members: [], titles: {}, entries: [] }

// ---------- Members ----------

/** The first person in a club becomes its host; everyone after is a member. */
export function addMember(data: ClubData, name: string, id: string, now = new Date().toISOString()): ClubData {
  const color = MEMBER_COLORS[data.members.length % MEMBER_COLORS.length]
  const role: Role = data.members.length === 0 ? 'host' : 'member'
  return { ...data, members: [...data.members, { id, name: name.trim(), color, role, joinedAt: now }] }
}

/** Save profile changes. Text is trimmed here — when saving, not on every keystroke. */
export function updateMember(data: ClubData, id: string, change: MemberChange): ClubData {
  const clean: MemberChange = { ...change }
  if (change.name !== undefined) {
    const name = change.name.trim()
    if (!name) delete clean.name // a name can't be empty — keep the old one
    else clean.name = name
  }
  if (change.bio !== undefined) clean.bio = change.bio.trim().slice(0, BIO_MAX_LENGTH)
  return { ...data, members: data.members.map((m) => (m.id === id ? { ...m, ...clean } : m)) }
}

export function isHost(data: ClubData, memberId: string): boolean {
  return data.members.find((m) => m.id === memberId)?.role === 'host'
}

/**
 * Removes a member and everything they rated or tracked.
 * The club always keeps a host: if the host leaves, the longest-standing member takes over.
 */
export function removeMember(data: ClubData, id: string): ClubData {
  const members = data.members.filter((m) => m.id !== id)
  if (members.length > 0 && !members.some((m) => m.role === 'host')) {
    members[0] = { ...members[0], role: 'host' }
  }
  return { ...data, members, entries: data.entries.filter((e) => e.memberId !== id) }
}

/** Older saved clubs have no roles: the first member becomes the host. */
export function withRoles(members: Member[]): Member[] {
  if (members.some((m) => m.role === 'host')) return members.map((m) => ({ ...m, role: m.role ?? 'member' }))
  return members.map((m, i) => ({ ...m, role: i === 0 ? 'host' : 'member' }))
}

// ---------- Profiles ----------

/**
 * Everything a member has on their shelf, grouped by status (most recent first).
 * Only titles they actually marked — unlike "My Club", where untouched titles count as "Want to".
 */
export function shelfOf(data: ClubData, memberId: string): Record<Status, { title: ClubTitle; entry: Entry }[]> {
  const shelf: Record<Status, { title: ClubTitle; entry: Entry }[]> = { want: [], watching: [], completed: [], dropped: [] }
  const mine = data.entries
    .filter((e) => e.memberId === memberId && data.titles[e.titleId])
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  for (const entry of mine) shelf[entry.status].push({ title: data.titles[entry.titleId], entry })
  return shelf
}

/**
 * What `fromId` would recommend to `forId`: things they rated 8+ that `forId`
 * hasn't finished or dropped yet. Best-rated first.
 */
export function recommendations(data: ClubData, fromId: string, forId: string): { title: ClubTitle; entry: Entry }[] {
  return data.entries
    .filter((e) => e.memberId === fromId && (e.rating ?? 0) >= 8 && data.titles[e.titleId])
    .filter((e) => {
      const theirs = getEntry(data, forId, e.titleId)
      return theirs?.status !== 'completed' && theirs?.status !== 'dropped'
    })
    .sort((a, b) => b.rating! - a.rating!)
    .map((entry) => ({ title: data.titles[entry.titleId], entry }))
}

// ---------- Titles and entries ----------

export function addTitle(
  data: ClubData,
  result: SearchResult,
  memberId: string,
  now = new Date().toISOString(),
): ClubData {
  if (data.titles[result.id]) return data
  return {
    ...data,
    titles: { ...data.titles, [result.id]: { ...result, addedAt: now, addedBy: memberId } },
    entries: [...data.entries, newEntry(memberId, result.id, now)],
  }
}

export function removeTitle(data: ClubData, titleId: string): ClubData {
  const titles = { ...data.titles }
  delete titles[titleId]
  return { ...data, titles, entries: data.entries.filter((e) => e.titleId !== titleId) }
}

export function getEntry(data: ClubData, memberId: string, titleId: string): Entry | undefined {
  return data.entries.find((e) => e.memberId === memberId && e.titleId === titleId)
}

/**
 * "My list": the club's titles this member chose to track (they have an entry for it).
 * Titles a friend added don't appear here until the member picks a status for them.
 */
export function myList(data: ClubData, memberId: string): ClubTitle[] {
  return Object.values(data.titles).filter((t) => getEntry(data, memberId, t.id))
}

/** Who added a title to the club — undefined if they've since left. */
export function addedBy(data: ClubData, title: ClubTitle): Member | undefined {
  return data.members.find((m) => m.id === title.addedBy)
}

/** The group's average rating for a title, or null if nobody rated it. */
export function averageRating(data: ClubData, titleId: string): number | null {
  const ratings = data.entries.filter((e) => e.titleId === titleId && e.rating !== null).map((e) => e.rating!)
  if (ratings.length === 0) return null
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
}

export function updateEntry(
  data: ClubData,
  memberId: string,
  titleId: string,
  change: EntryChange,
  now = new Date().toISOString(),
): ClubData {
  const title = data.titles[titleId]
  if (!title) return data
  const existing = getEntry(data, memberId, titleId) ?? newEntry(memberId, titleId, now)
  const updated = { ...applyChange(existing, change, title.length), updatedAt: now }
  const others = data.entries.filter((e) => e !== existing)
  return { ...data, entries: [...others, updated] }
}

/** The status/progress rules, e.g. finishing the last episode marks it completed. */
export function applyChange(entry: Entry, change: EntryChange, length?: number): Entry {
  let { status, progress, rating } = { ...entry, ...change }

  progress = Math.max(0, Math.round(progress))
  if (length) progress = Math.min(progress, length)

  if (change.progress !== undefined) {
    if (length && progress === length) status = 'completed'
    else if (progress > 0 && (status === 'want' || status === 'completed')) status = 'watching'
  }
  if (change.status === 'completed' && length) progress = length

  if (rating !== null) rating = Math.min(10, Math.max(1, Math.round(rating)))

  // Reviews: trimmed, limited in length, and an empty review means "no review".
  let review = entry.review ?? null
  if (change.review !== undefined) review = change.review?.trim().slice(0, REVIEW_MAX_LENGTH) || null

  return { ...entry, status, progress, rating, review }
}

/** What happens to an entry if `change` is applied — without saving it. Used to pick the right animation. */
export function previewChange(entry: Entry | undefined, change: EntryChange, length?: number): Entry {
  return applyChange(entry ?? newEntry('', '', ''), change, length)
}

function newEntry(memberId: string, titleId: string, now: string): Entry {
  return { memberId, titleId, status: 'want', progress: 0, rating: null, review: null, updatedAt: now }
}
