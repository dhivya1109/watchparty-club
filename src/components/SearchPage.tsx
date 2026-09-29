import { useEffect, useState } from 'react'
import { SEARCHERS } from '../api/search'
import { useDebounce } from '../hooks/useDebounce'
import { LENGTH_UNIT, MEDIA_TYPES, type MediaType, type SearchResult } from '../types'

type Tab = MediaType | 'all'

interface SectionState {
  status: 'loading' | 'done' | 'error'
  results: SearchResult[]
  error?: string
}

export function SearchPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [sections, setSections] = useState<Partial<Record<MediaType, SectionState>>>({})
  const debouncedQuery = useDebounce(query.trim())

  const activeTypes: MediaType[] = tab === 'all' ? MEDIA_TYPES.map((m) => m.type) : [tab]

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSections({})
      return
    }
    // If the user types again, cancel the searches that are still running.
    const controller = new AbortController()
    setSections(Object.fromEntries(activeTypes.map((t) => [t, { status: 'loading', results: [] }])))

    // All databases are asked at the same time; each section fills in when its answer arrives.
    for (const type of activeTypes) {
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a movie, series, anime or book…"
        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-lg outline-none focus:border-violet-500"
      />

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {[{ type: 'all' as const, emoji: '✨', label: 'All' }, ...MEDIA_TYPES].map((m) => (
          <button
            key={m.type}
            onClick={() => setTab(m.type)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm border transition ${
              tab === m.type
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {debouncedQuery.length < 2 ? (
        <p className="mt-16 text-center text-slate-500">
          Try “Interstellar”, “Breaking Bad”, “Frieren” or “Harry Potter”.
        </p>
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
    <section className="mt-8">
      {showHeading && (
        <h2 className="mb-3 text-lg font-semibold">
          {meta.emoji} {meta.label}
        </h2>
      )}
      {!state || state.status === 'loading' ? (
        <p className="text-slate-500 animate-pulse">Searching…</p>
      ) : state.status === 'error' ? (
        <p className="rounded-lg bg-red-950/50 border border-red-900 px-4 py-3 text-red-300 text-sm">
          ⚠️ {state.error}
        </p>
      ) : state.results.length === 0 ? (
        <p className="text-slate-500">No results.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {state.results.slice(0, limit).map((r) => (
            <ResultCard key={r.id} result={r} />
          ))}
        </div>
      )}
    </section>
  )
}

function ResultCard({ result }: { result: SearchResult }) {
  const meta = MEDIA_TYPES.find((m) => m.type === result.type)!
  const details = [
    result.year,
    result.length ? `${result.length} ${LENGTH_UNIT[result.type]}` : undefined,
  ].filter(Boolean)

  return (
    <article className="group overflow-hidden rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500 transition">
      <div className="aspect-[2/3] bg-slate-800">
        {result.image ? (
          <img src={result.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">{meta.emoji}</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium leading-tight line-clamp-2">{result.title}</h3>
        {result.subtitle && <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{result.subtitle}</p>}
        {details.length > 0 && <p className="mt-1 text-xs text-slate-500">{details.join(' · ')}</p>}
        <div className="mt-2 flex flex-wrap gap-1">
          {result.genres.slice(0, 2).map((g) => (
            <span key={g} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
              {g}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}
