import { getEntry, type ClubData } from './club'
import { matchesGenre } from './genres'
import type { SearchResult } from '../types'

/**
 * 🍿 "For you" suggestions on the search screen.
 * Your favourite genres come from what's on your list: an unrated title counts +1; a rating
 * shifts that (5★ is neutral, 9★ counts extra, 2★ counts against); dropped titles don't count.
 */
export function topGenres(data: ClubData, memberId: string, howMany = 3): string[] {
  const scores = new Map<string, number>()
  for (const title of Object.values(data.titles)) {
    const entry = getEntry(data, memberId, title.id)
    if (!entry || entry.status === 'dropped') continue
    const weight = entry.rating === null ? 1 : (entry.rating - 5) / 2.5
    for (const g of title.genres ?? []) scores.set(g, (scores.get(g) ?? 0) + weight)
  }
  return [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, howMany)
    .map(([g]) => g)
}

/** Trending titles that fit your genres and aren't in the club yet — best fits first. */
export function pickForYou(trending: SearchResult[], data: ClubData, genres: string[], howMany = 12): SearchResult[] {
  return trending
    .filter((r) => !data.titles[r.id])
    .map((r, order) => ({ r, order, fit: genres.filter((g) => matchesGenre(r.genres, g)).length }))
    .filter((x) => x.fit > 0)
    .sort((a, b) => b.fit - a.fit || a.order - b.order)
    .slice(0, howMany)
    .map((x) => x.r)
}

/** Mix the trending lists (a movie, a series, an anime, a book, …) so "For you" isn't all one type. */
export function interleave<T>(lists: T[][]): T[] {
  const out: T[] = []
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length) out.push(l[i])
  return out
}
