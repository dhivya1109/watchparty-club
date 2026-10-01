import { useEffect, useRef, useState } from 'react'
import { SEARCHERS } from '../api/search'
import { ClubExplainer } from './AddToClub'
import { CinemaHero, HowItWorks, NowShowing, WorldCinemaStrip, type HomeTarget } from './home/Home'
import { useDebounce } from '../hooks/useDebounce'
import { useClub } from '../store/ClubContext'
import { LENGTH_UNIT, MEDIA_TYPES, TYPE_STYLE, type MediaType, type SearchResult } from '../types'
import { Pill, PillRow, Poster, TypeBadge } from './ui'

type Tab = MediaType | 'all'

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
  const [sections, setSections] = useState<Partial<Record<MediaType, SectionState>>>({})
  const debouncedQuery = useDebounce(query.trim())

  const activeTypes: MediaType[] = tab === 'all' ? MEDIA_TYPES.map((m) => m.type) : [tab]
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
    }
  }

  useEffect(() => {
    const onBack = () => {
      setSearchMode(false)
      setQuery('')
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

      <div className={`flex items-center gap-2 ${searchMode ? 'pt-5' : 'pt-8'}`}>
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
          <span className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-xl">🔍</span>
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

      <PillRow className="mt-4">
        {[{ type: 'all' as const, emoji: '✨', label: 'All' }, ...MEDIA_TYPES].map((m) => (
          <Pill key={m.type} active={tab === m.type} onClick={() => setTab(m.type)}>
            {m.emoji} {m.label}
          </Pill>
        ))}
      </PillRow>

      <ClubExplainer />

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
                  <div className="text-3xl transition group-hover:scale-110">{meta.emoji}</div>
                  <div className={`mt-3 text-xs font-semibold ${TYPE_STYLE[idea.type].text}`}>{meta.label}</div>
                  <div className="font-display font-bold">{idea.query}</div>
                </button>
              )
            })}
          </div>

          <WorldCinemaStrip />
          <NowShowing onNavigate={onNavigate} />
          <HowItWorks />
        </div>
      ) : (
        activeTypes.map((type) => (
          <ResultSection
            key={type}
            type={type}
            state={sections[type]}
            limit={tab === 'all' ? 6 : 12}
            showHeading={tab === 'all'}
            onOpenClub={() => onNavigate('club')}
          />
        ))
      )}
    </div>
  )
}

function ResultSection({
  type,
  state,
  limit,
  showHeading,
  onOpenClub,
}: {
  type: MediaType
  state?: SectionState
  limit: number
  showHeading: boolean
  onOpenClub: () => void
}) {
  const meta = MEDIA_TYPES.find((m) => m.type === type)!
  return (
    <section className="mt-10">
      {showHeading && (
        <h2 className="mb-4 flex items-center gap-2.5 text-xl font-bold">
          <span className={`h-2.5 w-2.5 rounded-full ${TYPE_STYLE[type].dot}`} />
          {meta.emoji} {meta.label}
          {state?.status === 'done' && state.results.length > 0 && (
            <span className="text-sm font-medium text-muted">{Math.min(limit, state.results.length)} found</span>
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
        <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">⚠️ {state.error}</p>
      ) : state.results.length === 0 ? (
        <p className="text-muted">Nothing found here.</p>
      ) : (
        <CardGrid>
          {state.results.slice(0, limit).map((r) => (
            <ResultCard key={r.id} result={r} onOpenClub={onOpenClub} />
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
}: {
  result: SearchResult
  onOpenClub: () => void
}) {
  const { data, add } = useClub()
  const inClub = Boolean(data.titles[result.id])
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
      <div className="relative overflow-hidden">
        <Poster src={result.image} type={result.type} className="aspect-[2/3] transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/10 to-transparent" />
        <TypeBadge type={result.type} className="absolute left-2 top-2 backdrop-blur-md" />
        {details.length > 0 && (
          <span className="absolute bottom-2 left-2 text-xs font-medium text-soft">{details.join(' · ')}</span>
        )}
        {/* A ribbon that stays on the poster once it's in your club */}
        {inClub && (
          <div className="absolute -right-9 top-5 rotate-45 bg-book px-9 py-1 text-[10px] font-extrabold tracking-wider text-ink shadow-lg">
            IN THE CLUB
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 font-bold leading-tight">{result.title}</h3>
        {result.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{result.subtitle}</p>}
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
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-book text-xs font-black text-ink">✓</span>
                <span className="whitespace-nowrap text-[13px] font-extrabold sm:text-sm">On the shelf</span>
              </span>
              <span className="text-[10px] font-semibold opacity-80">Open the club shelf →</span>
            </button>
          ) : (
            <button
              onClick={() => add(result)}
              aria-label={`Add ${result.title} to the club`}
              className="flex w-full flex-col items-center rounded-xl bg-gradient-to-b from-gold to-gold-deep px-1 py-1.5 text-on-gold shadow-lg shadow-gold/30 transition hover:brightness-110 active:scale-95"
            >
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/15 text-base font-black leading-none">
                  +
                </span>
                <span className="whitespace-nowrap text-[13px] font-extrabold sm:text-sm">Add to club</span>
              </span>
              <span className="text-[10px] font-semibold opacity-75">Share it · rate · review</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
