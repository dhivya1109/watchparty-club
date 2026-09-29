# 🍿 WatchParty Club

A shared shelf for everything your friends love — movies, TV series, anime and books.

- 🔍 **Search** four databases at once (TMDB, TVmaze, AniList, Open Library)
- 📋 **Track** what everyone wants to watch, is watching, or finished — with progress and ⭐ 1–10 ratings
- 🎡 **Tonight's pick** — scores titles for the people who are here and spins a wheel
- 📊 **Stats** — favourite genres, hours watched, and a taste match % between friends

> 🧪 Test version: each person's club is saved in their own browser. Shared clubs are next.

## Run it locally

1. Install [Node.js](https://nodejs.org) (v20 or newer).
2. Copy `.env.example` to `.env.local` and add a free [TMDB API key](https://www.themoviedb.org/settings/api).
3. Then:

```bash
npm install
npm run dev     # start the app at http://localhost:5173
npm test        # run the tests
```

## How it's built

| Part | Where |
|---|---|
| Screens (React + Tailwind) | `src/components/` |
| Rules: club data, picker, stats (with tests) | `src/lib/` |
| Search in the four databases | `src/api/search.ts` |
| Server function that keeps the TMDB key secret | `api/movies.ts` |

Built step by step with Claude Code — see [PLAN.md](PLAN.md).
