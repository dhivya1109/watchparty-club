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
import { MEDIA_TYPES } from '../types'
import { Avatar } from './Avatar'

export function StatsPage({ onGoSearch }: { onGoSearch: () => void }) {
  const { data } = useClub()
  const totals = clubTotals(data)

  if (totals.titles === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-5xl">📊</div>
        <h2 className="mt-4 text-xl font-semibold">No stats yet</h2>
        <p className="mt-2 text-slate-400">Add and rate a few titles — your club’s stats will appear here.</p>
        <button onClick={onGoSearch} className="mt-6 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2 font-medium">
          🔍 Go to search
        </button>
      </div>
    )
  }

  const genres = genreStats(data)
  const types = typeCounts(data)
  const matches = tasteMatches(data)
  const people = data.members.map((m) => personStats(data, m))
  const loved = mostLoved(data)
  const divisive = mostDivisive(data)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-6">
      {/* Headline numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Tile value={totals.titles} label="Titles in the club" />
        <Tile value={totals.completed} label="Times completed" />
        <Tile value={`≈ ${totals.watchHours}`} label="Hours watched" />
        <Tile value={totals.pagesRead.toLocaleString()} label="Pages read" />
        <Tile value={totals.averageRating ?? '—'} label="Average rating" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HighlightCard emoji="🔥" heading="Most loved" item={loved} empty="Needs 2+ people rating the same title.">
          {loved && `Group average ${loved.average}/10`}
        </HighlightCard>
        <HighlightCard emoji="💀" heading="Most divisive" item={divisive} empty="No big disagreements yet.">
          {divisive && `Ratings from ${Math.min(...divisive.ratings)} to ${Math.max(...divisive.ratings)}`}
        </HighlightCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="🎭 Genres in your club" note="Number of titles · group rating">
          <BarList
            rows={genres.map((g) => ({
              key: g.genre,
              label: g.genre,
              value: g.titles,
              text: `${g.titles}${g.averageRating !== null ? ` · ⭐ ${g.averageRating}` : ''}`,
              tooltip: `${g.genre}: ${g.titles} title${g.titles === 1 ? '' : 's'}${
                g.averageRating !== null ? `, rated ${g.averageRating}/10 on average` : ', not rated yet'
              }`,
            }))}
          />
        </Panel>

        <Panel title="🤝 Taste match" note="How closely each pair's ratings agree">
          {matches.length === 0 ? (
            <p className="text-sm text-slate-500">Add friends in the “You” menu to compare tastes.</p>
          ) : (
            <BarList
              stacked
              max={100}
              rows={matches.map((m) => ({
                key: `${m.a.id}-${m.b.id}`,
                label: (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Avatar member={m.a} size={18} />
                    <Avatar member={m.b} size={18} />
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

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Panel title="🗂️ By type">
          <div className="grid grid-cols-2 gap-2">
            {MEDIA_TYPES.map((t) => (
              <div key={t.type} className="rounded-lg bg-slate-800/60 px-3 py-2">
                <div className="text-xl font-bold tabular-nums">{types[t.type]}</div>
                <div className="text-xs text-slate-400">
                  {t.emoji} {t.label}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="👥 Per person">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="py-1 font-normal">Member</th>
                  <th className="py-1 font-normal text-right">Completed</th>
                  <th className="py-1 font-normal text-right">≈ Hours</th>
                  <th className="py-1 font-normal text-right">Pages</th>
                  <th className="py-1 font-normal text-right">Avg given</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {people.map((p) => (
                  <tr key={p.member.id} className="border-t border-slate-800">
                    <td className="py-2">
                      <span className="flex items-center gap-2">
                        <Avatar member={p.member} size={20} />
                        {p.member.name}
                      </span>
                    </td>
                    <td className="py-2 text-right">{p.completed}</td>
                    <td className="py-2 text-right">{Math.round(p.watchMinutes / 60)}</td>
                    <td className="py-2 text-right">{p.pagesRead}</td>
                    <td className="py-2 text-right">{p.averageGiven ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <p className="text-xs text-slate-500">
        Hours are estimates: a movie ≈ {ESTIMATED_MINUTES.movie / 60} h, a series episode ≈ {ESTIMATED_MINUTES.series} min,
        an anime episode ≈ {ESTIMATED_MINUTES.anime} min.
      </p>
    </div>
  )
}

function Tile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  )
}

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="font-semibold">{title}</h2>
      {note && <p className="text-xs text-slate-500">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function HighlightCard({
  emoji,
  heading,
  item,
  empty,
  children,
}: {
  emoji: string
  heading: string
  item: Highlight | null
  empty: string
  children: ReactNode
}) {
  return (
    <section className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-3">
      <div className="w-14 shrink-0 aspect-[2/3] overflow-hidden rounded-md bg-slate-800 flex items-center justify-center text-2xl">
        {item?.title.image ? <img src={item.title.image} alt="" className="h-full w-full object-cover" /> : emoji}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {emoji} {heading}
        </div>
        {item ? (
          <>
            <div className="truncate text-lg font-semibold">{item.title.title}</div>
            <div className="text-sm text-slate-400">{children}</div>
          </>
        ) : (
          <div className="text-sm text-slate-500">{empty}</div>
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
    <ul className={`flex flex-col ${stacked ? 'gap-3' : 'gap-2'}`}>
      {rows.map((r) => (
        // Fixed-width columns, so every bar's track is the same length and equal values look equal.
        <li
          key={r.key}
          title={r.tooltip}
          className={`grid items-center text-sm ${
            stacked
              ? 'grid-cols-[1fr_4.5rem] gap-x-3 gap-y-1'
              : 'grid-cols-[minmax(0,6.5rem)_1fr_4.5rem] sm:grid-cols-[minmax(0,9rem)_1fr_4.5rem] gap-3'
          }`}
        >
          <span className={`truncate text-slate-300 ${stacked ? 'col-span-2' : ''}`}>{r.label}</span>
          <span className="h-2 rounded-full bg-slate-800">
            <span
              className="block h-full rounded-full bg-violet-500"
              style={{ width: `${(r.value / top) * 100}%`, minWidth: r.value > 0 ? 4 : 0 }}
            />
          </span>
          <span className="text-right text-xs tabular-nums text-slate-400 whitespace-nowrap">{r.text}</span>
        </li>
      ))}
    </ul>
  )
}
