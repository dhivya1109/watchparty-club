import { describe, expect, it } from 'vitest'
import type { MediaType, SearchResult } from '../types'
import { addTitle, emptyClub, updateEntry } from './club'
import { interleave, pickForYou, topGenres } from './suggest'

const title = (id: string, genres: string[], type: MediaType = 'movie'): SearchResult => ({ id, type, externalId: id, title: id, genres })
const NOW = '2026-10-05T12:00:00.000Z'

describe('suggestions', () => {
  // On my list: two dramas (one loved), a comedy I rated badly, and a dropped horror
  let club = emptyClub
  club = addTitle(club, title('a', ['Drama', 'Romance']), 'me', NOW)
  club = addTitle(club, title('b', ['Drama']), 'me', NOW)
  club = addTitle(club, title('c', ['Comedy']), 'me', NOW)
  club = addTitle(club, title('d', ['Horror']), 'me', NOW)
  club = updateEntry(club, 'me', 'a', { rating: 9 })
  club = updateEntry(club, 'me', 'c', { rating: 2 })
  club = updateEntry(club, 'me', 'd', { status: 'dropped' })

  it('finds my favourite genres from my list and ratings', () => {
    expect(topGenres(club, 'me')).toEqual(['Drama', 'Romance'])
    expect(topGenres(club, 'someone-else')).toEqual([])
  })

  it('suggests trending titles that fit, skipping ones already in the club', () => {
    const trending = [title('x', ['Comedy']), title('a', ['Drama']), title('y', ['Drama']), title('z', ['Romance', 'Drama'])]
    expect(pickForYou(trending, club, ['Drama', 'Romance']).map((r) => r.id)).toEqual(['z', 'y'])
  })

  it('mixes the lists one from each in turn', () => {
    expect(interleave([[1, 2, 3], [10], [20, 21]])).toEqual([1, 10, 20, 2, 21, 3])
  })
})
