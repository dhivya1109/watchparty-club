import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleMovies } from './api/movies.ts'

/** Runs our /api server functions inside the local dev server (Vercel runs them online). */
function devApi(tmdbKey: string | undefined): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/movies', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        try {
          const response = await handleMovies(new URL(req.url ?? '', 'http://localhost').searchParams, tmdbKey)
          res.statusCode = response.status
          res.end(await response.text())
        } catch {
          // Never let one failed search take down the whole dev server.
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Movie search failed. Try again in a moment.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' = load every variable from .env.local, not only the VITE_ ones that go to the browser.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), devApi(env.TMDB_API_KEY)],
  }
})
