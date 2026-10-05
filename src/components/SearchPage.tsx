import { Check, Search as SearchIcon } from 'lucide-react'
import { TypeIcon } from './icons'
import { useEffect, useRef, useState } from 'react'
import { SEARCHERS } from '../api/search'
import { flyToClub } from '../effects/flyToClub'
import { AddedTray } from './AddToClub'
import { CinemaHero, HowItWorks, NowShowing, WorldCinemaStrip, type HomeTarget } from './home/Home'
import { useDebounce } from '../hooks/useDebounce'
import { FOCUS_SEARCH_EVENT } from '../lib/events'
import { genreOptions, matchesGenre } from '../lib/genres'
import { useClub } from '../store/ClubContext'
import { LENGTH_UNIT, MEDIA_TYPES, TYPE_STYLE, type MediaType, type SearchResult } from '../types'
import { Pill, PillRow, Poster, Select, TypeBadge } from './ui'

type Tab = MediaType | 'all'
type Sort = 'match' | 'rating' | 'newest'

/** Apply the sort and genre filters to one section's results. */
function refine(results: SearchResult[], sort: Sort, genre: string): SearchResult[] {
  const list = genre ? results.filter((r) => matchesGenre(r.genres, genre)) : [...results]
  if (sort === 'rating') list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
  if (sort === 'newest') list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
  return list
}

interface SectionState {
  status: 'loading' | 'done' | 'error'
  results: SearchResult[]
  error?: string
}

/** Quick-start ideas shown before the user types anything. */
const IDEAS: { type: MediaType; query: string }[] = [
  { type: 'movie', query: 'Interstellar' },
  { type: 'series', query: 'Breaking Bad' },
  { type: 'anime', query: 'Frieren' },
  { type: 'book', query: 'Harry Potter' },
]

export function SearchPage({ onNavigate }: { onNavigate: (page: HomeTarget) => void }) {
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchBarRef = useRef<HTMLDivElement>(null)
  /** Titles added during this visit — shown in the "Recently added" tray */
  const [addedIds, setAddedIds] = useState<string[]>([])
  const [sections, setSections] = useState<Partial<Record<MediaType, SectionState>>>({})
  const [sort, setSort] = useState<Sort>('match')
  const [genre, setGenre] = useState('')
  const debouncedQuery = useDebounce(query.trim())

  const activeTypes: MediaType[] = tab === 'all' ? MEDIA_TYPES.map((m) => m.type) : [tab]
  // The full genre list for the chosen type(s), each with how many results match it right now
  const found = activeTypes.flatMap((t) => sections[t]?.results ?? [])
  const genreList = genreOptions(activeTypes).map((g) => ({ name: g, count: found.filter((r) => matchesGenre(r.genres, g)).length }))
  const searching = debouncedQuery.length >= 2
  /**
   * Search mode starts as soon as you tap the search bar, and only ends with ← Back
   * (or the phone's back button). So the bar never jumps while results load, and
   * clearing the text keeps you here, ready for the next search.
   */
  const [searchMode, setSearchMode] = useState(false)

  const enterSearch = () => {
    if (searchMode) return
    setSearchMode(true)
    // An entry in the browser's history, so the phone's back button leaves search mode
    history.pushState({ watchpartySearch: true }, '')
    window.scrollTo({ top: 0 })
  }
  const leaveSearch = () => {
    if (history.state?.watchpartySearch) history.back() // the popstate listener below does the rest
    else {
      setSearchMode(false)
      setQuery('')
      setTab('all')
      setAddedIds([])
      setSort('match')
      setGenre('')
    }
  }

  // The Discover tab was tapped: the home screen, scrolled down to the search bar
  useEffect(() => {
    const focus = () => {
      if (searchMode) leaveSearch() // back to the home screen
      // Once the home screen has drawn: scroll so the search bar sits just under the sticky header
      setTimeout(() => {
        const bar = searchBarRef.current
        if (!bar) return
        const header = document.querySelector('header')?.getBoundingClientRect().height ?? 0
        window.scrollTo({ top: bar.getBoundingClientRect().top + window.scrollY - header - 12, behavior: 'smooth' })
      }, 120)
    }
    window.addEventListener(FOCUS_SEARCH_EVENT, focus)
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, focus)
    // leaveSearch only depends on searchMode, so re-subscribe when that changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode])

  useEffect(() => {
    const onBack = () => {
      setSearchMode(false)
      setQuery('')
      setTab('all')
      setAddedIds([])
      setSort('match')
      setGenre('')
    }
    window.addEventListener('popstate', onBack)
    return () => window.removeEventListener('popstate', onBack)
  }, [])

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSections({})
      return
    }
    // If the user types again, cancel the searches that are still running.
    const controller = new AbortController()
    const types: MediaType[] = tab === 'all' ? MEDIA_TYPES.map((m) => m.type) : [tab]
    setSections(Object.fromEntries(types.map((t) => [t, { status: 'loading', results: [] }])))

    // All databases are asked at the same time; each section fills in when its answer arrives.
    for (const type of types) {
      SEARCHERS[type](debouncedQuery, controller.signal)
        .then((results) => setSections((s) => ({ ...s, [type]: { status: 'done', results } })))
        .catch((err: Error) => {
          if (controller.signal.aborted) return
          setSections((s) => ({ ...s, [type]: { status: 'error', results: [], error: err.message } }))
        })
    }
    return () => controller.abort()
  }, [debouncedQuery, tab])

  return (
    <div className="mx-auto max-w-6xl px-4 pb-6">
      {!searchMode && <CinemaHero onNavigate={onNavigate} onStart={() => inputRef.current?.focus()} />}

      <div ref={searchBarRef} className={`flex items-center gap-2 ${searchMode ? 'pt-5' : 'pt-8'}`}>
        {searchMode && (
          <button
            onClick={leaveSearch}
            aria-label="Back to home"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xl transition hover:border-gold hover:text-accent"
          >
            ←
          </button>
        )}
        <div className="relative min-w-0 flex-1">
          <SearchIcon size={20} aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onFocus={enterSearch}
            onChange={(e) => {
              enterSearch()
              setQuery(e.target.value)
            }}
            enterKeyHint="search"
            placeholder="Search a movie, series, anime or book…"
            className="w-full rounded-full border border-line bg-surface/95 py-4 pl-14 pr-12 text-lg shadow-2xl shadow-black/40 outline-none backdrop-blur transition placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/15"
          />
          {query && (
            <button
              // Clearing keeps you in search mode, with the cursor back in the box
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full px-2 text-muted hover:text-cream"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Narrow down by type — only once there's something to narrow down */}
      {searchMode && searching && (
        <PillRow className="mt-4">
          {[{ type: 'all' as const, label: 'All' }, ...MEDIA_TYPES].map((m) => (
            <Pill key={m.type} active={tab === m.type} onClick={() => setTab(m.type)}>
              <span className="flex items-center gap-1.5">
                {m.type !== 'all' && <TypeIcon type={m.type} size={14} />}
                {m.label}
              </span>
            </Pill>
          ))}
        </PillRow>
      )}
      {/* Sort and genre — work on whatever the search found */}
      {searchMode && searching && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-md">
          <Select label="Sort results" value={sort} onChange={(v) => setSort(v as Sort)}>
            <option value="match">Best match</option>
            <option value="rating">★ Top rated</option>
            <option value="newest">Newest first</option>
          </Select>
          <Select label="Genre" value={genre} onChange={setGenre}>
            <option value="">All genres</option>
            {genreList.map((g) => (
              <option key={g.name} value={g.name}>
                {g.name}
                {g.count ? ` (${g.count})` : ''}
              </option>
            ))}
          </Select>
        </div>
      )}

      {searchMode && !searching ? (
        <p className="mt-10 text-center text-sm text-muted">
          {query.trim().length === 1 ? 'Keep typing…' : 'Type a title — results show up right here, under the search bar.'}
        </p>
      ) : !searchMode ? (
        <div className="mt-10">
          <p className="text-center text-sm text-muted">Not sure where to start? Try one:</p>
          <div className="mx-auto mt-4 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {IDEAS.map((idea) => {
              const meta = MEDIA_TYPES.find((m) => m.type === idea.type)!
              return (
                <button
                  key={idea.query}
                  onClick={() => {
                    enterSearch()
                    setQuery(idea.query)
                  }}
                  className={`group rounded-2xl border border-line bg-surface p-4 text-left transition hover:-translate-y-1 hover:shadow-xl ${TYPE_STYLE[idea.type].hover}`}
                >
                  <TypeIcon type={idea.type} size={26} strokeWidth={1.75} className={TYPE_STYLE[idea.type].text} />
                  <div className={`mt-3 text-xs font-semibold ${TYPE_STYLE[idea.type].text}`}>{meta.label}</div>
                  <div className="font-display font-bold">{idea.query}</div>
                </button>
              )
            })}
          </div>

          <WorldCinemaStrip />
          <NowShowing onNavigate={onNavigate} onSearch={() => inputRef.current?.focus()} />
          <HowItWorks />
        </div>
      ) : (
        activeTypes.map((type) => (
          <ResultSection
            key={type}
            type={type}
            state={sections[type]}
            results={refine(sections[type]?.results ?? [], sort, genre)}
            limit={tab === 'all' ? 6 : Infinity}
            showHeading={tab === 'all'}
            onSeeAll={() => {
              setTab(type)
              window.scrollTo({ top: 0 })
            }}
            onOpenClub={() => onNavigate('club')}
            addedIds={addedIds}
            onAdded={(id) => setAddedIds((ids) => [...ids.filter((x) => x !== id), id])}
            onUndone={(id) => setAddedIds((ids) => ids.filter((x) => x !== id))}
          />
        ))
      )}

      {/* "Added to the club" — only while searching, never on the home screen */}
      {searchMode && <AddedTray ids={addedIds} onOpenClub={() => onNavigate('club')} onClear={() => setAddedIds([])} />}
    </div>
  )
}

function ResultSection({
  type,
  state,
  results,
  limit,
  showHeading,
  onSeeAll,
  onOpenClub,
  addedIds,
  onAdded,
  onUndone,
}: {
  type: MediaType
  state?: SectionState
  /** This section's results after the sort and genre filters */
  results: SearchResult[]
  limit: number
  showHeading: boolean
  onSeeAll: () => void
  onOpenClub: () => void
  addedIds: string[]
  onAdded: (id: string) => void
  onUndone: (id: string) => void
}) {
  const meta = MEDIA_TYPES.find((m) => m.type === type)!
  return (
    <section className="mt-10">
      {showHeading && (
        <h2 className="mb-4 flex items-center gap-2.5 text-xl font-bold">
          <span className={`h-2.5 w-2.5 rounded-full ${TYPE_STYLE[type].dot}`} />
          <TypeIcon type={type} size={20} /> {meta.label}
          {state?.status === 'done' && results.length > 0 && <span className="text-sm font-medium text-muted">{results.length} found</span>}
          {state?.status === 'done' && results.length > limit && (
            <button
              onClick={onSeeAll}
              className="ml-auto rounded-full border border-line px-3 py-1 text-sm font-semibold text-soft transition hover:border-gold hover:text-cream"
            >
              See all {results.length} →
            </button>
          )}
        </h2>
      )}
      {!state || state.status === 'loading' ? (
        <CardGrid>
          {Array.from({ length: Math.min(limit, 6) }, (_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="aspect-[2/3] bg-raised" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-4/5 rounded bg-raised" />
                <div className="h-3 w-1/2 rounded bg-raised" />
              </div>
            </div>
          ))}
        </CardGrid>
      ) : state.status === 'error' ? (
        <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">{state.error}</p>
      ) : results.length === 0 ? (
        <p className="text-muted">{state.results.length > 0 ? 'Nothing here matches this genre.' : 'Nothing found here.'}</p>
      ) : (
        <CardGrid>
          {results.slice(0, limit).map((r) => (
            <ResultCard
              key={r.id}
              result={r}
              onOpenClub={onOpenClub}
              justAdded={addedIds.includes(r.id)}
              onAdded={onAdded}
              onUndone={onUndone}
            />
          ))}
        </CardGrid>
      )}
    </section>
  )
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{children}</div>
}

function ResultCard({
  result,
  onOpenClub,
  justAdded,
  onAdded,
  onUndone,
}: {
  result: SearchResult
  onOpenClub: () => void
  /** Added during this search: offer an Undo right under the button */
  justAdded: boolean
  onAdded: (id: string) => void
  onUndone: (id: string) => void
}) {
  const { data, add, remove } = useClub()
  const inClub = Boolean(data.titles[result.id])
  const posterRef = useRef<HTMLDivElement>(null)

  const addToClub = () => {
    add(result)
    onAdded(result.id)
    // The poster flies up into the 🎟️ Club tab, so you can see where it went.
    if (posterRef.current) flyToClub(posterRef.current, result.image, MEDIA_TYPES.find((m) => m.type === result.type)!.emoji)
  }
  const details = [
    result.year,
    result.length ? `${result.length} ${LENGTH_UNIT[result.type]}` : undefined,
  ].filter(Boolean)

  return (
    <article
      className={`group animate-pop flex flex-col overflow-hidden rounded-2xl border bg-surface transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
        inClub ? 'border-book/60' : `border-line ${TYPE_STYLE[result.type].hover}`
      }`}
    >
      <div ref={posterRef} className="relative overflow-hidden">
        <Poster src={result.image} type={result.type} className="aspect-[2/3] transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/10 to-transparent" />
        <TypeBadge type={result.type} className="absolute left-2 top-2 backdrop-blur-md" />
        {details.length > 0 && (
          <span className="absolute bottom-2 left-2 text-xs font-medium text-soft">{details.join(' · ')}</span>
        )}
        {/* A ribbon that stays on the poster once it's in your club */}
        {inClub && (
          <div className="animate-pop absolute -right-9 top-5 rotate-45 bg-book px-9 py-1 text-[10px] font-extrabold tracking-wider text-ink shadow-lg">
            IN THE CLUB
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 font-bold leading-tight">{result.title}</h3>
        {result.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{result.subtitle}</p>}
        {result.rating !== undefined && <p className="mt-1 text-xs font-semibold text-star">★ {result.rating}/10</p>}
        <div className="mt-2 flex flex-wrap gap-1">
          {result.genres.slice(0, 2).map((g) => (
            <span key={g} className="rounded-full bg-raised px-2 py-0.5 text-[10px] text-soft">
              {g}
            </span>
          ))}
        </div>
        {/* A big, obvious button that says what it does — and once added, takes you there */}
        <div className="relative mt-auto pt-3">
          {inClub ? (
            <button
              onClick={onOpenClub}
              className="flex w-full flex-col items-center rounded-xl border-2 border-book/70 bg-book/15 px-1 py-1.5 text-book transition hover:bg-book/25 active:scale-95"
            >
              <span className="flex items-center gap-1.5">
                <Check size={16} strokeWidth={3} aria-hidden="true" />
                <span className="whitespace-nowrap text-[13px] font-extrabold sm:text-sm">On the shelf</span>
              </span>
              <span className="text-[10px] font-semibold opacity-80">Open the club shelf →</span>
            </button>
          ) : (
            <button
              onClick={addToClub}
              aria-label={`Add ${result.title} to the club`}
              className="group/add relative flex w-full flex-col items-center overflow-hidden rounded-xl bg-gold px-1 py-1.5 text-on-gold transition hover:brightness-110 active:scale-95"
            >
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/15 text-base font-black leading-none transition duration-300 group-hover/add:rotate-90">
                  +
                </span>
                <span className="whitespace-nowrap text-[13px] font-extrabold sm:text-sm">Add to club</span>
              </span>
              {/* A soft light sweeps across now and then, inviting a tap */}
              <span className="animate-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-white/35" />
            </button>
          )}
          {inClub && justAdded && (
            <button
              onClick={() => {
                remove(result.id)
                onUndone(result.id)
              }}
              className="mt-1.5 w-full text-center text-xs font-semibold text-muted transition hover:text-cream"
            >
              ↩ Undo
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
