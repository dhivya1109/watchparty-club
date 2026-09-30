import { useRef, useState } from 'react'
import {
  addedBy,
  averageRating,
  getEntry,
  previewChange,
  REVIEW_MAX_LENGTH,
  STATUSES,
  type ClubTitle,
  type Entry,
  type EntryChange,
  type Member,
  type Status,
} from '../lib/club'
import { useClub } from '../store/ClubContext'
import { LENGTH_UNIT, MEDIA_TYPES, type MediaType } from '../types'
import { Avatar } from './Avatar'
import { Celebration, CELEBRATION_MS, type CelebrationKind } from './Celebration'
import { EmptyState, Pill, PillRow, Poster, Select, TypeBadge } from './ui'

type Sort = 'recent' | 'title' | 'rating'
export type ShelfView = 'club' | 'mine'

/**
 * 🎟️ Two views of the same club:
 *  - Club shelf: everything anyone added — each marked with whose pick it was
 *  - My list:    only what YOU chose to track (you added it, or picked a status for it)
 */
export function ClubPage({ onGoSearch, initialView = 'club' }: { onGoSearch: () => void; initialView?: ShelfView }) {
  const { data, me, activeClub } = useClub()
  const [view, setView] = useState<ShelfView>(initialView)
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [addedByFilter, setAddedByFilter] = useState<string>('everyone')
  const [sort, setSort] = useState<Sort>('recent')

  const all = Object.values(data.titles).map((title) => ({ title, entry: getEntry(data, me.id, title.id) }))
  const mine = all.filter((i) => i.entry)
  const clubName = data.name ?? activeClub?.name ?? 'your club'

  if (all.length === 0) {
    return (
      <EmptyState
        emoji="🎟️"
        title="The club shelf is empty"
        text={`Be the first! Find something you’ve watched or want to watch, and add it to ${clubName}.`}
        action="🔍 Start discovering"
        onAction={onGoSearch}
      />
    )
  }

  const shown = (view === 'club' ? all : mine)
    .filter((i) => typeFilter === 'all' || i.title.type === typeFilter)
    .filter((i) => view === 'club' || statusFilter === 'all' || i.entry?.status === statusFilter)
    .filter((i) => view === 'mine' || addedByFilter === 'everyone' || i.title.addedBy === addedByFilter)
    .sort((a, b) => {
      if (sort === 'title') return a.title.title.localeCompare(b.title.title)
      if (sort === 'rating') return (b.entry?.rating ?? 0) - (a.entry?.rating ?? 0)
      return b.title.addedAt.localeCompare(a.title.addedAt)
    })

  const countByStatus = (s: Status) => mine.filter((i) => i.entry?.status === s).length
  // Only people who actually added something appear in the "Added by" filter
  const pickers = data.members.filter((m) => all.some((i) => i.title.addedBy === m.id))
  const views: { value: ShelfView; emoji: string; label: string; count: number }[] = [
    { value: 'club', emoji: '🎟️', label: 'Club shelf', count: all.length },
    { value: 'mine', emoji: '👤', label: 'My list', count: mine.length },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">🎬 {clubName}</p>

      {/* The two views, as a big switch */}
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1" role="tablist">
        {views.map((v) => (
          <button
            key={v.value}
            role="tab"
            aria-selected={view === v.value}
            onClick={() => setView(v.value)}
            className={`rounded-xl px-2 py-2.5 font-display text-[clamp(0.95rem,4vw,1.15rem)] font-extrabold transition ${
              view === v.value ? 'bg-gold text-ink shadow-md shadow-gold/25' : 'text-soft hover:bg-raised hover:text-cream'
            }`}
          >
            {v.emoji} {v.label} <span className={view === v.value ? 'opacity-70' : 'text-muted'}>· {v.count}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-soft">
        {view === 'club'
          ? `Everything anyone in ${clubName} added — you can see whose pick each one is.`
          : 'Only what you’re tracking: things you added, or friends’ picks you gave a status.'}
      </p>

      {view === 'mine' && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                <div className={`font-display text-3xl font-extrabold tabular-nums ${active ? 'text-marquee' : ''}`}>{countByStatus(s.value)}</div>
                <div className="text-sm text-soft">
                  {s.emoji} {s.label}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Filters: one swipeable row of types, then the dropdowns side by side at equal width */}
      <PillRow className="mt-5">
        {[{ type: 'all' as const, emoji: '✨', label: 'All' }, ...MEDIA_TYPES].map((m) => (
          <Pill key={m.type} active={typeFilter === m.type} onClick={() => setTypeFilter(m.type)}>
            {m.emoji} {m.label}
          </Pill>
        ))}
      </PillRow>
      <div className={`mt-3 grid gap-2 ${view === 'club' && pickers.length > 0 ? 'grid-cols-2' : 'grid-cols-1 sm:max-w-xs'}`}>
        {view === 'club' && pickers.length > 0 && (
          <Select label="Whose picks" value={addedByFilter} onChange={setAddedByFilter}>
            <option value="everyone">👥 Everyone</option>
            {pickers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === me.id ? '⭐ My picks' : `${m.emoji ?? '🙂'} ${m.name}`}
              </option>
            ))}
          </Select>
        )}
        <Select label="Sort" value={sort} onChange={(v) => setSort(v as Sort)}>
          <option value="recent">↓ Newest</option>
          <option value="title">A–Z</option>
          <option value="rating">★ My top rated</option>
        </Select>
      </div>

      {shown.length === 0 ? (
        view === 'mine' && mine.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-soft">Nothing on your list yet.</p>
            <p className="mt-1 text-sm text-muted">Browse the club shelf and tap a status on anything you like.</p>
            <button
              onClick={() => setView('club')}
              className="mt-4 rounded-full border-2 border-gold/60 px-5 py-2 font-display font-bold text-accent hover:bg-gold/10"
            >
              🎟️ Open the club shelf
            </button>
          </div>
        ) : (
          <p className="mt-14 text-center text-muted">Nothing matches these filters.</p>
        )
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {shown.map(({ title, entry }) => (
            <ClubCard key={title.id} title={title} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClubCard({ title, entry }: { title: ClubTitle; entry?: Entry }) {
  const { data, me, amHost, update, remove } = useClub()
  const [celebration, setCelebration] = useState<{ kind: CelebrationKind; id: number } | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const reactionCount = useRef(0)

  const groupAverage = averageRating(data, title.id)
  // What the other members think of this title
  const others = data.members
    .filter((m) => m.id !== me.id)
    .map((member) => ({ member, entry: getEntry(data, member.id, title.id) }))
    .filter((o) => o.entry)
  const status = entry?.status ?? 'want'
  /** Is this title on MY list? (No entry = a friend's pick you haven't chosen yet.) */
  const onMyList = Boolean(entry)
  const picker = addedBy(data, title)
  const progress = entry?.progress ?? 0
  const hasProgress = title.type !== 'movie'
  const unit = LENGTH_UNIT[title.type]
  const percent = title.length ? Math.round((progress / title.length) * 100) : 0

  const celebrate = (kind: CelebrationKind) => {
    const id = ++reactionCount.current
    setCelebration({ kind, id })
    setTimeout(() => setCelebration((c) => (c?.id === id ? null : c)), CELEBRATION_MS)
  }

  const openReview = () => {
    setDraft(entry?.review ?? '')
    setEditing(true)
  }

  /** Save a change, and play the reaction that fits what changed. */
  const act = (change: EntryChange) => {
    const next = previewChange(entry, change, title.length)
    update(title.id, change)

    let kind: CelebrationKind | null = null
    if (next.status !== status && next.status !== 'want') kind = next.status
    if (change.rating != null) kind = change.rating >= 8 ? 'loved' : change.rating <= 4 ? 'bad' : 'okay'
    if (kind) celebrate(kind)

    // Just finished it? Invite a review.
    if (next.status === 'completed' && status !== 'completed' && !entry?.review) openReview()
  }

  const clubReviews = others.filter((o) => o.entry!.review)

  return (
    // The outer box shakes or glows; the inner "ticket" keeps its notched shape.
    <div
      className={`relative rounded-3xl ${
        celebration?.kind === 'bad' ? 'animate-shake' : celebration?.kind === 'loved' ? 'animate-glow' : ''
      }`}
    >
    <article className="ticket animate-pop flex h-full flex-col rounded-3xl border border-line bg-gradient-to-br from-surface to-raised/60 transition hover:border-muted">
    {/* Whose pick is this, and is it on my list? */}
    <div className="flex items-center gap-2 border-b border-dashed border-line px-4 py-2 text-xs">
      {picker ? <Avatar member={picker} size={22} /> : <span className="text-base">🎟️</span>}
      <span className="min-w-0 truncate text-soft">
        {picker?.id === me.id ? (
          <b className="text-cream">Your pick</b>
        ) : (
          <>
            <b className="text-cream">{picker?.name ?? 'A former member'}</b>’s pick
          </>
        )}
      </span>
      <span
        className={`ml-auto shrink-0 rounded-full px-2 py-0.5 font-semibold ${
          onMyList ? 'bg-book/15 text-book' : 'bg-raised text-muted'
        }`}
      >
        {onMyList ? '✓ On your list' : 'Not on your list'}
      </span>
    </div>
    {/* Top row: poster, title and status — always side by side */}
    <div className="flex gap-3 p-3 pl-4 sm:gap-4">
      <div className="relative w-20 shrink-0 sm:w-28">
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
          {/* Same rule as the database: whoever added it, or the host, can remove it */}
          {(title.addedBy === me.id || amHost) && (
            <button
              onClick={() => confirm(`Remove “${title.title}” from the club?`) && remove(title.id)}
              title="Remove from club"
              aria-label="Remove from club"
              className="rounded-full p-1 text-muted transition hover:bg-coral/15 hover:text-coral"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status: four big buttons instead of a small dropdown */}
        <div>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => act({ status: s.value })}
                title={s.label}
                aria-label={s.label}
                aria-pressed={onMyList && status === s.value}
                className={`flex h-9 flex-1 items-center justify-center rounded-xl border text-base transition ${
                  onMyList && status === s.value
                    ? 'border-gold bg-gold/15 shadow-inner'
                    : 'border-line bg-night/40 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                }`}
              >
                {s.emoji}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] font-medium text-soft">
            {onMyList ? STATUSES.find((s) => s.value === status)!.label : 'Not on your list yet — tap a status to add it'}
          </p>
        </div>
      </div>
    </div>

      {/* Full width below: progress, your stars, and what friends think — room to breathe on any phone */}
      <div className="flex flex-col gap-3 px-4 pb-3">
        {hasProgress && (
          <div>
            <div className="flex items-center gap-2 text-sm">
              <StepButton label="−" onClick={() => act({ progress: progress - 1 })} />
              <span className="font-display font-bold tabular-nums">
                {progress}
                {title.length ? <span className="text-muted"> / {title.length}</span> : ''}
              </span>
              <span className="text-xs text-muted">{unit}</span>
              <StepButton label="+" onClick={() => act({ progress: progress + 1 })} />
              {title.length ? <span className="ml-auto text-xs font-semibold text-accent">{percent}%</span> : null}
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

        <RatingPicker value={entry?.rating ?? null} onChange={(rating) => act({ rating })} />

        {(others.length > 0 || groupAverage !== null) && (
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-dashed border-line pt-2.5 text-xs text-soft">
            {groupAverage !== null && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-accent">Group ★ {groupAverage}</span>
            )}
            {others.map(({ member, entry: e }) => (
              <span key={member.id} className="flex items-center gap-1" title={member.name}>
                <Avatar member={member} size={20} />
                {STATUSES.find((s) => s.value === e!.status)!.emoji}
                {e!.rating !== null && <span className="font-semibold text-accent">{e!.rating}</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Reviews ---------- */}
      <div className="flex flex-col gap-3 border-t border-dashed border-line px-4 pb-4 pt-3">
        {editing ? (
          <ReviewEditor
            prompt={status === 'completed' ? `How was ${title.title}?` : 'Your review'}
            draft={draft}
            onChange={setDraft}
            onSave={() => {
              update(title.id, { review: draft })
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        ) : entry?.review ? (
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-soft">
              <span>✍️ Your review</span>
              <button onClick={openReview} className="font-semibold text-accent hover:underline">
                Edit
              </button>
            </div>
            <ReviewQuote text={entry.review} rating={entry.rating} member={me} />
          </div>
        ) : (
          <button
            onClick={openReview}
            className="w-full rounded-2xl border border-dashed border-line py-2.5 text-sm font-medium text-soft transition hover:border-gold hover:text-accent"
          >
            ✍️ {status === 'completed' ? 'How was it? Write a review' : 'Write a review'}
          </button>
        )}

        {clubReviews.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-soft">💬 What the club says</p>
            <div className="mt-1.5 flex flex-col gap-2">
              {clubReviews.map(({ member, entry: e }) => (
                <ReviewQuote key={member.id} text={e!.review!} rating={e!.rating} member={member} />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>

    {celebration && <Celebration key={celebration.id} kind={celebration.kind} />}
    </div>
  )
}

function ReviewEditor({
  prompt,
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  prompt: string
  draft: string
  onChange: (text: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="animate-pop">
      <label className="text-sm font-bold">
        ✍️ {prompt}
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          maxLength={REVIEW_MAX_LENGTH}
          rows={3}
          placeholder="What did you feel? Would you tell a friend to watch it? (No spoilers!)"
          className="mt-2 w-full resize-none rounded-2xl border border-line bg-night/60 px-3.5 py-2.5 text-sm font-normal outline-none placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/10"
        />
      </label>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] tabular-nums text-muted">
          {draft.length}/{REVIEW_MAX_LENGTH}
        </span>
        <button onClick={onCancel} className="ml-auto rounded-full px-3 py-1.5 text-sm text-soft hover:text-cream">
          Cancel
        </button>
        <button
          onClick={onSave}
          className="rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-ink transition hover:brightness-110"
        >
          Save review
        </button>
      </div>
    </div>
  )
}

function ReviewQuote({ text, rating, member }: { text: string; rating: number | null; member: Member }) {
  return (
    <figure className="flex gap-2.5 rounded-2xl bg-night/40 p-3">
      <Avatar member={member} size={26} />
      <div className="min-w-0 flex-1">
        <figcaption className="flex items-center gap-2 text-xs">
          <span className="font-bold">{member.name}</span>
          {rating !== null && (
            <span className={`font-display font-bold ${rating >= 8 ? 'text-accent' : rating <= 4 ? 'text-coral' : 'text-soft'}`}>
              ★ {rating}/10
            </span>
          )}
        </figcaption>
        <blockquote className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-soft">“{text}”</blockquote>
      </div>
    </figure>
  )
}

function StepButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-8 w-8 rounded-full border border-line bg-night/40 font-bold transition hover:border-gold hover:text-accent active:scale-90"
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
        <span className={`font-display text-sm font-bold tabular-nums ${value ? 'text-accent' : 'text-muted'}`}>
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
              n <= shown ? 'text-accent drop-shadow-[0_0_6px_rgb(255_197_61/0.5)]' : 'text-line'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
