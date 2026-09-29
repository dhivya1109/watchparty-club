import { useState } from 'react'
import { rankTitles, sliceAtAngle, wheelSlices, type Suggestion } from '../lib/picker'
import { useClub } from '../store/ClubContext'
import { MEDIA_TYPES, type MediaType } from '../types'
import { Avatar } from './Avatar'

const WHEEL_SIZE = 6
const SLICE_COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#14b8a6']
const SPIN_MS = 4000

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
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-5xl">🎡</div>
        <h2 className="mt-4 text-xl font-semibold">Nothing to pick from yet</h2>
        <p className="mt-2 text-slate-400">Add a few titles to the club first — then come back and spin!</p>
        <button onClick={onGoSearch} className="mt-6 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2 font-medium">
          🔍 Go to search
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-6">
        <section>
          <h2 className="font-semibold">👥 Who’s here tonight?</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.members.map((m) => {
              const here = !absent.includes(m.id)
              return (
                <button
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition ${
                    here ? 'border-violet-500 bg-violet-950/40' : 'border-slate-700 bg-slate-900 opacity-50'
                  }`}
                >
                  <Avatar member={m} size={22} />
                  {m.name}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="font-semibold">🎭 In the mood for…</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {[{ type: 'all' as const, emoji: '✨', label: 'Anything' }, ...MEDIA_TYPES].map((m) => (
              <button
                key={m.type}
                onClick={() => {
                  setType(m.type)
                  setGenre('')
                }}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  type === m.type ? 'bg-violet-600 border-violet-500' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="mt-3 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm"
          >
            <option value="">Any genre</option>
            {genres.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </section>

        <section>
          <h2 className="font-semibold">🏆 Top picks</h2>
          {present.length === 0 ? (
            <p className="mt-2 text-slate-500">Select at least one person.</p>
          ) : suggestions.length === 0 ? (
            <p className="mt-2 text-slate-500">
              Nothing left that fits — everyone here has seen it all! Try another type or genre.
            </p>
          ) : (
            <ol className="mt-2 flex flex-col gap-2">
              {suggestions.slice(0, 3).map((s, i) => (
                <li key={s.title.id} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900 p-2">
                  <div className="w-12 shrink-0 aspect-[2/3] overflow-hidden rounded-md bg-slate-800">
                    {s.title.image && <img src={s.title.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg">{['🥇', '🥈', '🥉'][i]}</span>
                      <h3 className="truncate font-medium">{s.title.title}</h3>
                      <span className="ml-auto text-xs tabular-nums text-slate-400">score {s.score}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{s.reasons.join(' · ') || 'In the club list'}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {suggestions.length > 0 && present.length > 0 && (
        // A new key resets the wheel whenever the options change.
        <Wheel key={`${absent.join()}|${type}|${genre}`} suggestions={suggestions.slice(0, WHEEL_SIZE)} />
      )}
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
    // Rotate so that point ends under the pointer at the top, after 5 full turns.
    const current = ((rotation % 360) + 360) % 360
    const extra = (((360 - target - current) % 360) + 360) % 360
    setRotation(rotation + 5 * 360 + extra)
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
      label: labelPoint((start + end) / 2),
      color: SLICE_COLORS[i % SLICE_COLORS.length],
    }
  })

  return (
    <section className="flex flex-col items-center gap-4">
      <h2 className="self-start font-semibold">🎡 Spin the wheel</h2>
      <div className="relative w-full max-w-80">
        {/* Pointer */}
        <div className="absolute left-1/2 -top-1 z-10 -translate-x-1/2 text-3xl drop-shadow">🔻</div>
        <svg viewBox="0 0 300 300" className="w-full">
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '150px 150px',
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.85, 0.2, 1)` : 'none',
            }}
          >
            {paths.map((p, i) => (
              <g key={i}>
                {slices.length === 1 ? (
                  <circle cx="150" cy="150" r="140" fill={p.color} />
                ) : (
                  <path d={p.d} fill={p.color} stroke="#020617" strokeWidth="2" />
                )}
                <text x={p.label.x} y={p.label.y} textAnchor="middle" dominantBaseline="central" className="fill-white text-xl font-bold">
                  {i + 1}
                </text>
              </g>
            ))}
          </g>
          <circle cx="150" cy="150" r="18" fill="#020617" stroke="#334155" strokeWidth="2" />
        </svg>
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="rounded-xl bg-violet-600 px-8 py-3 text-lg font-semibold hover:bg-violet-500 disabled:opacity-50"
      >
        {spinning ? 'Spinning…' : winner ? 'Spin again' : 'Spin!'}
      </button>

      {winner && (
        <div className="w-full rounded-xl border border-violet-500 bg-violet-950/40 p-4 text-center">
          <div className="text-sm text-violet-300">Tonight you’re watching…</div>
          <div className="mt-1 text-2xl font-bold">🎉 {winner.title.title}</div>
        </div>
      )}

      <ol className="w-full text-sm">
        {suggestions.map((s, i) => (
          <li key={s.title.id} className="flex items-center gap-2 py-1">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
            <span className="w-4 text-slate-400">{i + 1}</span>
            <span className="truncate">{s.title.title}</span>
            <span className="ml-auto tabular-nums text-slate-500">{Math.round(slices[i] * 100)}% chance</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ---------- Wheel geometry (angles in degrees, 0 = top, clockwise) ----------

const CENTER = 150
const RADIUS = 140

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

function labelPoint(angle: number) {
  return point(angle, RADIUS * 0.68)
}
