import { useEffect, useRef, useState } from 'react'
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
import { EmptyState, Pill, PillRow, Portal, Poster, Select, TypeBadge } from './ui'

type Sort = 'recent' | 'title' | 'rating'
export type ShelfView = 'club' | 'mine'

/**
 * 🎟️ Two views of the same club, both compact so lots of picks never mean endless scrolling:
 *  - Club shelf: one swipeable row of posters per person ("Priya's picks · 10")
 *  - My list:    a poster grid of what YOU chose to track, filtered by status
 * Tapping a poster opens its full ticket (status, progress, stars, reviews) in a sheet.
 */
export function ClubPage({ onGoSearch, initialView = 'club' }: { onGoSearch: () => void; initialView?: ShelfView }) {
  const { data, me, activeClub } = useClub()
  const [view, setView] = useState<ShelfView>(initialView)
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [sort, setSort] = useState<Sort>('recent')
  const [openId, setOpenId] = useState<string | null>(null)

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

  const sorted = (list: typeof all) =>
    list
      .filter((i) => typeFilter === 'all' || i.title.type === typeFilter)
      .sort((a, b) => {
        if (sort === 'title') return a.title.title.localeCompare(b.title.title)
        if (sort === 'rating') return (b.entry?.rating ?? 0) - (a.entry?.rating ?? 0)
        return b.title.addedAt.localeCompare(a.title.addedAt)
      })

  // Club shelf: one group per person who picked something — yours first
  const people = [...data.members].sort((a, b) => (a.id === me.id ? -1 : b.id === me.id ? 1 : 0))
  const groups = [
    ...people.map((m) => ({ key: m.id, member: m as Member | undefined, items: sorted(all.filter((i) => i.title.addedBy === m.id)) })),
    // Titles added by someone who has since left the club
    { key: 'former', member: undefined, items: sorted(all.filter((i) => !data.members.some((m) => m.id === i.title.addedBy))) },
  ].filter((g) => g.items.length > 0)

  const myItems = sorted(mine).filter((i) => statusFilter === 'all' || i.entry?.status === statusFilter)
  const countByStatus = (s: Status) => mine.filter((i) => i.entry?.status === s).length
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
              view === v.value ? 'bg-gold text-on-gold shadow-md shadow-gold/25' : 'text-soft hover:bg-raised hover:text-cream'
            }`}
          >
            {v.emoji} {v.label} <span className={view === v.value ? 'opacity-70' : 'text-muted'}>· {v.count}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-soft">
        {view === 'club'
          ? 'Everyone’s picks, person by person. Swipe a row; tap a poster for details.'
          : 'What you’re tracking. Tap a poster to update it or remove it.'}
      </p>

      {view === 'mine' && (
        <div className="mt-5 grid grid-cols-4 gap-2">
          {STATUSES.map((s) => {
            const active = statusFilter === s.value
            return (
              <button
                key={s.value}
                onClick={() => setStatusFilter(active ? 'all' : s.value)}
                aria-pressed={active}
                className={`rounded-2xl border px-1 py-2.5 text-center transition ${
                  active ? 'border-gold bg-gold/10 shadow-lg shadow-gold/10' : 'border-line bg-surface hover:border-muted'
                }`}
              >
                <div className={`font-display text-2xl font-extrabold tabular-nums ${active ? 'text-marquee' : ''}`}>{countByStatus(s.value)}</div>
                <div className="truncate text-[11px] text-soft">
                  {s.emoji} {s.label}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Filters: one swipeable row of types, and the sort order */}
      <PillRow className="mt-5">
        {[{ type: 'all' as const, emoji: '✨', label: 'All' }, ...MEDIA_TYPES].map((m) => (
          <Pill key={m.type} active={typeFilter === m.type} onClick={() => setTypeFilter(m.type)}>
            {m.emoji} {m.label}
          </Pill>
        ))}
      </PillRow>
      <div className="mt-3 grid grid-cols-1 sm:max-w-xs">
        <Select label="Sort" value={sort} onChange={(v) => setSort(v as Sort)}>
          <option value="recent">↓ Newest first</option>
          <option value="title">A–Z</option>
          <option value="rating">★ My top rated</option>
        </Select>
      </div>

      {view === 'club' ? (
        groups.length === 0 ? (
          <p className="mt-14 text-center text-muted">Nothing matches this type.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-7">
            {groups.map((g) => (
              <section key={g.key}>
                <h3 className="flex items-center gap-2 text-lg font-extrabold">
                  {g.member ? <Avatar member={g.member} size={26} /> : <span>🎟️</span>}
                  <span className="truncate">
                    {g.member?.id === me.id ? 'Your picks' : g.member ? `${g.member.name}’s picks` : 'Picks from past members'}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-muted">· {g.items.length}</span>
                  {g.items.length > 3 && <span className="ml-auto shrink-0 text-xs font-medium text-muted">swipe →</span>}
                </h3>
                <div className="no-scrollbar -mx-4 mt-1 flex snap-x gap-3 overflow-x-auto px-4 pb-2 pt-2">
                  {g.items.map(({ title }, i) => (
                    <div key={title.id} className="w-[7.25rem] shrink-0 snap-start sm:w-36">
                      <PosterTile title={title} onOpen={() => setOpenId(title.id)} shine={g.member?.id === me.id ? i : undefined} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : mine.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-soft">Nothing on your list yet.</p>
          <p className="mt-1 text-sm text-muted">Open something on the club shelf and tap a status to add it.</p>
          <button
            onClick={() => setView('club')}
            className="mt-4 rounded-full border-2 border-gold/60 px-5 py-2 font-display font-bold text-accent hover:bg-gold/10"
          >
            🎟️ Open the club shelf
          </button>
        </div>
      ) : myItems.length === 0 ? (
        <p className="mt-14 text-center text-muted">Nothing matches these filters.</p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6">
          {myItems.map(({ title }) => (
            <PosterTile key={title.id} title={title} showPicker onOpen={() => setOpenId(title.id)} />
          ))}
        </div>
      )}

      {openId && <TitleSheet titleId={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}

/**
 * A compact poster: your status, the group's rating, and how many reviews — tap for everything else.
 * `shine` (your own picks): a soft light sweeps across now and then (staggered by position),
 * and the card tilts towards your finger or mouse, like a premium ticket.
 */
function PosterTile({
  title,
  onOpen,
  showPicker = false,
  shine,
}: {
  title: ClubTitle
  onOpen: () => void
  showPicker?: boolean
  shine?: number
}) {
  const { data, me } = useClub()
  const entry = getEntry(data, me.id, title.id)
  const status = entry ? STATUSES.find((s) => s.value === entry.status) : undefined
  const avg = averageRating(data, title.id)
  const reviews = data.entries.filter((e) => e.titleId === title.id && e.review).length
  const picker = addedBy(data, title)
  const fancy = shine !== undefined && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /** Tilt up to 10° towards the pointer; flat again when it leaves. */
  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - box.left) / box.width - 0.5
    const y = (e.clientY - box.top) / box.height - 0.5
    e.currentTarget.style.transform = `perspective(600px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.03)`
  }
  const flatten = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.transform = ''
  }

  return (
    <button onClick={onOpen} className="group block w-full text-left" aria-label={`Open ${title.title}`}>
      <div
        className={`relative ${fancy ? 'transition-transform duration-200 ease-out will-change-transform' : ''}`}
        onPointerMove={fancy ? tilt : undefined}
        onPointerLeave={fancy ? flatten : undefined}
        onPointerCancel={fancy ? flatten : undefined}
        onPointerUp={fancy ? flatten : undefined}
      >
        <Poster
          src={title.image}
          type={title.type}
          className={`aspect-[2/3] rounded-xl shadow-md shadow-black/30 ${fancy ? 'ring-1 ring-gold/40' : 'transition duration-300 group-hover:-translate-y-1'}`}
        />
        {fancy && (
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden="true">
            <span
              className="animate-card-shine absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ animationDelay: `${((shine ?? 0) % 6) * 0.6}s` }}
            />
          </span>
        )}
        {status && (
          <span title={status.label} className="absolute left-1.5 top-1.5 rounded-full bg-night/85 px-1.5 py-0.5 text-xs backdrop-blur">
            {status.emoji}
          </span>
        )}
        {avg !== null && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-night/85 px-1.5 py-0.5 text-[10px] font-bold text-star backdrop-blur">
            ★ {avg}
          </span>
        )}
        {showPicker && picker && (
          <span className="absolute bottom-1.5 left-1.5" title={`${picker.name}’s pick`}>
            <Avatar member={picker} size={20} />
          </span>
        )}
        {reviews > 0 && (
          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-night/85 px-1.5 py-0.5 text-[10px] font-semibold text-soft backdrop-blur">
            💬 {reviews}
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-tight">{title.title}</p>
    </button>
  )
}

/** "Priya · ▶️ In progress · 12 / 28 episodes · ★ 8" — a friend's own status, above the ticket. */
function PersonStatus({ member, entry, title }: { member: Member; entry: Entry; title: ClubTitle }) {
  const st = STATUSES.find((s) => s.value === entry.status)!
  const showProgress = title.type !== 'movie' && entry.progress > 0
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
      <Avatar member={member} size={26} />
      <b className="text-cream">{member.name}</b>
      <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-accent">
        {st.emoji} {st.label}
      </span>
      {showProgress && (
        <span className="text-soft">
          {entry.progress}
          {title.length ? ` / ${title.length}` : ''} {LENGTH_UNIT[title.type]}
        </span>
      )}
      {entry.rating !== null && <span className="font-semibold text-star">★ {entry.rating}/10</span>}
    </div>
  )
}

/** The full ticket for one title, in a sheet that slides up. */
export function TitleSheet({ titleId, onClose, person }: { titleId: string; onClose: () => void; person?: Member }) {
  const { data, me } = useClub()
  const title = data.titles[titleId]
  // Opened from a friend's profile: show where THEY are with it first
  const theirs = person && person.id !== me.id ? getEntry(data, person.id, titleId) : undefined

  // Removed (by you, or live by someone else)? Close the sheet.
  useEffect(() => {
    if (!title) onClose()
  }, [title, onClose])
  if (!title) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title.title}>
        <div className="absolute inset-0" onClick={onClose} />
        <div className="animate-pop relative flex max-h-[90vh] w-full max-w-xl flex-col">
          {/* Handle + close, above the ticket so they never cover it */}
          <div className="mb-2 flex items-center justify-center">
            <span className="h-1.5 w-12 rounded-full bg-white/30" aria-hidden="true" />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-1 top-0 -mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-night/80 text-muted backdrop-blur hover:text-cream"
            >
              ✕
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain rounded-[2rem]">
            {person && theirs && <PersonStatus member={person} entry={theirs} title={title} />}
            <ClubCard title={title} entry={getEntry(data, me.id, title.id)} />
          </div>
        </div>
      </div>
    </Portal>
  )
}

function ClubCard({ title, entry }: { title: ClubTitle; entry?: Entry }) {
  const { data, me, amHost, update, remove, removeFromMyList } = useClub()
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
  }

  const clubReviews = others.filter((o) => o.entry!.review)
  // Same rule as the database: whoever added it, or the host, can remove it from the club
  const canRemoveFromClub = title.addedBy === me.id || amHost

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
    {/* Top row: poster and title, side by side */}
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
        </div>

      </div>
    </div>

      {/* Full width below: progress, your stars, and what friends think — room to breathe on any phone */}
      <div className="flex flex-col gap-3 px-4 pb-3">
        {/* YOUR status — everyone sets their own, on anyone's pick */}
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-soft">
            {onMyList ? 'Your status' : 'Where are you with this?'}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {STATUSES.map((s) => {
              const active = onMyList && status === s.value
              return (
                <button
                  key={s.value}
                  onClick={() => act({ status: s.value })}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-1.5 transition ${
                    active ? 'border-gold bg-gold/15 text-cream' : 'border-line bg-night/40 text-muted hover:border-muted hover:text-cream'
                  }`}
                >
                  <span className={`text-base leading-none ${active ? '' : 'opacity-70'}`}>{s.emoji}</span>
                  <span className="whitespace-nowrap text-[11px] font-semibold">{s.label}</span>
                </button>
              )
            })}
          </div>
          {!onMyList && <p className="mt-1 text-[11px] text-muted">Tap one to add it to your list. Only you can change your status.</p>}
        </div>

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
          <div className="border-t border-dashed border-line pt-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-soft">Friends</p>
              {groupAverage !== null && (
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-accent">Group ★ {groupAverage}</span>
              )}
            </div>
            {others.length > 0 && (
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {others.map(({ member, entry: e }) => {
                  const st = STATUSES.find((x) => x.value === e!.status)!
                  return (
                    <li key={member.id} className="flex max-w-full items-center gap-1.5 rounded-full bg-night/40 py-0.5 pl-0.5 pr-2.5 text-xs">
                      <Avatar member={member} size={20} />
                      <span className="truncate font-semibold text-cream">{member.name}</span>
                      <span className="shrink-0 text-soft">
                        {st.emoji} {st.label}
                      </span>
                      {e!.rating !== null && <span className="shrink-0 font-semibold text-star">★ {e!.rating}</span>}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ---------- Reviews (only shown when there's something to show) ---------- */}
      {(editing || entry?.review || (onMyList && status === 'completed') || clubReviews.length > 0) && (
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
        ) : onMyList && status === 'completed' ? (
          // Finished it? You *can* review it — a quiet link, never a pop-up.
          <button onClick={openReview} className="w-fit text-sm font-medium text-muted transition hover:text-accent">
            ✍️ Add a review <span className="text-xs">(optional)</span>
          </button>
        ) : null}

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
      )}

      {/* Remove: from my list only, or (whoever added it / the host) from the whole club */}
      {(onMyList || canRemoveFromClub) && (
        <div className="flex flex-wrap gap-2 border-t border-dashed border-line px-4 py-3">
          {onMyList && (
            <button
              onClick={() =>
                confirm(`Take “${title.title}” off your list? Your status, stars and review for it will be deleted. It stays on the club shelf.`) &&
                removeFromMyList(title.id)
              }
              className="flex-1 whitespace-nowrap rounded-full border border-line px-3 py-2 text-sm font-semibold text-soft transition hover:border-muted hover:text-cream"
            >
              ➖ Remove from my list
            </button>
          )}
          {canRemoveFromClub && (
            <button
              onClick={() => confirm(`Remove “${title.title}” from the club for everyone?`) && remove(title.id)}
              className="flex-1 whitespace-nowrap rounded-full border border-coral/40 px-3 py-2 text-sm font-semibold text-coral transition hover:bg-coral/10"
            >
              🗑️ Remove from club
            </button>
          )}
        </div>
      )}
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
          className="rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-on-gold transition hover:brightness-110"
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
              n <= shown ? 'text-star drop-shadow-sm' : 'text-line'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
