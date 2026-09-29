import { describe, expect, it } from 'vitest'
import type { MediaType, SearchResult } from '../types'
import { addMember, addTitle, emptyClub, updateEntry, type ClubData } from './club'
import { clubTotals, genreStats, mostDivisive, mostLoved, personStats, tasteMatches, typeCounts } from './stats'

const NOW = '2026-09-30T12:00:00.000Z'

function title(id: string, type: MediaType, genres: string[], length?: number): SearchResult {
  return { id, type, externalId: id, title: id, genres, length }
}

function makeClub(): ClubData {
  let club = addMember(addMember(addMember(emptyClub, 'Asha', 'asha'), 'Ben', 'ben'), 'Cal', 'cal')
  for (const t of [
    title('Movie A', 'movie', ['Drama']),
    title('Movie B', 'movie', ['Drama', 'Comedy']),
    title('Anime', 'anime', ['Fantasy'], 12),
    title('Book', 'book', ['Fantasy'], 300),
  ]) {
    club = addTitle(club, t, 'asha', NOW)
  }
  const set = (m: string, t: string, change: Parameters<typeof updateEntry>[3]) =>
    (club = updateEntry(club, m, t, change, NOW))
  set('asha', 'Movie A', { status: 'completed', rating: 9 })
  set('ben', 'Movie A', { status: 'completed', rating: 8 })
  set('cal', 'Movie A', { status: 'completed', rating: 2 })
  set('asha', 'Movie B', { status: 'completed', rating: 7 })
  set('ben', 'Movie B', { status: 'completed', rating: 7 })
  set('asha', 'Anime', { progress: 10 })
  set('ben', 'Book', { progress: 150 })
  return club
}

describe('personStats', () => {
  it('counts completed titles, estimated watch time and pages', () => {
    const club = makeClub()
    const asha = personStats(club, club.members[0])
    expect(asha.completed).toBe(2)
    expect(asha.watchMinutes).toBe(2 * 120 + 10 * 24) // two movies + 10 anime episodes
    expect(asha.averageGiven).toBe(8)
    expect(personStats(club, club.members[1]).pagesRead).toBe(150)
  })
})

describe('clubTotals and typeCounts', () => {
  it('adds everyone up', () => {
    const totals = clubTotals(makeClub())
    expect(totals).toMatchObject({ titles: 4, completed: 5, pagesRead: 150 })
    expect(totals.watchHours).toBe(Math.round((5 * 120 + 10 * 24) / 60))
  })

  it('counts titles per type', () => {
    expect(typeCounts(makeClub())).toEqual({ movie: 2, series: 0, anime: 1, book: 1 })
  })
})

describe('genreStats', () => {
  it('orders genres by how many titles have them', () => {
    const genres = genreStats(makeClub())
    expect(genres.map((g) => g.genre)).toEqual(['Drama', 'Fantasy', 'Comedy'])
    expect(genres[0]).toMatchObject({ titles: 2, averageRating: 6.6 }) // 9, 8, 2, 7, 7
  })
})

describe('tasteMatches', () => {
  it('scores pairs by how close their ratings are', () => {
    const matches = tasteMatches(makeClub())
    const find = (a: string, b: string) => matches.find((m) => m.a.name === a && m.b.name === b)!
    expect(find('Asha', 'Ben')).toMatchObject({ shared: 2, match: 94 }) // differences 1 and 0
    expect(find('Asha', 'Cal')).toMatchObject({ shared: 1, match: 22 }) // 9 vs 2
    expect(matches[0].a.name).toBe('Asha') // best match first
  })

  it('returns null when a pair has nothing rated in common', () => {
    const match = tasteMatches(makeClub()).find((m) => m.a.name === 'Ben' && m.b.name === 'Cal')!
    expect(match.match).toBe(33) // they share Movie A: 8 vs 2 → 100 − 6/9 × 100
    const noOverlap = tasteMatches(addMember(makeClub(), 'Dee', 'dee')).find((m) => m.b.name === 'Dee')!
    expect(noOverlap).toMatchObject({ match: null, shared: 0 })
  })
})

describe('highlights', () => {
  it('finds the most loved and the most divisive titles', () => {
    const club = makeClub()
    expect(mostLoved(club)?.title.id).toBe('Movie B') // 7 and 7 → 7.0 beats Movie A's 6.3
    expect(mostDivisive(club)?.title.id).toBe('Movie A') // 9 vs 2
  })

  it('returns null when nothing has enough ratings', () => {
    expect(mostLoved(emptyClub)).toBeNull()
    expect(mostDivisive(emptyClub)).toBeNull()
  })
})
