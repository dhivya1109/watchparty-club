import { useEffect, useRef, useState } from 'react'
import { SEARCHERS } from '../api/search'
import { CinemaHero, HowItWorks, NowShowing, WorldCinemaStrip, type HomeTarget } from './home/Home'
import { useDebounce } from '../hooks/useDebounce'
import { useClub } from '../store/ClubContext'
import { LENGTH_UNIT, MEDIA_TYPES, TYPE_STYLE, type MediaType, type SearchResult } from '../types'
import { Pill, Poster, TypeBadge } from './ui'

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
      {!searching && (
        <CinemaHero
          onNavigate={onNavigate}
          onStart={() => {
            inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            inputRef.current?.focus({ preventScroll: true })
          }}
        />
      )}

      <div className={searching ? 'pt-6' : 'pt-8'}>
        <div className="relative">
          <span className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-xl">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a movie, series, anime or book…"
            className="w-full rounded-full border border-line bg-surface/95 py-4 pl-14 pr-12 text-lg shadow-2xl shadow-black/40 outline-none backdrop-blur transition placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/15"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full px-2 text-muted hover:text-cream"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {[{ type: 'all' as const, emoji: '✨', label: 'All' }, ...MEDIA_TYPES].map((m) => (
          <Pill key={m.type} active={tab === m.type} onClick={() => setTab(m.type)}>
            {m.emoji} {m.label}
          </Pill>
        ))}
      </div>

      {!searching ? (
        <div className="mt-10">
          <p className="text-center text-sm text-muted">Not sure where to start? Try one:</p>
          <div className="mx-auto mt-4 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {IDEAS.map((idea) => {
              const meta = MEDIA_TYPES.find((m) => m.type === idea.type)!
              return (
                <button
                  key={idea.query}
                  onClick={() => setQuery(idea.query)}
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
}: {
  type: MediaType
  state?: SectionState
  limit: number
  showHeading: boolean
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
            <ResultCard key={r.id} result={r} />
          ))}
        </CardGrid>
      )}
    </section>
  )
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{children}</div>
}

function ResultCard({ result }: { result: SearchResult }) {
  const { data, add } = useClub()
  const inClub = Boolean(data.titles[result.id])
  const details = [
    result.year,
    result.length ? `${result.length} ${LENGTH_UNIT[result.type]}` : undefined,
  ].filter(Boolean)

  return (
    <article
      className={`group animate-pop overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${TYPE_STYLE[result.type].hover}`}
    >
      <div className="relative">
        <Poster src={result.image} type={result.type} className="aspect-[2/3] transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/10 to-transparent" />
        <TypeBadge type={result.type} className="absolute left-2 top-2 backdrop-blur-md" />
        {details.length > 0 && (
          <span className="absolute bottom-2 left-2 text-xs font-medium text-soft">{details.join(' · ')}</span>
        )}
        <button
          onClick={() => add(result)}
          disabled={inClub}
          aria-label={inClub ? 'Already in the club' : `Add ${result.title} to the club`}
          title={inClub ? 'In your club' : 'Add to club'}
          className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold shadow-lg transition ${
            inClub
              ? 'cursor-default bg-book text-ink'
              : 'bg-gold text-ink shadow-gold/30 hover:scale-110 active:scale-95'
          }`}
        >
          {inClub ? '✓' : '+'}
        </button>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 font-bold leading-tight">{result.title}</h3>
        {result.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{result.subtitle}</p>}
        <div className="mt-2 flex flex-wrap gap-1">
          {result.genres.slice(0, 2).map((g) => (
            <span key={g} className="rounded-full bg-raised px-2 py-0.5 text-[10px] text-soft">
              {g}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}
