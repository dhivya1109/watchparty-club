export type MediaType = 'movie' | 'series' | 'anime' | 'book'

/** One search result, in the same shape no matter which database it came from. */
export interface SearchResult {
  /** Unique across all sources, e.g. "anime:154587" */
  id: string
  type: MediaType
  externalId: string
  title: string
  /** Extra line under the title: author, original title, network… */
  subtitle?: string
  year?: number
  image?: string
  genres: string[]
  /** Episodes (series/anime), minutes (movie) or pages (book) */
  length?: number
}

export const MEDIA_TYPES: { type: MediaType; emoji: string; label: string }[] = [
  { type: 'movie', emoji: '🎬', label: 'Movies' },
  { type: 'series', emoji: '📺', label: 'Series' },
  { type: 'anime', emoji: '🍥', label: 'Anime' },
  { type: 'book', emoji: '📚', label: 'Books' },
]

export const LENGTH_UNIT: Record<MediaType, string> = {
  movie: 'min',
  series: 'eps',
  anime: 'eps',
  book: 'pages',
}
