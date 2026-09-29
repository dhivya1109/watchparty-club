import type { CSSProperties, ReactNode } from 'react'

/**
 * The WatchParty mascots, drawn with SVG shapes and animated with CSS (see index.css → "Mascots").
 * They keep their own colours in every theme — like cartoon characters do.
 */

const OUTLINE = '#1b1320'
const CREAM = '#fff4d6'

/** Parts that move need their own transform origin. */
const part = (origin: string, animation: string): CSSProperties => ({
  transformBox: 'fill-box',
  transformOrigin: origin,
  animation,
})

function Face({ x, y, gap = 20, blinkDelay = '0s' }: { x: number; y: number; gap?: number; blinkDelay?: string }) {
  return (
    <g>
      {[x - gap / 2, x + gap / 2].map((ex) => (
        <g key={ex} style={part('center', `blink 4.5s ${blinkDelay} infinite`)}>
          <ellipse cx={ex} cy={y} rx="4.2" ry="5" fill={OUTLINE} />
          <circle cx={ex + 1.4} cy={y - 1.8} r="1.4" fill="#fff" />
        </g>
      ))}
      <ellipse cx={x - gap / 2 - 5} cy={y + 8} rx="4" ry="2.4" fill="#ff8fa3" opacity="0.7" />
      <ellipse cx={x + gap / 2 + 5} cy={y + 8} rx="4" ry="2.4" fill="#ff8fa3" opacity="0.7" />
      <path d={`M${x - 7} ${y + 9} Q${x} ${y + 17} ${x + 7} ${y + 9}`} fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  )
}

/** 🍿 Poppy — a popcorn bucket who can't stop bouncing. */
export function Poppy() {
  const stripes = [0, 2, 4].map((i) => {
    const t1 = 22 + i * 11.2
    const b1 = 30 + i * 8
    return `M${t1} 52 L${t1 + 11.2} 52 L${b1 + 8} 114 L${b1} 114 Z`
  })
  return (
    <Mascot delay="0s">
      <svg viewBox="0 0 100 120" className="h-full w-full overflow-visible">
        {/* Kernels popping out */}
        {[-14, 10, 22].map((kx, i) => (
          <circle
            key={kx}
            cx="50"
            cy="40"
            r="5"
            fill={CREAM}
            stroke="#e9c46a"
            strokeWidth="1.5"
            style={{ ...part('center', `kernel 2.4s ease-out ${i * 0.8}s infinite`), ['--kx' as string]: `${kx}px` }}
          />
        ))}
        {/* Popcorn heap */}
        {[
          [30, 46, 10], [44, 40, 11], [58, 41, 11], [71, 47, 10], [37, 34, 9], [52, 30, 10], [65, 35, 9],
        ].map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={CREAM} stroke="#e9c46a" strokeWidth="1.5" />
        ))}
        {/* Bucket */}
        <path d="M20 52 L80 52 L72 114 L28 114 Z" fill="#fff" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
        {stripes.map((d) => (
          <path key={d} d={d} fill="#e63946" />
        ))}
        <path d="M20 52 L80 52 L72 114 L28 114 Z" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
        <rect x="17" y="49" width="66" height="8" rx="4" fill="#e63946" stroke={OUTLINE} strokeWidth="3" />
        <rect x="33" y="66" width="34" height="30" rx="12" fill="#fff" opacity="0.92" />
        <Face x={50} y={76} gap={16} />
      </svg>
    </Mascot>
  )
}

/** 🎟️ Stubby — a cinema ticket who waves hello. */
export function Stubby() {
  return (
    <Mascot delay="0.3s">
      <svg viewBox="0 0 100 120" className="h-full w-full overflow-visible">
        {/* Waving arm */}
        <g style={part('0% 100%', 'wave 1.6s ease-in-out infinite')}>
          <path d="M82 70 L96 46" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
          <circle cx="96" cy="44" r="6" fill="#ffd166" stroke={OUTLINE} strokeWidth="3" />
        </g>
        <path d="M18 70 L8 90" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
        {/* Ticket body with notches */}
        <path
          d="M20 30 H80 V58 A7 7 0 0 0 80 72 V110 H20 V72 A7 7 0 0 0 20 58 Z"
          fill="#ffd166"
          stroke={OUTLINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="26" y1="65" x2="74" y2="65" stroke={OUTLINE} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
        <text x="50" y="45" textAnchor="middle" fontSize="9" fontWeight="800" fill="#b5390f" fontFamily="Bricolage Grotesque, sans-serif">
          ADMIT ONE
        </text>
        <Face x={50} y={84} gap={18} blinkDelay="1.2s" />
        {/* Legs */}
        <path d="M38 110 V118 M62 110 V118" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
      </svg>
    </Mascot>
  )
}

/** 🎞️ Reel — a film reel who is always rolling. */
export function Reel() {
  return (
    <Mascot delay="0.6s">
      <svg viewBox="0 0 100 120" className="h-full w-full overflow-visible">
        {/* Film tail */}
        <path d="M78 78 Q96 96 84 116" fill="none" stroke="#3a3346" strokeWidth="9" strokeLinecap="round" />
        <path d="M78 78 Q96 96 84 116" fill="none" stroke="#ffd166" strokeWidth="2" strokeDasharray="3 5" />
        {/* Spinning reel */}
        <g style={part('center', 'reel-spin 5s linear infinite')}>
          <circle cx="50" cy="62" r="40" fill="#8e8aa8" stroke={OUTLINE} strokeWidth="3" />
          {[0, 72, 144, 216, 288].map((a) => {
            const r = (a * Math.PI) / 180
            return <circle key={a} cx={50 + Math.sin(r) * 24} cy={62 - Math.cos(r) * 24} r="9" fill="#4d4863" stroke={OUTLINE} strokeWidth="2.5" />
          })}
        </g>
        {/* Face on the hub (doesn't spin) */}
        <circle cx="50" cy="62" r="17" fill="#d9d6ea" stroke={OUTLINE} strokeWidth="3" />
        <Face x={50} y={60} gap={12} blinkDelay="2.4s" />
      </svg>
    </Mascot>
  )
}

/** 🎬 Clappy — a clapperboard who claps for every good film. */
export function Clappy() {
  return (
    <Mascot delay="0.9s">
      <svg viewBox="0 0 100 120" className="h-full w-full overflow-visible">
        {/* Clapper arm (claps!) */}
        <g style={part('0% 100%', 'clap 2.2s ease-in-out infinite')}>
          <rect x="16" y="30" width="70" height="14" rx="3" fill="#fff" stroke={OUTLINE} strokeWidth="3" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${24 + i * 16} 31.5 L${32 + i * 16} 31.5 L${26 + i * 16} 42.5 L${18 + i * 16} 42.5 Z`} fill={OUTLINE} />
          ))}
        </g>
        {/* Board */}
        <rect x="16" y="46" width="70" height="60" rx="6" fill="#2b2536" stroke={OUTLINE} strokeWidth="3" />
        <rect x="16" y="46" width="70" height="10" fill="#fff" stroke={OUTLINE} strokeWidth="3" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${24 + i * 16} 47.5 L${32 + i * 16} 47.5 L${26 + i * 16} 54.5 L${18 + i * 16} 54.5 Z`} fill={OUTLINE} />
        ))}
        <rect x="26" y="68" width="50" height="26" rx="9" fill="#f1eef8" />
        <Face x={51} y={77} gap={16} blinkDelay="3.1s" />
        <text x="24" y="102" fontSize="6" fill="#bdb6cf" fontFamily="DM Sans, sans-serif">SCENE 1 · TAKE 1</text>
      </svg>
    </Mascot>
  )
}

/** Wraps a character: bobbing gently, with a soft shadow on the floor. */
function Mascot({ delay, children }: { delay: string; children: ReactNode }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="h-full w-full" style={{ animation: `bob 2.6s ease-in-out ${delay} infinite` }}>
        {children}
      </div>
      <div className="mt-1 h-2 w-3/5 rounded-full bg-black/30 blur-[3px]" style={{ animation: `shadow 2.6s ease-in-out ${delay} infinite` }} />
    </div>
  )
}
