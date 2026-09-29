import { useState } from 'react'
import { rankTitles, sliceAtAngle, wheelSlices, type Suggestion } from '../lib/picker'
import { useClub } from '../store/ClubContext'
import { MEDIA_TYPES, type MediaType } from '../types'
import { Avatar } from './Avatar'
import { EmptyState, GoldButton, Panel, Pill, Poster, TypeBadge } from './ui'

const WHEEL_SIZE = 6
// The same colours as the design tokens in index.css (gold, coral, series, anime, book) plus lilac.
const SLICE_COLORS = ['#ffc53d', '#ff7a66', '#4cc9f0', '#f472b6', '#a3e635', '#b69cff']
const SPIN_MS = 4500
const BULBS = 24

export function PickerPage({ onGoSearch }: { onGoSearch: () => void }) {
  const { data } = useClub()
  // We store who is *absent*, so everyone (including newly added friends) is "here" by default.
  const [absent, setAbsent] = useState<string[]>([])
  const [type, setType] = useState<MediaType | 'all'>('all')
  const [genre, setGenre] = useState('')

  const present = data.members.filter((m) => !absent.includes(m.id))
  const suggestions = rankTitles(data, { memberIds: present.map((m) => m.id), type, genre: genre || undefined })
  const genres = [
    ...new Set(
      Object.values(data.titles)
        .filter((t) => type === 'all' || t.type === type)
        .flatMap((t) => t.genres),
    ),
  ].sort()

  const toggle = (id: string) => setAbsent((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  if (Object.keys(data.titles).length === 0) {
    return (
      <EmptyState
        emoji="🎡"
        title="Nothing on the wheel yet"
        text="Add a few titles to the club first — then come back and spin!"
        action="🔍 Start discovering"
        onAction={onGoSearch}
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Movie night</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">What are we watching tonight?</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-5">
          <Panel title="👥 Who’s here?">
            <div className="flex flex-wrap gap-2">
              {data.members.map((m) => {
                const here = !absent.includes(m.id)
                return (
                  <button
                    key={m.id}
                    onClick={() => toggle(m.id)}
                    aria-pressed={here}
                    className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm font-medium transition ${
                      here ? 'border-gold bg-gold/10' : 'border-line bg-raised/50 opacity-45 grayscale'
                    }`}
                  >
                    <Avatar member={m} size={26} />
                    {m.name}
                    <span className="text-xs">{here ? '✓' : ''}</span>
                  </button>
                )
              })}
            </div>
          </Panel>

          <Panel title="🎭 In the mood for…">
            <div className="flex flex-wrap gap-2">
              {[{ type: 'all' as const, emoji: '✨', label: 'Anything' }, ...MEDIA_TYPES].map((m) => (
                <Pill
                  key={m.type}
                  active={type === m.type}
                  onClick={() => {
                    setType(m.type)
                    setGenre('')
                  }}
                >
                  {m.emoji} {m.label}
                </Pill>
              ))}
            </div>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              aria-label="Genre"
              className="mt-3 rounded-full border border-line bg-raised px-4 py-1.5 text-sm text-soft outline-none focus:border-gold"
            >
              <option value="">Any genre</option>
              {genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Panel>

          <Panel title="🏆 Top picks" note="Scored by who wants it, their favourite genres, and what’s already started">
            {present.length === 0 ? (
              <p className="text-muted">Pick at least one person.</p>
            ) : suggestions.length === 0 ? (
              <p className="text-muted">Nothing left that fits — everyone here has seen it all! Try another type or genre.</p>
            ) : (
              <ol className="flex flex-col gap-2.5">
                {suggestions.slice(0, 3).map((s, i) => (
                  <li
                    key={s.title.id}
                    className={`flex gap-3 rounded-2xl border p-2.5 ${i === 0 ? 'border-gold/50 bg-gold/5' : 'border-line bg-night/30'}`}
                  >
                    <Poster src={s.title.image} type={s.title.type} className="aspect-[2/3] w-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span>
                        <h3 className="truncate font-bold">{s.title.title}</h3>
                        <span className="ml-auto shrink-0 rounded-full bg-raised px-2 py-0.5 text-[11px] tabular-nums text-soft">
                          {s.score} pts
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{s.reasons.join(' · ') || 'In the club list'}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {suggestions.length > 0 && present.length > 0 && (
          // A new key resets the wheel whenever the options change.
          <Wheel key={`${absent.join()}|${type}|${genre}`} suggestions={suggestions.slice(0, WHEEL_SIZE)} />
        )}
      </div>
    </div>
  )
}

function Wheel({ suggestions }: { suggestions: Suggestion[] }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Suggestion | null>(null)
  const slices = wheelSlices(suggestions)

  const spin = () => {
    // Pick a random point on the wheel; the slice under it wins (bigger slice = more likely).
    const target = Math.random() * 360
    const winnerIndex = sliceAtAngle(slices, target)
    // Rotate so that point ends under the pointer at the top, after 6 full turns.
    const current = ((rotation % 360) + 360) % 360
    const extra = (((360 - target - current) % 360) + 360) % 360
    setRotation(rotation + 6 * 360 + extra)
    setSpinning(true)
    setWinner(null)
    setTimeout(() => {
      setSpinning(false)
      setWinner(suggestions[winnerIndex])
    }, SPIN_MS)
  }

  // Each slice starts where the previous ones end.
  const paths = slices.map((fraction, i) => {
    const start = slices.slice(0, i).reduce((sum, f) => sum + f, 0) * 360
    const end = start + fraction * 360
    return {
      d: slicePath(start, end),
      label: point((start + end) / 2, RADIUS * 0.66),
      color: SLICE_COLORS[i % SLICE_COLORS.length],
    }
  })

  return (
    <Panel className="flex flex-col items-center gap-5 overflow-hidden">
      <div className="relative w-full max-w-[22rem]">
        {/* Spotlight behind the wheel */}
        <div className="absolute inset-6 rounded-full bg-gold/20 blur-3xl" />
        <svg viewBox="0 0 320 320" className="relative w-full drop-shadow-2xl">
          {/* Rim */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS + 14} className="fill-raised stroke-line" strokeWidth="2" />
          {/* Marquee bulbs around the rim — they blink faster while spinning */}
          {Array.from({ length: BULBS }, (_, i) => {
            const p = point((i * 360) / BULBS, RADIUS + 7)
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3.2"
                className="fill-gold"
                // Every other bulb starts half a blink later, so the lights "chase".
                style={{
                  animation: `bulb ${spinning ? 0.25 : 1.4}s ease-in-out ${i % 2 ? (spinning ? 0.125 : 0.7) : 0}s infinite`,
                }}
              />
            )
          })}

          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${CENTER}px ${CENTER}px`,
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.18, 1)` : 'none',
            }}
          >
            {paths.map((p, i) => (
              <g key={i}>
                {slices.length === 1 ? (
                  <circle cx={CENTER} cy={CENTER} r={RADIUS} fill={p.color} />
                ) : (
                  <path d={p.d} fill={p.color} className="stroke-night" strokeWidth="3" />
                )}
                <text
                  x={p.label.x}
                  y={p.label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-ink font-display text-2xl font-extrabold"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </g>

          {/* Centre cap */}
          <circle cx={CENTER} cy={CENTER} r="24" className="fill-night stroke-gold" strokeWidth="3" />
          <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="central" className="text-lg">
            🍿
          </text>
          {/* Pointer */}
          <polygon points="146,2 174,2 160,34" className="fill-gold stroke-night" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>

      <GoldButton onClick={spin} disabled={spinning} className="px-10 py-3.5 text-lg">
        {spinning ? '🎡 Spinning…' : winner ? '🎡 Spin again' : '🎡 Spin the wheel!'}
      </GoldButton>

      {winner && (
        <div className="animate-pop relative w-full overflow-hidden rounded-3xl border border-gold/60 bg-gradient-to-br from-gold/15 via-surface to-coral/10 p-4 shadow-2xl shadow-gold/20">
          <div className="marquee-lights absolute inset-x-0 top-0" />
          <div className="flex items-center gap-4 pt-2">
            <Poster src={winner.title.image} type={winner.title.type} className="aspect-[2/3] w-20 shrink-0 rounded-xl shadow-xl" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent">Tonight’s feature presentation</p>
              <p className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">🎉 {winner.title.title}</p>
              <TypeBadge type={winner.title.type} className="mt-2" />
            </div>
          </div>
        </div>
      )}

      <ol className="w-full text-sm">
        {suggestions.map((s, i) => (
          <li key={s.title.id} className="flex items-center gap-2.5 border-b border-line/60 py-2 last:border-0">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-xs font-extrabold text-ink"
              style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }}
            >
              {i + 1}
            </span>
            <span className="truncate">{s.title.title}</span>
            <span className="ml-auto shrink-0 tabular-nums text-muted">{Math.round(slices[i] * 100)}% chance</span>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

// ---------- Wheel geometry (angles in degrees, 0 = top, clockwise) ----------

const CENTER = 160
const RADIUS = 136

function point(angle: number, radius = RADIUS) {
  const rad = (angle * Math.PI) / 180
  return { x: CENTER + radius * Math.sin(rad), y: CENTER - radius * Math.cos(rad) }
}

function slicePath(start: number, end: number): string {
  const a = point(start)
  const b = point(end)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${a.x} ${a.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${b.x} ${b.y} Z`
}
