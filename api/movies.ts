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

  // TMDB answers 20 movies per page. Lesser-known and regional films often rank lower,
  // so ask for the first 3 pages (up to 60 movies) at once.
  const page = (n: number) =>
    `https://api.themoviedb.org/3/search/movie?include_adult=false&page=${n}&query=${encodeURIComponent(query)}&api_key=${apiKey}`
  let pages: { results?: unknown[]; total_pages?: number }[]
  try {
    const first = await fetch(page(1))
    if (!first.ok) return json(502, { error: `The movie database answered with an error (${first.status}). Try again in a moment.` })
    const firstBody = (await first.json()) as { results?: unknown[]; total_pages?: number }
    const more = Math.min((firstBody.total_pages ?? 1) - 1, 2)
    const rest = await Promise.all(
      Array.from({ length: Math.max(more, 0) }, (_, i) =>
        fetch(page(i + 2))
          .then((r) => (r.ok ? (r.json() as Promise<{ results?: unknown[] }>) : { results: [] }))
          .catch(() => ({ results: [] })),
      ),
    )
    pages = [firstBody, ...rest]
  } catch {
    // Network hiccups happen (dropped connection, timeout) — answer politely instead of crashing.
    return json(502, { error: 'Couldn’t reach the movie database just now. Try again in a moment.' })
  }

  return new Response(JSON.stringify({ results: pages.flatMap((p) => p.results ?? []) }), {
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
