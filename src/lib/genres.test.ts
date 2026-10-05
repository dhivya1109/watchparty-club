import { describe, expect, it } from 'vitest'
import { genreOptions, matchesGenre } from './genres'

describe('genre filter', () => {
  it('treats different spellings as the same genre', () => {
    expect(matchesGenre(['Science-Fiction'], 'Science Fiction')).toBe(true)
    expect(matchesGenre(['Sci-Fi'], 'Science Fiction')).toBe(true)
    expect(matchesGenre(['fantasy fiction'], 'Fantasy')).toBe(true)
    expect(matchesGenre(['Drama'], 'Comedy')).toBe(false)
  })

  it('lists every genre for the chosen types once, A–Z', () => {
    const list = genreOptions(['movie', 'anime'])
    expect(list).toContain('Slice of Life')
    expect(list).toContain('Western')
    expect(list.filter((g) => g === 'Action')).toHaveLength(1)
    expect([...list].sort((a, b) => a.localeCompare(b))).toEqual(list)
  })
})
