# WatchParty Club — Project Plan

A shared tracker where a group of friends keeps one list of movies, TV series, anime and books,
rates what they finish, and gets a "What should we watch tonight?" suggestion.

---

## 1. Tech stack (the tools we use)

| Tool | What it is | Why we use it |
|---|---|---|
| **React** | A library for building user interfaces from reusable "components" | The most popular way to build web apps |
| **Vite** | A build tool + development server | Starts instantly, reloads the page when code changes |
| **TypeScript** | JavaScript with types | Catches mistakes before you run the code |
| **Tailwind CSS** | Styling with small ready-made classes | Fast, good-looking, works on phones |
| **Vitest** | A testing tool | Checks our scoring maths is correct |
| **iTunes Search API** | Apple's public movie catalogue | 🎬 Movie search — no key needed |
| **TVmaze API** | Free TV show database | 📺 Series search — no key needed |
| **Jikan API** | Free anime database (MyAnimeList data) | 🍥 Anime search — no key needed |
| **Open Library API** | Free book database | 📚 Book search — no key needed |
| *(optional later)* **TMDB API** | Bigger movie + TV database | Upgrade if we want more titles — free key needed |
| **Supabase** | Online database | So friends share the same club (Day 2) |
| **Git + GitHub + Vercel** | Version control + code hosting + website hosting | To save progress and put the app online (Day 2) |

---

## 2. Screens

1. **Club home** — who's watching what now, recent ratings, "Most loved" and "Most divisive"
2. **Search** — type a name, see posters and details, click "Add to club list"
3. **Club list** — every title with filters (type, status, genre) and sorting
4. **Title details** — description, each member's status and progress, ratings and reviews
5. **Tonight's pick** 🎡 — choose who's here and your mood, get the top 3 and spin the wheel
6. **Stats** — favourite genres, hours watched, taste match % between members

---

## 3. Data design (what we store)

```
Member   { id, name, avatarColor }
Title    { id, source ("movie" | "series" | "anime" | "book"), externalId, name, image,
           year, genres[], length (episodes / minutes / pages), addedBy }
Entry    { memberId, titleId, status ("want" | "watching" | "completed" | "dropped"),
           progress, rating (1–10 or empty), review, updatedAt }
```

One **Entry** = one member's relationship with one title.
Example: *Priya is watching Frieren, at episode 12, no rating yet.*

---

## 4. The "Tonight's pick" algorithm (the smart part)

For every title that **nobody present has completed**:

```
score = 3 × (how many present members want it)
      + 2 × (how well its genres match the genres those members rated highly)
      + 1 × (group's average rating of similar titles)
      − penalty if it doesn't fit the time available
```

Show the top 3 → spin the wheel to pick one.

**Taste match %** between two members = how close their ratings are on titles both rated.

---

## 5. Build steps

### Day 1 — core (works on your computer only)
- [ ] 4. Create the React project and install libraries
- [ ] 5. Search all four types — movies, series, anime, books — with type tabs
- [ ] 6. Club list, status tracking, ratings (saved in the browser for now)
- [ ] 7. First Git commit

### Day 2 — social and smart
- [ ] 8. Members + Tonight's pick 🎡
- [ ] 9. Stats dashboard + tests
- [ ] 10. Shared online database (Supabase)
- [ ] 11. Deploy online (GitHub + Vercel)
- [ ] 12. Share with friends, collect feedback, improve

---

## 6. Decisions (change any of these!)
- App name: **WatchParty Club**
- Types: **movies, TV series, anime and books — all from Day 1** (no API keys needed)
- Ratings: **1–10**
- Theme: **dark mode by default**, with a light-mode toggle
