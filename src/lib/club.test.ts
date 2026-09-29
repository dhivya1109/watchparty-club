import { describe, expect, it } from 'vitest'
import type { SearchResult } from '../types'
import { addTitle, emptyClub, getEntry, removeTitle, updateEntry } from './club'

const frieren: SearchResult = {
  id: 'anime:154587',
  type: 'anime',
  externalId: '154587',
  title: 'Frieren: Beyond Journey’s End',
  genres: ['Adventure', 'Drama', 'Fantasy'],
  length: 28,
}
const NOW = '2026-09-29T12:00:00.000Z'

describe('adding and removing titles', () => {
  it('adds a title with a "want" entry for the member', () => {
    const club = addTitle(emptyClub, frieren, 'me', NOW)
    expect(club.titles[frieren.id].addedBy).toBe('me')
    expect(getEntry(club, 'me', frieren.id)).toMatchObject({ status: 'want', progress: 0, rating: null })
  })

  it('does not add the same title twice', () => {
    const once = addTitle(emptyClub, frieren, 'me', NOW)
    expect(addTitle(once, frieren, 'me', NOW)).toBe(once)
  })

  it('removes a title and its entries', () => {
    const club = removeTitle(addTitle(emptyClub, frieren, 'me', NOW), frieren.id)
    expect(club).toEqual(emptyClub)
  })
})

describe('status and progress rules', () => {
  const club = addTitle(emptyClub, frieren, 'me', NOW)
  const update = (change: Parameters<typeof updateEntry>[3], from = club) =>
    getEntry(updateEntry(from, 'me', frieren.id, change, NOW), 'me', frieren.id)!

  it('starting progress moves "want" to "watching"', () => {
    expect(update({ progress: 3 })).toMatchObject({ status: 'watching', progress: 3 })
  })

  it('reaching the last episode marks it completed', () => {
    expect(update({ progress: 28 }).status).toBe('completed')
  })

  it('marking completed fills the progress', () => {
    expect(update({ status: 'completed' }).progress).toBe(28)
  })

  it('keeps progress between 0 and the total length', () => {
    expect(update({ progress: 99 }).progress).toBe(28)
    expect(update({ progress: -5 }).progress).toBe(0)
  })

  it('going back from the last episode returns to "watching"', () => {
    const finished = updateEntry(club, 'me', frieren.id, { progress: 28 }, NOW)
    expect(update({ progress: 20 }, finished).status).toBe('watching')
  })

  it('keeps ratings between 1 and 10, and allows clearing them', () => {
    expect(update({ rating: 14 }).rating).toBe(10)
    expect(update({ rating: 0 }).rating).toBe(1)
    expect(update({ rating: null }).rating).toBeNull()
  })
})
