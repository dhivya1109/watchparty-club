import { describe, expect, it } from 'vitest'
import type { SearchResult } from '../types'
import {
  addedBy,
  addMember,
  addTitle,
  myList,
  emptyClub,
  isHost,
  recommendations,
  removeMember,
  shelfOf,
  updateEntry,
  updateMember,
  withRoles,
  type ClubData,
} from './club'

const NOW = '2026-09-30T12:00:00.000Z'
const title = (id: string): SearchResult => ({ id, type: 'movie', externalId: id, title: id, genres: [] })

function makeClub(): ClubData {
  return addMember(addMember(addMember(emptyClub, 'Asha', 'asha', NOW), 'Ben', 'ben', NOW), 'Cal', 'cal', NOW)
}

describe('roles', () => {
  it('makes the first person the host and everyone else a member', () => {
    const club = makeClub()
    expect(club.members.map((m) => m.role)).toEqual(['host', 'member', 'member'])
    expect(isHost(club, 'asha')).toBe(true)
    expect(isHost(club, 'ben')).toBe(false)
  })

  it('hands the host role on if the host is removed', () => {
    const club = removeMember(makeClub(), 'asha')
    expect(club.members.map((m) => `${m.name}:${m.role}`)).toEqual(['Ben:host', 'Cal:member'])
  })

  it('gives old clubs without roles a host', () => {
    const old = [{ id: 'a', name: 'A', color: '#000' }, { id: 'b', name: 'B', color: '#000' }]
    expect(withRoles(old).map((m) => m.role)).toEqual(['host', 'member'])
  })
})

describe('updateMember', () => {
  it('saves profile changes, trimming names and bios', () => {
    const club = updateMember(makeClub(), 'ben', { name: '  Ben Kumar ', emoji: '🦊', bio: '  Horror fan  ' })
    expect(club.members[1]).toMatchObject({ name: 'Ben Kumar', emoji: '🦊', bio: 'Horror fan' })
  })

  it('keeps the old name if the new one is empty', () => {
    expect(updateMember(makeClub(), 'ben', { name: '   ' }).members[1].name).toBe('Ben')
  })
})

describe('club shelf vs my list', () => {
  let club = makeClub()
  club = addTitle(club, title('Asha pick'), 'asha', NOW)
  club = addTitle(club, title('Ben pick'), 'ben', NOW)

  it('puts what you add on your own list', () => {
    expect(myList(club, 'asha').map((t) => t.id)).toEqual(['Asha pick'])
    expect(myList(club, 'ben').map((t) => t.id)).toEqual(['Ben pick'])
  })

  it('keeps a friend’s pick off your list until you choose a status', () => {
    expect(myList(club, 'cal')).toEqual([])
    const after = updateEntry(club, 'cal', 'Ben pick', { status: 'want' }, NOW)
    expect(myList(after, 'cal').map((t) => t.id)).toEqual(['Ben pick'])
  })

  it('knows who added each title', () => {
    expect(addedBy(club, club.titles['Ben pick'])?.name).toBe('Ben')
    expect(addedBy(removeMember(club, 'ben'), club.titles['Ben pick'])).toBeUndefined()
  })
})

describe('profiles', () => {
  let club = makeClub()
  for (const t of ['Loved', 'Okay', 'Seen by Ben', 'Dropped by Ben']) club = addTitle(club, title(t), 'asha', NOW)
  const set = (m: string, t: string, change: Parameters<typeof updateEntry>[3], at = NOW) =>
    (club = updateEntry(club, m, t, change, at))
  set('asha', 'Loved', { status: 'completed', rating: 10 })
  set('asha', 'Okay', { status: 'completed', rating: 6 })
  set('asha', 'Seen by Ben', { status: 'completed', rating: 9 })
  set('asha', 'Dropped by Ben', { status: 'completed', rating: 8 })
  set('ben', 'Seen by Ben', { status: 'completed' })
  set('ben', 'Dropped by Ben', { status: 'dropped' })

  it('groups a member’s shelf by status', () => {
    const shelf = shelfOf(club, 'ben')
    expect(shelf.completed.map((s) => s.title.id)).toEqual(['Seen by Ben'])
    expect(shelf.dropped.map((s) => s.title.id)).toEqual(['Dropped by Ben'])
    // Titles Ben never touched are NOT on his profile — we don't claim he wants something he never chose.
    expect(shelf.want).toEqual([])
  })

  it('recommends what they rated 8+ that you have not finished', () => {
    expect(recommendations(club, 'asha', 'ben').map((r) => r.title.id)).toEqual(['Loved'])
    expect(recommendations(club, 'asha', 'cal').map((r) => r.title.id)).toEqual(['Loved', 'Seen by Ben', 'Dropped by Ben'])
  })
})
