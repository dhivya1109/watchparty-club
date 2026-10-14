import { TypeIcon } from './icons'
import { FerrisWheel } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { rankTitles, sliceAtAngle, wheelSlices, type Suggestion } from '../lib/picker'
import { useClub } from '../store/ClubContext'
import { MEDIA_TYPES, type MediaType } from '../types'
import { Avatar } from './Avatar'
import { EmptyState, GoldButton, Panel, Pill, PillRow, Poster, Select, TypeBadge } from './ui'

const WHEEL_SIZE = 6
// The same colours as the design tokens in index.css (gold, coral, series, anime, book) plus lilac.
const SLICE_COLORS = ['#ffc53d', '#ff7a66', '#4cc9f0', '#f472b6', '#a3e635', '#b69cff']
const SPIN_MS = 3000
const BULBS = 24

export function PickerPage({ onGoSearch }: { onGoSearch: () => void }) {
  const { data, me, lastSpin, recordSpin } = useClub()
  // "Tonight's pick" shows spins from the last 24 hours
  const [openedAt] = useState(() => Date.now())
  // We store who is *absent*, so everyone (including newly added friends) is "here" by default.
  const [absent, setAbsent] = useState<string[]>([])
  const [type, setType] = useState<MediaType | 'all'>('all')
  const [genre, setGenre] = useState('')

  const present = data.members.filter((m) => !absent.includes(m.id))
  const suggestions = rankTitles(data, { memberIds: present.map((m) => m.id), type, genre: genre || undefined })
  // Genres of the chosen type — plus the chosen genre, so picking a type never clears it.
  const genres = [
    ...new Set([
      ...Object.values(data.titles)
        .filter((t) => type === 'all' || t.type === type)
        .flatMap((t) => t.genres),
      ...(genre ? [genre] : []),
    ]),
  ].sort()

  const toggle = (id: string) => setAbsent((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  if (Object.keys(data.titles).length === 0) {
    return (
      <EmptyState
        icon={FerrisWheel}
        title="Nothing on the wheel yet"
        text="Add a few titles to the club first — then come back and spin!"
        action="Start discovering"
        onAction={onGoSearch}
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Movie night</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">What are we watching tonight?</h2>
      </div>

      {/* The club's latest spin — the same for everyone in the club */}
      {lastSpin && openedAt - new Date(lastSpin.spunAt).getTime() < 24 * 60 * 60 * 1000 && (
        <TonightsPick
          titleName={lastSpin.titleName}
          image={data.titles[lastSpin.titleId]?.image}
          type={data.titles[lastSpin.titleId]?.type}
          who={lastSpin.spunBy === me.id ? 'You' : (data.members.find((m) => m.id === lastSpin.spunBy)?.name ?? 'Someone')}
          when={lastSpin.spunAt}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-5">
          <Panel title="Who’s watching tonight?" note="Untick anyone who isn’t joining. The wheel only uses their lists and tastes.">
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

          <Panel title="In the mood for…" note="Pick a type, a genre, or both — in any order.">
            <PillRow edge={5}>
              {[{ type: 'all' as const, label: 'Anything' }, ...MEDIA_TYPES].map((m) => (
                <Pill
                  key={m.type}
                  active={type === m.type}
                  onClick={() => setType(m.type)}
                >
                  <span className="flex items-center gap-1.5">
                    {m.type !== 'all' && <TypeIcon type={m.type} size={14} />}
                    {m.label}
                  </span>
                </Pill>
              ))}
            </PillRow>
            <Select label="Genre" value={genre} onChange={setGenre} className="mt-3">
              <option value="">Any genre</option>
              {genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Panel>

          <HowItPicks />

          {/* Wide screens: top picks under the filters. Phones: below the wheel (see further down). */}
          <div className="hidden lg:block">
            <TopPicks present={present.length} suggestions={suggestions} />
          </div>
        </div>

        {present.length > 0 && suggestions.length > 0 ? (
          // A new key resets the wheel whenever the options change.
          <Wheel
            key={`${absent.join()}|${type}|${genre}`}
            suggestions={suggestions.slice(0, WHEEL_SIZE)}
            clubName={data.name ?? 'your club'}
            onWinner={(s) => recordSpin(s.title.id, s.title.title)}
          />
        ) : (
          // Never just disappear: say why there's nothing to spin, and how to fix it.
          <Panel className="flex flex-col items-center gap-3 py-10 text-center">
            <FerrisWheel size={44} strokeWidth={1.5} aria-hidden="true" className="text-muted" />
            <h3 className="text-xl font-extrabold">Nothing to spin yet</h3>
            <p className="max-w-xs text-sm text-soft">
              {present.length === 0
                ? 'Tick at least one person under “Who’s watching tonight?”.'
                : type !== 'all' || genre
                  ? 'Nothing fits this type or genre that everyone here hasn’t seen.'
                  : 'Everyone here has already watched everything on the club shelf!'}
            </p>
            {present.length > 0 && (type !== 'all' || genre) ? (
              <button
                onClick={() => {
                  setType('all')
                  setGenre('')
                }}
                className="rounded-full border-2 border-gold/60 px-5 py-2 font-display font-bold text-accent hover:bg-gold/10"
              >
                Show everything
              </button>
            ) : present.length > 0 ? (
              <button onClick={onGoSearch} className="rounded-full border-2 border-gold/60 px-5 py-2 font-display font-bold text-accent hover:bg-gold/10">
                Add something new
              </button>
            ) : null}
          </Panel>
        )}

        <div className="lg:hidden">
          <TopPicks present={present.length} suggestions={suggestions} />
        </div>
      </div>
    </div>
  )
}

/** 🏆 The three best-scoring titles for the people here, with the reasons. */
function TopPicks({ present, suggestions }: { present: number; suggestions: Suggestion[] }) {
  return (
    <Panel title="Top picks" note="The highest scores for the people watching tonight — see “How the wheel picks”">
      {present === 0 ? (
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
                  <span className="font-display text-lg font-bold tabular-nums text-muted">#{i + 1}</span>
                  <h3 className="truncate font-bold">{s.title.title}</h3>
                  <span className="ml-auto shrink-0 rounded-full bg-raised px-2 py-0.5 text-[11px] tabular-nums text-soft">
                    {s.score} pts
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{s.reasons.join(' · ') || 'In the club list'}</p>
                <PointsLine s={s} className="mt-1" />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

function Wheel({ suggestions, clubName, onWinner }: { suggestions: Suggestion[]; clubName: string; onWinner: (s: Suggestion) => void }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Suggestion | null>(null)
  // While (and after) spinning, the wheel keeps the list it started with — live updates
  // from friends can't reshuffle the slices under the pointer.
  const [frozen, setFrozen] = useState<Suggestion[] | null>(null)
  const list = frozen ?? suggestions
  const slices = wheelSlices(list)
  const pending = useRef<{ winner: Suggestion; timer: ReturnType<typeof setTimeout> } | null>(null)
  // Phones with "remove animations" switched on: no spinning, just a quick result.
  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SPIN_MS

  /** Show the result — when the wheel stops, or after a backup timer if the "stopped" signal never comes. */
  const finish = () => {
    if (!pending.current) return
    clearTimeout(pending.current.timer)
    setWinner(pending.current.winner)
    onWinner(pending.current.winner)
    setSpinning(false)
    pending.current = null
  }

  const spin = () => {
    const current = suggestions
    const currentSlices = wheelSlices(current)
    // Pick a random point on the wheel; the slice under it wins (bigger slice = more likely).
    const target = Math.random() * 360
    const winnerIndex = sliceAtAngle(currentSlices, target)
    // Rotate so that point ends under the pointer at the top, after 5 full turns.
    const at = ((rotation % 360) + 360) % 360
    const extra = (((360 - target - at) % 360) + 360) % 360
    setFrozen(current)
    setRotation(rotation + 5 * 360 + extra)
    setSpinning(true)
    setWinner(null)
    pending.current = { winner: current[winnerIndex], timer: setTimeout(finish, duration + 400) }
  }

  // Never leave a timer running if the wheel goes away mid-spin
  useEffect(() => () => clearTimeout(pending.current?.timer), [])

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
    <Panel className="overflow-hidden">
      {/* Panel puts its contents in a plain box, so centre everything in our own column */}
      <div className="flex flex-col items-center gap-5">
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
              transition: spinning && duration > 0 ? `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.18, 1)` : 'none',
            }}
            onTransitionEnd={finish}
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
          <circle cx={CENTER} cy={CENTER} r="6" className="fill-gold" />
          {/* Pointer */}
          <polygon points="146,2 174,2 160,34" className="fill-gold stroke-night" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>

      <GoldButton onClick={spin} disabled={spinning} className="mt-4 px-10 py-3.5 text-lg">
        {spinning ? 'Spinning…' : winner ? 'Spin again' : 'Spin the wheel!'}
      </GoldButton>

      {winner && (
        <div className="animate-pop relative w-full overflow-hidden rounded-2xl border border-gold/60 bg-gradient-to-br from-gold/15 via-surface to-coral/10 p-4">
          <div className="flex items-center gap-4 pt-2">
            <Poster src={winner.title.image} type={winner.title.type} className="aspect-[2/3] w-20 shrink-0 rounded-xl shadow-xl" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Tonight’s feature presentation</p>
              <p className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{winner.title.title}</p>
              <TypeBadge type={winner.title.type} className="mt-2" />
            </div>
          </div>
          <PointsLine s={winner} className="mt-3" />
          <p className="mt-1 text-xs text-muted">Shared with everyone in {clubName}.</p>
        </div>
      )}

      <ol className="w-full text-sm">
        {list.map((s, i) => (
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
      </div>
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

/** "Wants +2.25 · Taste +0.6 · Started +0.5 = 3.35 pts" */
function PointsLine({ s, className = '' }: { s: Suggestion; className?: string }) {
  const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`)
  return (
    <p className={`flex flex-wrap gap-x-2 text-[11px] tabular-nums text-soft ${className}`}>
      <span>Wants {sign(s.points.want)}</span>
      <span>· Taste {sign(s.points.taste)}</span>
      <span>· Started {sign(s.points.started)}</span>
      <span className="font-semibold text-cream">= {s.score} pts</span>
    </p>
  )
}

/** The rules, in plain words — folded away until you tap it. */
function HowItPicks() {
  return (
    <details className="group rounded-2xl border border-line bg-surface/80 p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold">
        How the wheel picks
        <span className="text-sm font-normal text-muted transition group-open:rotate-180">▾</span>
      </summary>
      <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-soft">
        <li>
          <b className="text-cream">It only uses your club shelf</b> — of the type and genre you chose.
        </li>
        <li>
          <b className="text-cream">It skips what’s been seen:</b> anything someone watching tonight has Completed or Dropped.
        </li>
        <li>
          <b className="text-cream">Every title gets points</b> from the people watching tonight:
          <ul className="mt-1 list-disc pl-4">
            <li>
              <b className="text-cream">Wants</b> — up to 3: how many have it as 📌 Want to or ▶️ In progress.
            </li>
            <li>
              <b className="text-cream">Taste</b> — from −2 to +2: how much they liked these genres before (their star ratings).
            </li>
            <li>
              <b className="text-cream">Started</b> — up to 1: how many already started it.
            </li>
          </ul>
        </li>
        <li>
          <b className="text-cream">Top picks</b> are the highest scores. The <b className="text-cream">wheel</b> takes the top 6 — more points
          means a bigger slice, so a better chance. But any slice can win.
        </li>
        <li>
          <b className="text-cream">Everyone in the club sees the result</b> at the top of this page.
        </li>
      </ol>
    </details>
  )
}

/** The club's latest spin, as a banner everyone sees. */
function TonightsPick({ titleName, image, type, who, when }: { titleName: string; image?: string; type?: MediaType; who: string; when: string }) {
  const time = new Date(when).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return (
    <section className="mb-6 flex items-center gap-4 rounded-2xl border border-gold/50 bg-gold/10 p-3 sm:p-4">
      {type && <Poster src={image} type={type} className="aspect-[2/3] w-14 shrink-0 rounded-lg" />}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Tonight’s pick</p>
        <p className="truncate font-display text-xl font-bold">{titleName}</p>
        <p className="text-xs text-soft">
          {who} spun the wheel at {time}
        </p>
      </div>
    </section>
  )
}
