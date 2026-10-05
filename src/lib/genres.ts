import type { MediaType } from '../types'

/**
 * The genre filter's full list, per type — so it's never empty or half-filled.
 * The four databases spell genres differently ("Sci-Fi", "Science-Fiction", "Science Fiction"),
 * so matching ignores case, spaces and dashes, and knows a few aliases.
 */
export const GENRES: Record<MediaType, string[]> = {
  movie: [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy',
    'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
  ],
  series: [
    'Action', 'Adventure', 'Anime', 'Comedy', 'Crime', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
    'Legal', 'Medical', 'Music', 'Mystery', 'Romance', 'Science Fiction', 'Sports', 'Supernatural', 'Thriller', 'War',
  ],
  anime: [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Music', 'Mystery', 'Psychological',
    'Romance', 'Science Fiction', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  ],
  book: [
    'Biography', 'Children', 'Classics', 'Comedy', 'Crime', 'Fantasy', 'Fiction', 'History', 'Horror', 'Mystery',
    'Poetry', 'Romance', 'Science Fiction', 'Self-help', 'Thriller', 'Young Adult',
  ],
}

/** Different spellings of the same genre */
const ALIASES: Record<string, string> = { scifi: 'sciencefiction', humor: 'comedy', humour: 'comedy', juvenile: 'children' }

const norm = (genre: string) => {
  const key = genre.toLowerCase().replace(/[^a-z]/g, '')
  return ALIASES[key] ?? key
}

/** Does a title with these genres belong under `genre`? ("Fantasy fiction" counts as Fantasy too.) */
export function matchesGenre(genres: string[], genre: string): boolean {
  const wanted = norm(genre)
  return genres.some((g) => {
    const n = norm(g)
    return n === wanted || n.includes(wanted)
  })
}

/** The filter's options for the chosen types, A–Z, without duplicates. */
export function genreOptions(types: MediaType[]): string[] {
  return [...new Set(types.flatMap((t) => GENRES[t]))].sort((a, b) => a.localeCompare(b))
}
