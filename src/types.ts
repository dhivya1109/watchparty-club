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
  /** The source's public rating, out of 10 (TMDB, TVmaze, AniList, Open Library) */
  rating?: number
}

export const MEDIA_TYPES: { type: MediaType; emoji: string; label: string }[] = [
  { type: 'movie', emoji: '🎬', label: 'Movies' },
  { type: 'series', emoji: '📺', label: 'Series' },
  { type: 'anime', emoji: '🍥', label: 'Anime' },
  { type: 'book', emoji: '📚', label: 'Books' },
]

/**
 * Each type's colour, as ready-made Tailwind classes (written out in full so Tailwind can find them).
 * The colour always appears next to the type's emoji and name, never on its own.
 */
export const TYPE_STYLE: Record<MediaType, { text: string; bg: string; dot: string; hover: string }> = {
  movie: { text: 'text-movie', bg: 'bg-movie/15', dot: 'bg-movie', hover: 'hover:border-movie/60 hover:shadow-movie/20' },
  series: { text: 'text-series', bg: 'bg-series/15', dot: 'bg-series', hover: 'hover:border-series/60 hover:shadow-series/20' },
  anime: { text: 'text-anime', bg: 'bg-anime/15', dot: 'bg-anime', hover: 'hover:border-anime/60 hover:shadow-anime/20' },
  book: { text: 'text-book', bg: 'bg-book/15', dot: 'bg-book', hover: 'hover:border-book/60 hover:shadow-book/20' },
}

export const LENGTH_UNIT: Record<MediaType, string> = {
  movie: 'min',
  series: 'eps',
  anime: 'eps',
  book: 'pages',
}
