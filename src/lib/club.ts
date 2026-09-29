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
  updatedAt: string
}

export interface ClubData {
  titles: Record<string, ClubTitle>
  entries: Entry[]
}

export type EntryChange = Partial<Pick<Entry, 'status' | 'progress' | 'rating'>>

export const emptyClub: ClubData = { titles: {}, entries: [] }

export function addTitle(
  data: ClubData,
  result: SearchResult,
  memberId: string,
  now = new Date().toISOString(),
): ClubData {
  if (data.titles[result.id]) return data
  return {
    titles: { ...data.titles, [result.id]: { ...result, addedAt: now, addedBy: memberId } },
    entries: [...data.entries, newEntry(memberId, result.id, now)],
  }
}

export function removeTitle(data: ClubData, titleId: string): ClubData {
  const titles = { ...data.titles }
  delete titles[titleId]
  return { titles, entries: data.entries.filter((e) => e.titleId !== titleId) }
}

export function getEntry(data: ClubData, memberId: string, titleId: string): Entry | undefined {
  return data.entries.find((e) => e.memberId === memberId && e.titleId === titleId)
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

  return { ...entry, status, progress, rating }
}

function newEntry(memberId: string, titleId: string, now: string): Entry {
  return { memberId, titleId, status: 'want', progress: 0, rating: null, updatedAt: now }
}
