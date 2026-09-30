/**
 * Server function: GET /api/movies?query=...
 *
 * The browser calls this instead of TMDB, so the TMDB key stays on the server
 * and never appears in the website's code.
 * Online it runs on Vercel; locally the Vite dev server runs it (see vite.config.ts).
 */

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams.get('query')
  return searchTmdbMovies(query, process.env.TMDB_API_KEY)
}

export async function searchTmdbMovies(query: string | null, apiKey: string | undefined): Promise<Response> {
  if (!apiKey) {
    return json(500, { error: 'Movie search isn’t set up yet: the server has no TMDB key (TMDB_API_KEY).' })
  }
  if (!query?.trim()) return json(400, { error: 'Type something to search for.' })

  const url = `https://api.themoviedb.org/3/search/movie?include_adult=false&query=${encodeURIComponent(query)}&api_key=${apiKey}`
  let res: Response
  let body: string
  try {
    res = await fetch(url)
    body = await res.text()
  } catch {
    // Network hiccups happen (dropped connection, timeout) — answer politely instead of crashing.
    return json(502, { error: 'Couldn’t reach the movie database just now. Try again in a moment.' })
  }
  if (!res.ok) return json(502, { error: `The movie database answered with an error (${res.status}). Try again in a moment.` })

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      // Let Vercel remember each search for an hour — faster for friends, fewer calls to TMDB.
      'Cache-Control': 'public, s-maxage=3600',
    },
  })
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
