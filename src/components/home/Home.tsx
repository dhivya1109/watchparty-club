import { FerrisWheel, PenLine, Plus, Search, Star, Ticket, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type HomeTarget = 'club' | 'tonight' | 'stats'

const WORLD_CINEMA = [
  'Hollywood', 'Bollywood', 'Tollywood', 'Kollywood', 'Mollywood', 'K-Drama', 'Anime', 'Nollywood',
  'French New Wave', 'Telenovelas', 'British TV', 'C-Drama', 'Turkish Dizi', 'Italian Neorealism', 'Bestsellers', 'Manga',
]

/** One frame of film: the sprocket holes repeat every 18px (see .film-strip in index.css). */
const FRAME = 18

/**
 * A film strip of the world's film industries, scrolling right to left forever.
 * The tape itself (with its sprocket holes) moves, not just the words.
 * The names are shown twice; each copy is rounded up to whole frames, so when the
 * strip jumps back to the start the holes line up exactly and the loop is seamless.
 */
export function WorldCinemaStrip() {
  const measure = useRef<HTMLDivElement>(null)
  const [copyWidth, setCopyWidth] = useState<number>()

  useEffect(() => {
    const el = measure.current
    if (!el) return
    const update = () => setCopyWidth(Math.ceil(el.scrollWidth / FRAME) * FRAME)
    update()
    const observer = new ResizeObserver(update) // e.g. when the fonts finish loading
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative mt-10 -rotate-1 overflow-hidden shadow-xl" aria-label="World cinema: all welcome">
      <div className="film-strip flex w-max py-4" style={{ animation: 'ticker 40s linear infinite' }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="shrink-0" style={{ width: copyWidth }} aria-hidden={copy === 1}>
            <div ref={copy === 0 ? measure : undefined} className="flex w-max gap-6 whitespace-nowrap pl-6">
              {WORLD_CINEMA.map((name) => (
                <span key={name} className="flex items-center gap-6 font-display text-lg font-extrabold uppercase tracking-wide text-[#fff4d6]">
                  {name}
                  <span className="text-[#ffc53d]">✦</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEATURES: { icon: LucideIcon; title: string; text: string; cta: string; target: HomeTarget | 'search' }[] = [
  { icon: Search, title: 'Discover everything', text: 'Movies, series, anime and books from four databases — searched all at once.', cta: 'Start searching', target: 'search' },
  { icon: Ticket, title: 'Keep your tickets', text: 'Track what you want to watch, what’s playing, and what you finished.', cta: 'Open my club', target: 'club' },
  { icon: PenLine, title: 'Rate & review', text: 'Stars and honest reviews, so friends know if it’s worth their night.', cta: 'Write a review', target: 'club' },
  { icon: FerrisWheel, title: 'Can’t decide?', text: 'The wheel picks what everyone here will probably love.', cta: 'Spin now', target: 'tonight' },
]

/** "Now showing" — what the app does, as a row of cinema tickets. Each whole ticket is a button. */
export function NowShowing({ onNavigate, onSearch }: { onNavigate: (page: HomeTarget) => void; onSearch: () => void }) {
  return (
    <section className="mt-14">
      <SectionTitle kicker="The programme" title="What’s playing at the club" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <button
            key={f.title}
            onClick={() => (f.target === 'search' ? onSearch() : onNavigate(f.target))}
            className="ticket group flex overflow-hidden rounded-2xl border border-line bg-surface text-left transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl active:scale-[0.98]"
          >
            {/* Ticket stub */}
            <span className="flex w-10 shrink-0 items-center justify-center self-stretch border-r-2 border-dashed border-line bg-gold/10">
              <span className="-rotate-90 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.12em] text-accent">
                Admit one · No. 00{i + 1}
              </span>
            </span>
            <span className="flex flex-1 flex-col p-4 pl-5">
              <f.icon size={28} strokeWidth={1.75} aria-hidden="true" className="text-accent" />
              <span className="mt-3 font-display text-lg font-extrabold">{f.title}</span>
              <span className="mt-1 flex-1 text-sm text-soft">{f.text}</span>
              {/* Looks like a button, because the whole ticket is one */}
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/50 px-3.5 py-1.5 text-sm font-bold text-accent transition group-hover:border-gold group-hover:bg-gold group-hover:text-on-gold">
                {f.cta} <span className="transition group-hover:translate-x-0.5">→</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

const STEPS = [
  { icon: Users, title: 'Gather your crew', text: 'Invite friends to your club from the Friends tab.' },
  { icon: Plus, title: 'Add to the club', text: 'Search anything and tap “Add to club” — it lands on the club shelf for everyone.' },
  { icon: Star, title: 'Track, rate, review', text: 'Mark your progress, give stars, and spin the wheel for movie night.' },
]

/** How it works — information only, so nothing here looks like a button. */
export function HowItWorks() {
  return (
    <section className="mt-14">
      <SectionTitle kicker="Tonight’s schedule" title="How it works" />
      <ol className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3 sm:flex-col sm:gap-2">
            <s.icon size={26} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-muted" />
            <span>
              <span className="block text-xs font-bold uppercase tracking-wider text-muted">Step {i + 1}</span>
              <span className="block font-display text-lg font-extrabold">{s.title}</span>
              <span className="mt-0.5 block text-sm text-soft">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">{kicker}</p>
      <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
    </div>
  )
}
