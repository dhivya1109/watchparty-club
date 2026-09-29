import type { MediaType } from '../types'
import { getEntry, type ClubData, type ClubTitle } from './club'

/**
 * "What should we watch tonight?"
 *
 * score = 3 × (share of present members who want / are watching it)
 *       + 2 × (how well its genres match their past ratings, from −1 to +1)
 *       + 1 × (share of present members who already started it)
 *
 * Titles that anyone present has completed or dropped are skipped.
 */

export interface PickOptions {
  memberIds: string[]
  type?: MediaType | 'all'
  genre?: string
}

export interface Suggestion {
  title: ClubTitle
  score: number
  reasons: string[]
}

/** How much a member likes each genre, from −1 (hates) to +1 (loves), based on their ratings. */
export function genreTaste(data: ClubData, memberId: string): Map<string, number> {
  const sums = new Map<string, { total: number; count: number }>()
  for (const e of data.entries) {
    if (e.memberId !== memberId || e.rating === null) continue
    const title = data.titles[e.titleId]
    if (!title) continue
    const liking = (e.rating - 5.5) / 4.5 // 1 → −1, 10 → +1
    for (const g of title.genres) {
      const s = sums.get(g) ?? { total: 0, count: 0 }
      s.total += liking
      s.count += 1
      sums.set(g, s)
    }
  }
  return new Map([...sums].map(([g, s]) => [g, s.total / s.count]))
}

export function rankTitles(data: ClubData, options: PickOptions): Suggestion[] {
  const present = data.members.filter((m) => options.memberIds.includes(m.id))
  if (present.length === 0) return []
  const tastes = new Map(present.map((m) => [m.id, genreTaste(data, m.id)]))

  const suggestions: Suggestion[] = []
  for (const title of Object.values(data.titles)) {
    if (options.type && options.type !== 'all' && title.type !== options.type) continue
    if (options.genre && !title.genres.includes(options.genre)) continue

    const entries = present.map((m) => getEntry(data, m.id, title.id))
    if (entries.some((e) => e?.status === 'completed' || e?.status === 'dropped')) continue

    const wanting = present.filter((_, i) => entries[i]?.status === 'want' || entries[i]?.status === 'watching')
    const started = present.filter((_, i) => entries[i]?.status === 'watching')

    const fans: string[] = []
    let genreMatch = 0
    for (const m of present) {
      const taste = tastes.get(m.id)!
      const match = title.genres.length
        ? title.genres.reduce((sum, g) => sum + (taste.get(g) ?? 0), 0) / title.genres.length
        : 0
      if (match > 0.3) fans.push(m.name)
      genreMatch += match
    }
    genreMatch /= present.length

    const score = 3 * (wanting.length / present.length) + 2 * genreMatch + started.length / present.length

    const reasons: string[] = []
    if (wanting.length === present.length && present.length > 1) reasons.push('Everyone wants it')
    else if (wanting.length > 0) reasons.push(`${wanting.length} of ${present.length} want it`)
    if (started.length > 0) reasons.push(`${names(started.map((m) => m.name))} already started`)
    if (fans.length > 0) reasons.push(`Matches ${names(fans)}’s taste`)
    if (genreMatch < -0.3) reasons.push('Not the usual genres for this group')

    suggestions.push({ title, score: Math.round(score * 100) / 100, reasons })
  }

  return suggestions.sort((a, b) => b.score - a.score || a.title.title.localeCompare(b.title.title))
}

/**
 * Slice sizes for the wheel: higher score → bigger slice (never zero).
 * Returned as fractions that add up to 1.
 */
export function wheelSlices(suggestions: Suggestion[]): number[] {
  if (suggestions.length === 0) return []
  const min = Math.min(...suggestions.map((s) => s.score))
  const weights = suggestions.map((s) => s.score - min + 0.5)
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / total)
}

/** Which slice sits at `angle` degrees (0–360) on the wheel. */
export function sliceAtAngle(slices: number[], angle: number): number {
  let edge = 0
  for (let i = 0; i < slices.length; i++) {
    edge += slices[i] * 360
    if (angle < edge) return i
  }
  return slices.length - 1
}

function names(list: string[]): string {
  return list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} & ${list.at(-1)}`
}
