import type { MediaType, SearchResult } from '../types'

/**
 * Each function below asks one online database for results and converts
 * its answer into our common SearchResult shape.
 */

// ---------- Movies: TMDB (needs a free key in .env.local) ----------

export const TMDB_KEY: string | undefined = import.meta.env.VITE_TMDB_API_KEY

// TMDB search results only give genre ids, so we keep the (stable) id → name list here.
const TMDB_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
}

interface TmdbMovie {
  id: number
  title: string
  original_title: string
  release_date?: string
  poster_path: string | null
  genre_ids: number[]
}

export async function searchMovies(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  if (!TMDB_KEY) throw new Error('Movie search needs a TMDB key — see the setup steps.')
  const url = `https://api.themoviedb.org/3/search/movie?include_adult=false&query=${encodeURIComponent(query)}&api_key=${TMDB_KEY}`
  const data: { results: TmdbMovie[] } = await getJson(url, signal)
  return data.results.slice(0, 12).map((m) => ({
    id: `movie:${m.id}`,
    type: 'movie',
    externalId: String(m.id),
    title: m.title,
    subtitle: m.original_title !== m.title ? m.original_title : undefined,
    year: parseYear(m.release_date),
    image: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : undefined,
    genres: m.genre_ids.map((g) => TMDB_GENRES[g]).filter(Boolean),
  }))
}

// ---------- Series: TVmaze (no key) ----------

interface TvmazeShow {
  id: number
  name: string
  premiered: string | null
  genres: string[]
  image: { medium: string } | null
  network: { name: string } | null
  webChannel: { name: string } | null
}

export async function searchSeries(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`
  const data: { show: TvmazeShow }[] = await getJson(url, signal)
  return data.slice(0, 12).map(({ show }) => ({
    id: `series:${show.id}`,
    type: 'series',
    externalId: String(show.id),
    title: show.name,
    subtitle: show.network?.name ?? show.webChannel?.name,
    year: parseYear(show.premiered),
    image: show.image?.medium,
    genres: show.genres,
  }))
}

// ---------- Anime: AniList (no key, GraphQL) ----------

interface AnilistMedia {
  id: number
  title: { romaji: string; english: string | null }
  coverImage: { large: string }
  startDate: { year: number | null }
  episodes: number | null
  genres: string[]
}

const ANILIST_QUERY = `
  query ($search: String) {
    Page(perPage: 12) {
      media(search: $search, type: ANIME, isAdult: false) {
        id
        title { romaji english }
        coverImage { large }
        startDate { year }
        episodes
        genres
      }
    }
  }`

export async function searchAnime(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const data: { data: { Page: { media: AnilistMedia[] } } } = await getJson(
    'https://graphql.anilist.co',
    signal,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: query } }),
    },
  )
  return data.data.Page.media.map((a) => {
    const title = a.title.english ?? a.title.romaji
    return {
      id: `anime:${a.id}`,
      type: 'anime',
      externalId: String(a.id),
      title,
      subtitle: title !== a.title.romaji ? a.title.romaji : undefined,
      year: a.startDate.year ?? undefined,
      image: a.coverImage.large,
      genres: a.genres,
      length: a.episodes ?? undefined,
    }
  })
}

// ---------- Books: Open Library (no key) ----------

interface OpenLibraryDoc {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  subject?: string[]
  number_of_pages_median?: number
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const fields = 'key,title,author_name,first_publish_year,cover_i,subject,number_of_pages_median'
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&fields=${fields}`
  const data: { docs: OpenLibraryDoc[] } = await getJson(url, signal)
  return data.docs.map((b) => ({
    id: `book:${b.key}`,
    type: 'book',
    externalId: b.key,
    title: b.title,
    subtitle: b.author_name?.slice(0, 2).join(', '),
    year: b.first_publish_year,
    image: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : undefined,
    // Open Library "subjects" are messy (e.g. "series:Harry_Potter"), so keep a few simple ones
    genres: (b.subject ?? []).filter((s) => !s.includes(':') && s.length < 25).slice(0, 3),
    length: b.number_of_pages_median,
  }))
}

// ---------- Shared helpers ----------

export const SEARCHERS: Record<MediaType, (q: string, s?: AbortSignal) => Promise<SearchResult[]>> = {
  movie: searchMovies,
  series: searchSeries,
  anime: searchAnime,
  book: searchBooks,
}

async function getJson<T>(url: string, signal?: AbortSignal, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal })
  if (!res.ok) throw new Error(`The database answered with an error (${res.status}). Try again in a moment.`)
  return res.json() as Promise<T>
}

function parseYear(date?: string | null): number | undefined {
  const year = date ? Number(date.slice(0, 4)) : NaN
  return Number.isFinite(year) ? year : undefined
}
