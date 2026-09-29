import { useState } from 'react'
import { getEntry, STATUSES, type ClubTitle, type Entry, type Status } from '../lib/club'
import { ME, useClub } from '../store/ClubContext'
import { LENGTH_UNIT, MEDIA_TYPES, type MediaType } from '../types'

type Sort = 'recent' | 'title' | 'rating'

export function ClubPage({ onGoSearch }: { onGoSearch: () => void }) {
  const { data } = useClub()
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [sort, setSort] = useState<Sort>('recent')

  const items = Object.values(data.titles).map((title) => ({
    title,
    entry: getEntry(data, ME, title.id),
  }))

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-5xl">🍿</div>
        <h2 className="mt-4 text-xl font-semibold">Your club list is empty</h2>
        <p className="mt-2 text-slate-400">Search for something you watched or want to watch and press “+ Add”.</p>
        <button onClick={onGoSearch} className="mt-6 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2 font-medium">
          🔍 Go to search
        </button>
      </div>
    )
  }

  const shown = items
    .filter((i) => typeFilter === 'all' || i.title.type === typeFilter)
    .filter((i) => statusFilter === 'all' || i.entry?.status === statusFilter)
    .sort((a, b) => {
      if (sort === 'title') return a.title.title.localeCompare(b.title.title)
      if (sort === 'rating') return (b.entry?.rating ?? 0) - (a.entry?.rating ?? 0)
      return b.title.addedAt.localeCompare(a.title.addedAt)
    })

  const countByStatus = (s: Status) => items.filter((i) => i.entry?.status === s).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Summary: one tile per status — also works as a filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(statusFilter === s.value ? 'all' : s.value)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              statusFilter === s.value ? 'border-violet-500 bg-violet-950/40' : 'border-slate-800 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl font-bold">{countByStatus(s.value)}</div>
            <div className="text-sm text-slate-400">
              {s.emoji} {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Filters and sorting */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[{ type: 'all' as const, emoji: '✨', label: 'All' }, ...MEDIA_TYPES].map((m) => (
          <button
            key={m.type}
            onClick={() => setTypeFilter(m.type)}
            className={`rounded-full px-3 py-1 text-sm border transition ${
              typeFilter === m.type ? 'bg-violet-600 border-violet-500' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {m.emoji} {m.label}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="ml-auto rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm"
        >
          <option value="recent">Recently added</option>
          <option value="title">Title A–Z</option>
          <option value="rating">Highest rated</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">Nothing matches these filters.</p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {shown.map(({ title, entry }) => (
            <ClubCard key={title.id} title={title} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClubCard({ title, entry }: { title: ClubTitle; entry?: Entry }) {
  const { update, remove } = useClub()
  const meta = MEDIA_TYPES.find((m) => m.type === title.type)!
  const status = entry?.status ?? 'want'
  const progress = entry?.progress ?? 0
  const hasProgress = title.type !== 'movie'
  const unit = LENGTH_UNIT[title.type]

  return (
    <article className="flex gap-4 rounded-xl bg-slate-900 border border-slate-800 p-3">
      <div className="w-24 shrink-0 aspect-[2/3] overflow-hidden rounded-lg bg-slate-800">
        {title.image ? (
          <img src={title.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">{meta.emoji}</div>
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-tight line-clamp-2">{title.title}</h3>
            <p className="text-xs text-slate-400">
              {meta.emoji} {meta.label.replace(/s$/, '')}
              {title.year ? ` · ${title.year}` : ''}
              {title.subtitle ? ` · ${title.subtitle}` : ''}
            </p>
          </div>
          <button
            onClick={() => confirm(`Remove “${title.title}” from the club?`) && remove(title.id)}
            title="Remove"
            className="text-slate-500 hover:text-red-400 px-1"
          >
            ✕
          </button>
        </div>

        <select
          value={status}
          onChange={(e) => update(title.id, { status: e.target.value as Status })}
          className="w-fit rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.emoji} {s.label}
            </option>
          ))}
        </select>

        {hasProgress && (
          <div>
            <div className="flex items-center gap-2 text-sm">
              <StepButton label="−" onClick={() => update(title.id, { progress: progress - 1 })} />
              <span className="tabular-nums">
                {progress}
                {title.length ? ` / ${title.length}` : ''} {unit}
              </span>
              <StepButton label="+" onClick={() => update(title.id, { progress: progress + 1 })} />
            </div>
            {title.length ? (
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-violet-500 transition-all" style={{ width: `${(progress / title.length) * 100}%` }} />
              </div>
            ) : null}
          </div>
        )}

        <RatingPicker value={entry?.rating ?? null} onChange={(rating) => update(title.id, { rating })} />
      </div>
    </article>
  )
}

function StepButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-7 w-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700">
      {label}
    </button>
  )
}

/** Ten small stars; clicking the current rating again clears it. */
function RatingPicker({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value ?? 0
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(value === n ? null : n)}
            aria-label={`Rate ${n} out of 10`}
            className={`text-base leading-none px-px transition ${n <= shown ? 'text-amber-400' : 'text-slate-700'}`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-400 tabular-nums">{value ? `${value}/10` : 'Rate'}</span>
    </div>
  )
}
