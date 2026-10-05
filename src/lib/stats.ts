import type { MediaType } from '../types'
import { averageRating, type ClubData, type ClubTitle, type Member } from './club'

/**
 * Numbers for the Stats page. Search results don't include exact runtimes,
 * so watch time is an estimate from these typical lengths.
 */
export const ESTIMATED_MINUTES = { movie: 120, series: 45, anime: 24 } as const

export interface PersonStats {
  member: Member
  completed: number
  watchMinutes: number
  pagesRead: number
  ratingsGiven: number
  averageGiven: number | null
}

export function personStats(data: ClubData, member: Member): PersonStats {
  let completed = 0
  let watchMinutes = 0
  let pagesRead = 0
  const ratings: number[] = []

  for (const e of data.entries) {
    if (e.memberId !== member.id) continue
    const title = data.titles[e.titleId]
    if (!title) continue
    if (e.status === 'completed') completed++
    if (e.rating !== null) ratings.push(e.rating)

    if (title.type === 'movie') {
      if (e.status === 'completed') watchMinutes += ESTIMATED_MINUTES.movie
    } else if (title.type === 'book') {
      pagesRead += e.progress
    } else {
      watchMinutes += e.progress * ESTIMATED_MINUTES[title.type]
    }
  }

  return { member, completed, watchMinutes, pagesRead, ratingsGiven: ratings.length, averageGiven: average(ratings) }
}

/** The "Per person" table order: most completed first; ties go to whoever spent more time, then by name. */
export function rankByCompleted(people: PersonStats[]): PersonStats[] {
  return [...people].sort(
    (a, b) =>
      b.completed - a.completed ||
      b.watchMinutes + b.pagesRead - (a.watchMinutes + a.pagesRead) ||
      a.member.name.localeCompare(b.member.name),
  )
}

export interface ClubTotals {
  titles: number
  completed: number
  watchHours: number
  pagesRead: number
  averageRating: number | null
}

export function clubTotals(data: ClubData): ClubTotals {
  const people = data.members.map((m) => personStats(data, m))
  const ratings = data.entries.filter((e) => e.rating !== null && data.titles[e.titleId]).map((e) => e.rating!)
  return {
    titles: Object.keys(data.titles).length,
    completed: sum(people.map((p) => p.completed)),
    watchHours: Math.round(sum(people.map((p) => p.watchMinutes)) / 60),
    pagesRead: sum(people.map((p) => p.pagesRead)),
    averageRating: average(ratings),
  }
}

export function typeCounts(data: ClubData): Record<MediaType, number> {
  const counts: Record<MediaType, number> = { movie: 0, series: 0, anime: 0, book: 0 }
  for (const t of Object.values(data.titles)) counts[t.type]++
  return counts
}

export interface GenreStat {
  genre: string
  titles: number
  averageRating: number | null
}

/** How many club titles have each genre, and how the group rated them. */
export function genreStats(data: ClubData, limit = 8): GenreStat[] {
  const byGenre = new Map<string, { titles: number; ratings: number[] }>()
  for (const t of Object.values(data.titles)) {
    const ratings = data.entries.filter((e) => e.titleId === t.id && e.rating !== null).map((e) => e.rating!)
    for (const g of t.genres) {
      const s = byGenre.get(g) ?? { titles: 0, ratings: [] }
      s.titles++
      s.ratings.push(...ratings)
      byGenre.set(g, s)
    }
  }
  return [...byGenre]
    .map(([genre, s]) => ({ genre, titles: s.titles, averageRating: average(s.ratings) }))
    .sort((a, b) => b.titles - a.titles || (b.averageRating ?? 0) - (a.averageRating ?? 0))
    .slice(0, limit)
}

export interface TasteMatch {
  a: Member
  b: Member
  /** 0–100, or null when they haven't rated anything in common */
  match: number | null
  shared: number
}

/**
 * For every pair of members: compare ratings on titles both rated.
 * Same ratings → 100%. The biggest possible difference (1 vs 10) → 0%.
 */
export function tasteMatches(data: ClubData): TasteMatch[] {
  const pairs: TasteMatch[] = []
  for (let i = 0; i < data.members.length; i++) {
    for (let j = i + 1; j < data.members.length; j++) {
      const a = data.members[i]
      const b = data.members[j]
      const diffs: number[] = []
      for (const ea of data.entries) {
        if (ea.memberId !== a.id || ea.rating === null) continue
        const eb = data.entries.find((e) => e.memberId === b.id && e.titleId === ea.titleId && e.rating !== null)
        if (eb) diffs.push(Math.abs(ea.rating - eb.rating!))
      }
      const match = diffs.length ? Math.round(100 - (average(diffs)! / 9) * 100) : null
      pairs.push({ a, b, match, shared: diffs.length })
    }
  }
  return pairs.sort((x, y) => (y.match ?? -1) - (x.match ?? -1))
}

export interface Highlight {
  title: ClubTitle
  average: number
  ratings: number[]
}

/** Highest group average among titles rated by at least 2 people. */
export function mostLoved(data: ClubData): Highlight | null {
  const rated = ratedTitles(data).filter((h) => h.ratings.length >= 2)
  return rated.sort((a, b) => b.average - a.average)[0] ?? null
}

/** The title where ratings are furthest apart (at least 3 points). */
export function mostDivisive(data: ClubData): Highlight | null {
  const spread = (h: Highlight) => Math.max(...h.ratings) - Math.min(...h.ratings)
  const rated = ratedTitles(data).filter((h) => h.ratings.length >= 2 && spread(h) >= 3)
  return rated.sort((a, b) => spread(b) - spread(a))[0] ?? null
}

function ratedTitles(data: ClubData): Highlight[] {
  return Object.values(data.titles).flatMap((title) => {
    const ratings = data.entries.filter((e) => e.titleId === title.id && e.rating !== null).map((e) => e.rating!)
    const avg = averageRating(data, title.id)
    return avg === null ? [] : [{ title, average: avg, ratings }]
  })
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

function average(values: number[]): number | null {
  return values.length ? Math.round((sum(values) / values.length) * 10) / 10 : null
}
