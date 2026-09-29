import type { CSSProperties } from 'react'

/**
 * A short reaction animation played over a club card.
 * Each reaction is just data: which particles, how they move, and the label.
 */

export type CelebrationKind = 'watching' | 'completed' | 'dropped' | 'loved' | 'okay' | 'bad'

type Motion = 'burst' | 'float' | 'fall'

interface Reaction {
  label: string
  particles: string[]
  motion: Motion
  count: number
  /** Extra effects */
  stamp?: boolean
  beam?: boolean
  /** Label colours */
  tone: string
}

const REACTIONS: Record<CelebrationKind, Reaction> = {
  watching: { label: '▶️ Now playing!', particles: ['🍿', '🍿', '🎞️'], motion: 'float', count: 10, beam: true, tone: 'border-series/60 text-series' },
  completed: { label: '🎉 Completed!', particles: ['■', '●', '▲', '★'], motion: 'burst', count: 26, stamp: true, tone: 'border-book/60 text-book' },
  loved: { label: '🔥 Loved it!', particles: ['❤️', '⭐', '💖', '✨'], motion: 'float', count: 14, tone: 'border-gold/70 text-accent' },
  okay: { label: '🙂 Not bad', particles: ['✨'], motion: 'float', count: 6, tone: 'border-soft/50 text-soft' },
  bad: { label: '🍅 Rotten!', particles: ['🍅', '🍅', '💧'], motion: 'fall', count: 12, tone: 'border-coral/60 text-coral' },
  dropped: { label: '💤 Dropped', particles: ['💤', 'z', 'Z'], motion: 'float', count: 7, tone: 'border-muted/60 text-muted' },
}

/** Confetti colours: the same tokens as index.css */
const CONFETTI = ['#ffc53d', '#ff7a66', '#4cc9f0', '#f472b6', '#a3e635']

/** How long a reaction lasts (ms) — the card removes it afterwards. */
export const CELEBRATION_MS = 1900

export function Celebration({ kind }: { kind: CelebrationKind }) {
  const r = REACTIONS[kind]

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-3xl" aria-hidden="true">
      {r.beam && (
        <div
          className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-gold/35 to-transparent"
          style={{ animation: 'sweep 1.1s ease-in-out 2' }}
        />
      )}

      {Array.from({ length: r.count }, (_, i) => (
        <span key={i} className="particle absolute" style={particleStyle(r, i)}>
          {r.particles[i % r.particles.length]}
        </span>
      ))}

      {r.stamp && (
        <div
          className="absolute left-1/2 top-1/2 rounded-xl border-4 border-book px-4 py-1 font-display text-3xl font-extrabold tracking-widest text-book"
          style={{ animation: `stamp ${CELEBRATION_MS}ms ease-out both`, textShadow: '0 0 12px rgb(163 230 53 / 0.5)' }}
        >
          COMPLETED
        </div>
      )}

      <div
        className={`absolute top-3 left-1/2 whitespace-nowrap rounded-full border bg-night/90 px-4 py-1.5 font-display text-sm font-extrabold shadow-xl ${r.tone}`}
        style={{ animation: `label ${CELEBRATION_MS}ms ease-out both` }}
        role="status"
      >
        {r.label}
      </div>
    </div>
  )
}

/**
 * Where each particle starts and where it goes. Positions come from a formula
 * (spread evenly, like sunflower seeds) instead of randomness, so it always looks balanced.
 */
function particleStyle(r: Reaction, i: number): CSSProperties {
  const spread = (i * 137.5) % 360 // the "golden angle"
  const jitter = ((i * 53) % 40) / 100 // 0 – 0.4
  const delay = `${((i * 97) % 35) / 100}s`
  const rot = `${(i % 2 ? 1 : -1) * (120 + ((i * 71) % 240))}deg`

  if (r.motion === 'burst') {
    const angle = (spread * Math.PI) / 180
    const distance = 90 + ((i * 37) % 80)
    return {
      left: '50%',
      top: '50%',
      color: CONFETTI[i % CONFETTI.length],
      fontSize: 10 + ((i * 7) % 8),
      animation: `burst 1.2s cubic-bezier(0.1, 0.7, 0.3, 1) ${((i * 13) % 20) / 100}s both`,
      ['--dx' as string]: `${Math.cos(angle) * distance * 1.4}px`,
      ['--dy' as string]: `${Math.sin(angle) * distance}px`,
      ['--rot' as string]: rot,
    }
  }

  const left = `${6 + ((spread / 360) * 88)}%`
  if (r.motion === 'fall') {
    return {
      left,
      top: 0,
      fontSize: 20 + ((i * 5) % 10),
      animation: `fall ${1.1 + jitter}s cubic-bezier(0.5, 0, 0.9, 0.6) ${delay} both`,
      ['--rot' as string]: rot,
    }
  }

  // float
  return {
    left,
    bottom: 8,
    fontSize: 16 + ((i * 5) % 12),
    animation: `float-up ${1.3 + jitter}s ease-out ${delay} both`,
    ['--dx' as string]: `${((i * 29) % 60) - 30}px`,
    ['--rot' as string]: `${((i * 41) % 50) - 25}deg`,
  }
}
