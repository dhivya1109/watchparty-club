import { describe, expect, it } from 'vitest'
import type { SearchResult } from '../types'
import { addMember, addTitle, emptyClub, updateEntry, type ClubData } from './club'
import { genreTaste, rankTitles, sliceAtAngle, wheelSlices } from './picker'

const NOW = '2026-09-30T12:00:00.000Z'

function title(id: string, genres: string[]): SearchResult {
  return { id, type: 'movie', externalId: id, title: id, genres }
}

/** Two friends: Asha loves Fantasy and dislikes Horror; Ben has no ratings yet. */
function makeClub(): ClubData {
  let club = addMember(addMember(emptyClub, 'Asha', 'asha'), 'Ben', 'ben')
  for (const t of [
    title('Rated Fantasy', ['Fantasy']),
    title('Rated Horror', ['Horror']),
    title('New Fantasy', ['Fantasy', 'Adventure']),
    title('New Horror', ['Horror']),
    title('Seen by Ben', ['Fantasy']),
  ]) {
    club = addTitle(club, t, 'asha', NOW)
  }
  club = updateEntry(club, 'asha', 'Rated Fantasy', { status: 'completed', rating: 10 }, NOW)
  club = updateEntry(club, 'asha', 'Rated Horror', { status: 'completed', rating: 1 }, NOW)
  club = updateEntry(club, 'ben', 'Seen by Ben', { status: 'completed' }, NOW)
  return club
}

describe('genreTaste', () => {
  it('turns ratings into likes (+1) and dislikes (−1) per genre', () => {
    const taste = genreTaste(makeClub(), 'asha')
    expect(taste.get('Fantasy')).toBe(1)
    expect(taste.get('Horror')).toBe(-1)
  })
})

describe('rankTitles', () => {
  it('skips titles someone present has already completed', () => {
    const ids = rankTitles(makeClub(), { memberIds: ['asha', 'ben'] }).map((s) => s.title.id)
    expect(ids).not.toContain('Rated Fantasy')
    expect(ids).not.toContain('Seen by Ben')
  })

  it('does not skip titles completed only by someone who is absent', () => {
    const ids = rankTitles(makeClub(), { memberIds: ['asha'] }).map((s) => s.title.id)
    expect(ids).toContain('Seen by Ben')
  })

  it('ranks titles matching the group’s taste higher', () => {
    const ranked = rankTitles(makeClub(), { memberIds: ['asha', 'ben'] })
    expect(ranked[0].title.id).toBe('New Fantasy')
    expect(ranked.at(-1)!.title.id).toBe('New Horror')
    expect(ranked[0].reasons).toContain('Matches Asha’s taste')
  })

  it('filters by genre', () => {
    const ids = rankTitles(makeClub(), { memberIds: ['asha', 'ben'], genre: 'Horror' }).map((s) => s.title.id)
    expect(ids).toEqual(['New Horror'])
  })

  it('returns nothing when nobody is present', () => {
    expect(rankTitles(makeClub(), { memberIds: [] })).toEqual([])
  })
})

describe('the wheel', () => {
  const ranked = rankTitles(makeClub(), { memberIds: ['asha', 'ben'] })

  it('gives bigger slices to better matches, adding up to the whole wheel', () => {
    const slices = wheelSlices(ranked)
    expect(slices.reduce((a, b) => a + b, 0)).toBeCloseTo(1)
    expect(slices[0]).toBeGreaterThan(slices.at(-1)!)
  })

  it('finds which slice is at a given angle', () => {
    expect(sliceAtAngle([0.5, 0.25, 0.25], 10)).toBe(0)
    expect(sliceAtAngle([0.5, 0.25, 0.25], 200)).toBe(1)
    expect(sliceAtAngle([0.5, 0.25, 0.25], 359)).toBe(2)
  })
})
