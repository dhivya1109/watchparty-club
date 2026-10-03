import { BookOpen, CircleCheck, Clock, Flame, Star, Swords, Ticket, type LucideIcon } from 'lucide-react'
import { TypeIcon } from './icons'
import { ChartColumn } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  clubTotals,
  ESTIMATED_MINUTES,
  genreStats,
  mostDivisive,
  mostLoved,
  personStats,
  tasteMatches,
  typeCounts,
  type Highlight,
} from '../lib/stats'
import { useClub } from '../store/ClubContext'
import { MEDIA_TYPES, TYPE_STYLE } from '../types'
import { Avatar } from './Avatar'
import { EmptyState, Panel, Poster } from './ui'

export function StatsPage({ onGoSearch }: { onGoSearch: () => void }) {
  const { data } = useClub()
  const totals = clubTotals(data)

  if (totals.titles === 0) {
    return (
      <EmptyState
        icon={ChartColumn}
        title="No stats yet"
        text="Add and rate a few titles — your club’s stats will appear here."
        action="Start discovering"
        onAction={onGoSearch}
      />
    )
  }

  const genres = genreStats(data)
  const types = typeCounts(data)
  const matches = tasteMatches(data)
  const people = data.members.map((m) => personStats(data, m))
  const loved = mostLoved(data)
  const divisive = mostDivisive(data)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Box office</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">The club in numbers</h2>
      </div>

      {/* Headline numbers */}
      {/* 2 columns on phones (the 5th tile spans both, so no gap), all 5 in a row from tablets up */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Tile tone="gold" icon={Ticket} value={totals.titles} label="Titles in the club" />
        <Tile tone="book" icon={CircleCheck} value={totals.completed} label="Times completed" />
        <Tile tone="series" icon={Clock} value={`≈${totals.watchHours}`} label="Hours watched" />
        <Tile tone="anime" icon={BookOpen} value={totals.pagesRead.toLocaleString()} label="Pages read" />
        <Tile tone="star" icon={Star} value={totals.averageRating ?? '—'} label="Average rating" className="col-span-2 sm:col-span-1" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <HighlightCard icon={Flame} heading="Most loved" item={loved} empty="Needs 2+ people rating the same title.">
          {loved && `Group average ${loved.average}/10`}
        </HighlightCard>
        <HighlightCard icon={Swords} heading="Most divisive" item={divisive} empty="No big disagreements… yet.">
          {divisive && `Ratings from ${Math.min(...divisive.ratings)} to ${Math.max(...divisive.ratings)}`}
        </HighlightCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Genres in your club" note="Number of titles · group rating">
          <BarList
            rows={genres.map((g) => ({
              key: g.genre,
              label: g.genre,
              value: g.titles,
              text: `${g.titles}${g.averageRating !== null ? ` · ★${g.averageRating}` : ''}`,
              tooltip: `${g.genre}: ${g.titles} title${g.titles === 1 ? '' : 's'}${
                g.averageRating !== null ? `, rated ${g.averageRating}/10 on average` : ', not rated yet'
              }`,
            }))}
          />
        </Panel>

        <Panel title="Taste match" note="How closely each pair’s ratings agree">
          {matches.length === 0 ? (
            <p className="text-sm text-muted">Add friends in the member menu (top right) to compare tastes.</p>
          ) : (
            <BarList
              stacked
              max={100}
              rows={matches.map((m) => ({
                key: `${m.a.id}-${m.b.id}`,
                label: (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="flex -space-x-1.5">
                      <Avatar member={m.a} size={22} />
                      <Avatar member={m.b} size={22} />
                    </span>
                    <span className="truncate">
                      {m.a.name} & {m.b.name}
                    </span>
                  </span>
                ),
                value: m.match ?? 0,
                text: m.match === null ? 'not yet' : `${m.match}%`,
                tooltip:
                  m.match === null
                    ? `${m.a.name} & ${m.b.name} haven't rated the same title yet`
                    : `${m.a.name} & ${m.b.name}: ${m.match}% match on ${m.shared} title${m.shared === 1 ? '' : 's'} both rated`,
              }))}
            />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
        <Panel title="By type">
          <div className="grid grid-cols-2 gap-2">
            {MEDIA_TYPES.map((t) => (
              <div key={t.type} className={`rounded-2xl px-3 py-2.5 ${TYPE_STYLE[t.type].bg}`}>
                <div className="font-display text-2xl font-extrabold tabular-nums">{types[t.type]}</div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${TYPE_STYLE[t.type].text}`}>
                  <TypeIcon type={t.type} size={13} /> {t.label}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Per person">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="py-1 font-medium">Member</th>
                  <th className="py-1 text-right font-medium">Completed</th>
                  <th className="py-1 text-right font-medium">≈ Hours</th>
                  <th className="py-1 text-right font-medium">Pages</th>
                  <th className="py-1 text-right font-medium">Avg given</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {people.map((p) => (
                  <tr key={p.member.id} className="border-t border-line">
                    <td className="py-2.5">
                      <span className="flex items-center gap-2 font-medium">
                        <Avatar member={p.member} size={24} />
                        {p.member.name}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">{p.completed}</td>
                    <td className="py-2.5 text-right">{Math.round(p.watchMinutes / 60)}</td>
                    <td className="py-2.5 text-right">{p.pagesRead}</td>
                    <td className="py-2.5 text-right font-semibold text-accent">{p.averageGiven ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <p className="text-xs text-muted">
        Hours are estimates: a movie ≈ {ESTIMATED_MINUTES.movie / 60} h, a series episode ≈ {ESTIMATED_MINUTES.series} min,
        an anime episode ≈ {ESTIMATED_MINUTES.anime} min.
      </p>
    </div>
  )
}

/** Each headline number gets its own colour, so the row doesn't read as one flat block. */
const TONES = {
  gold: { box: 'border-gold/30 bg-gold/10', icon: 'bg-gold/20 text-accent', value: 'text-accent' },
  book: { box: 'border-book/30 bg-book/10', icon: 'bg-book/20 text-book', value: 'text-book' },
  series: { box: 'border-series/30 bg-series/10', icon: 'bg-series/20 text-series', value: 'text-series' },
  anime: { box: 'border-anime/30 bg-anime/10', icon: 'bg-anime/20 text-anime', value: 'text-anime' },
  star: { box: 'border-star/30 bg-star/10', icon: 'bg-star/20 text-star', value: 'text-star' },
}

function Tile({
  tone,
  icon: Icon,
  value,
  label,
  className = '',
}: {
  tone: keyof typeof TONES
  icon: LucideIcon
  value: ReactNode
  label: string
  className?: string
}) {
  const t = TONES[tone]
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 ${t.box} ${className}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${t.icon}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className={`mt-3 font-display text-3xl font-bold tabular-nums ${t.value}`}>{value}</div>
      <div className="text-sm text-soft">{label}</div>
    </div>
  )
}

function HighlightCard({
  icon: Icon,
  heading,
  item,
  empty,
  children,
}: {
  icon: LucideIcon
  heading: string
  item: Highlight | null
  empty: string
  children: ReactNode
}) {
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-line bg-gradient-to-br from-surface to-raised/70 p-3.5">
      {item ? (
        <Poster src={item.title.image} type={item.title.type} className="aspect-[2/3] w-16 shrink-0 rounded-xl shadow-lg" />
      ) : (
        <div className="flex aspect-[2/3] w-16 shrink-0 items-center justify-center rounded-xl bg-raised text-muted">
          <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
          <Icon size={13} aria-hidden="true" /> {heading}
        </div>
        {item ? (
          <>
            <div className="mt-0.5 truncate font-display text-xl font-extrabold">{item.title.title}</div>
            <div className="text-sm text-soft">{children}</div>
          </>
        ) : (
          <div className="mt-0.5 text-sm text-muted">{empty}</div>
        )}
      </div>
    </section>
  )
}

interface BarRow {
  key: string
  label: ReactNode
  value: number
  text: string
  tooltip: string
}

/**
 * A simple horizontal bar chart: label, bar, value — one row each.
 * `stacked` puts the label on its own line above the bar (for long labels like two names).
 */
function BarList({ rows, max, stacked = false }: { rows: BarRow[]; max?: number; stacked?: boolean }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className={`flex flex-col ${stacked ? 'gap-3.5' : 'gap-2.5'}`}>
      {rows.map((r) => (
        // Fixed-width columns, so every bar's track is the same length and equal values look equal.
        <li
          key={r.key}
          title={r.tooltip}
          className={`grid items-center text-sm ${
            stacked
              ? 'grid-cols-[1fr_4.5rem] gap-x-3 gap-y-1.5'
              : 'grid-cols-[minmax(0,6.5rem)_1fr_4.5rem] gap-3 sm:grid-cols-[minmax(0,9rem)_1fr_4.5rem]'
          }`}
        >
          <span className={`truncate text-soft ${stacked ? 'col-span-2' : ''}`}>{r.label}</span>
          <span className="h-2.5 rounded-full bg-night/70">
            <span
              className="block h-full rounded-full bg-gold"
              style={{ width: `${(r.value / top) * 100}%`, minWidth: r.value > 0 ? 6 : 0 }}
            />
          </span>
          <span className="whitespace-nowrap text-right font-display text-xs font-bold tabular-nums text-soft">{r.text}</span>
        </li>
      ))}
    </ul>
  )
}
