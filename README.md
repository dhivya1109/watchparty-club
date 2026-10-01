# 🍿 WatchParty Club

A shared shelf for everything your friends love — movies, TV series, anime and books.

- 🔍 **Search** four databases at once (TMDB, TVmaze, AniList, Open Library)
- 📋 **Track** what everyone wants to watch, is watching, or finished — with progress and ⭐ 1–10 ratings
- 🎡 **Tonight's pick** — scores titles for the people who are here and spins a wheel
- 📊 **Stats** — favourite genres, hours watched, and a taste match % between friends
- 🎬 **Shared clubs** — be in many clubs (friends, family…), join with an invite link, everything syncs live

## Run it locally

1. Install [Node.js](https://nodejs.org) (v20 or newer).
2. Create a free [Supabase](https://supabase.com) project. People log in with a code sent to their email, so:
   in Authentication → Sign In / Providers enable **Email**; in Authentication → Emails → SMTP Settings
   add your own email sender (e.g. Brevo's free SMTP — Supabase's built-in sender only emails your own team);
   and in Authentication → Emails → Templates make **Magic Link**, **Confirm signup** and **Change Email Address**
   show the code with `{{ .Token }}`. Keep anonymous sign-ins on only if you have older guest accounts. Then and run [`supabase/schema.sql`](supabase/schema.sql), then
   [`supabase/002_invite_preview.sql`](supabase/002_invite_preview.sql), in its SQL Editor.
3. Copy `.env.example` to `.env.local` and fill in your [TMDB API key](https://www.themoviedb.org/settings/api)
   and your Supabase project URL + publishable key.
4. Then:

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
| Talking to the shared database | `src/lib/cloud.ts` |
| Database tables + security rules | `supabase/schema.sql` |

Built step by step with Claude Code — see [PLAN.md](PLAN.md).
