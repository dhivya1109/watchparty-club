import { useState } from 'react'
import { averageRating, getEntry, STATUSES, type ClubTitle, type Entry, type Status } from '../lib/club'
import { useClub } from '../store/ClubContext'
import { LENGTH_UNIT, MEDIA_TYPES, type MediaType } from '../types'
import { Avatar } from './Avatar'
import { EmptyState, Pill, Poster, TypeBadge } from './ui'

type Sort = 'recent' | 'title' | 'rating'

export function ClubPage({ onGoSearch }: { onGoSearch: () => void }) {
  const { data, me } = useClub()
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [sort, setSort] = useState<Sort>('recent')

  const items = Object.values(data.titles).map((title) => ({
    title,
    entry: getEntry(data, me.id, title.id),
  }))

  if (items.length === 0) {
    return (
      <EmptyState
        emoji="🎟️"
        title="Your shelf is empty"
        text="Find something you’ve watched or want to watch, and tap the gold + to add it."
        action="🔍 Start discovering"
        onAction={onGoSearch}
      />
    )
  }

  const shown = items
    .filter((i) => typeFilter === 'all' || i.title.type === typeFilter)
    .filter((i) => statusFilter === 'all' || (i.entry?.status ?? 'want') === statusFilter)
    .sort((a, b) => {
      if (sort === 'title') return a.title.title.localeCompare(b.title.title)
      if (sort === 'rating') return (b.entry?.rating ?? 0) - (a.entry?.rating ?? 0)
      return b.title.addedAt.localeCompare(a.title.addedAt)
    })

  // A title a friend added has no entry for you yet — that counts as "Want to".
  const countByStatus = (s: Status) => items.filter((i) => (i.entry?.status ?? 'want') === s).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Your shelf</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {me.name}’s tickets <span className="text-muted">· {items.length}</span>
        </h2>
      </div>

      {/* Summary: one tile per status — also works as a filter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => {
          const active = statusFilter === s.value
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(active ? 'all' : s.value)}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                active ? 'border-gold bg-gold/10 shadow-lg shadow-gold/10' : 'border-line bg-surface hover:border-muted'
              }`}
            >
              <span className="absolute -right-2 -top-3 text-6xl opacity-10 transition group-hover:opacity-20">{s.emoji}</span>
              <div className={`font-display text-3xl font-extrabold tabular-nums ${active ? 'text-marquee' : ''}`}>
                {countByStatus(s.value)}
              </div>
              <div className="text-sm text-soft">
                {s.emoji} {s.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters and sorting */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[{ type: 'all' as const, emoji: '✨', label: 'All' }, ...MEDIA_TYPES].map((m) => (
          <Pill key={m.type} active={typeFilter === m.type} onClick={() => setTypeFilter(m.type)}>
            {m.emoji} {m.label}
          </Pill>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort"
          className="ml-auto rounded-full border border-line bg-raised px-4 py-1.5 text-sm text-soft outline-none focus:border-gold"
        >
          <option value="recent">↓ Recently added</option>
          <option value="title">A–Z Title</option>
          <option value="rating">★ Highest rated</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="mt-14 text-center text-muted">Nothing matches these filters.</p>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {shown.map(({ title, entry }) => (
            <ClubCard key={title.id} title={title} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClubCard({ title, entry }: { title: ClubTitle; entry?: Entry }) {
  const { data, me, update, remove } = useClub()
  const groupAverage = averageRating(data, title.id)
  // What the other members think of this title
  const others = data.members
    .filter((m) => m.id !== me.id)
    .map((member) => ({ member, entry: getEntry(data, member.id, title.id) }))
    .filter((o) => o.entry)
  const status = entry?.status ?? 'want'
  const progress = entry?.progress ?? 0
  const hasProgress = title.type !== 'movie'
  const unit = LENGTH_UNIT[title.type]
  const percent = title.length ? Math.round((progress / title.length) * 100) : 0

  return (
    <article className="ticket animate-pop flex gap-4 rounded-3xl border border-line bg-gradient-to-br from-surface to-raised/60 p-3 pl-4 transition hover:border-muted">
      <div className="relative w-24 shrink-0 sm:w-28">
        <Poster src={title.image} type={title.type} className="aspect-[2/3] rounded-2xl shadow-lg shadow-black/40" />
      </div>

      {/* Dashed "tear here" line between the stub and the ticket */}
      <div className="w-px shrink-0 border-l-2 border-dashed border-line" />

      <div className="flex min-w-0 flex-1 flex-col gap-3 py-1 pr-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <TypeBadge type={title.type} />
            <h3 className="mt-1.5 line-clamp-2 text-lg font-bold leading-tight">{title.title}</h3>
            <p className="line-clamp-1 text-xs text-muted">
              {[title.year, title.subtitle].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            onClick={() => confirm(`Remove “${title.title}” from the club?`) && remove(title.id)}
            title="Remove from club"
            aria-label="Remove from club"
            className="rounded-full p-1 text-muted transition hover:bg-coral/15 hover:text-coral"
          >
            ✕
          </button>
        </div>

        {/* Status: four big buttons instead of a small dropdown */}
        <div>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => update(title.id, { status: s.value })}
                title={s.label}
                aria-label={s.label}
                aria-pressed={status === s.value}
                className={`flex h-9 flex-1 items-center justify-center rounded-xl border text-base transition ${
                  status === s.value
                    ? 'border-gold bg-gold/15 shadow-inner'
                    : 'border-line bg-night/40 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                }`}
              >
                {s.emoji}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] font-medium text-soft">{STATUSES.find((s) => s.value === status)!.label}</p>
        </div>

        {hasProgress && (
          <div>
            <div className="flex items-center gap-2 text-sm">
              <StepButton label="−" onClick={() => update(title.id, { progress: progress - 1 })} />
              <span className="font-display font-bold tabular-nums">
                {progress}
                {title.length ? <span className="text-muted"> / {title.length}</span> : ''}
              </span>
              <span className="text-xs text-muted">{unit}</span>
              <StepButton label="+" onClick={() => update(title.id, { progress: progress + 1 })} />
              {title.length ? <span className="ml-auto text-xs font-semibold text-gold">{percent}%</span> : null}
            </div>
            {title.length ? (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-night/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold to-coral transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            ) : null}
          </div>
        )}

        <RatingPicker value={entry?.rating ?? null} onChange={(rating) => update(title.id, { rating })} />

        {(others.length > 0 || groupAverage !== null) && (
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-dashed border-line pt-2.5 text-xs text-soft">
            {groupAverage !== null && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">Group ★ {groupAverage}</span>
            )}
            {others.map(({ member, entry: e }) => (
              <span key={member.id} className="flex items-center gap-1" title={member.name}>
                <Avatar member={member} size={20} />
                {STATUSES.find((s) => s.value === e!.status)!.emoji}
                {e!.rating !== null && <span className="font-semibold text-gold">{e!.rating}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function StepButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-8 w-8 rounded-full border border-line bg-night/40 font-bold transition hover:border-gold hover:text-gold active:scale-90"
    >
      {label}
    </button>
  )
}

/** Ten stars spread across the card (easy to tap); clicking the current rating again clears it. */
function RatingPicker({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value ?? 0
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px] font-medium text-soft">
        <span>Your rating</span>
        <span className={`font-display text-sm font-bold tabular-nums ${value ? 'text-gold' : 'text-muted'}`}>
          {value ? `${value}/10` : 'tap a star'}
        </span>
      </div>
      <div className="mt-0.5 grid grid-cols-10" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(value === n ? null : n)}
            aria-label={`Rate ${n} out of 10`}
            className={`py-1 text-xl leading-none transition hover:scale-125 ${
              n <= shown ? 'text-gold drop-shadow-[0_0_6px_rgb(255_197_61/0.5)]' : 'text-line'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
