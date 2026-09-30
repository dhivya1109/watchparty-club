import { Clappy, Poppy, Reel, Stubby } from './Characters'

export type HomeTarget = 'club' | 'tonight' | 'stats'

/**
 * 🎬 The home screen: an IMAX-style screen that says what the app is,
 * with the mascots sitting in front of it.
 */
export function CinemaHero({ onStart, onNavigate }: { onStart: () => void; onNavigate: (page: HomeTarget) => void }) {
  return (
    <section className="animate-pop relative mt-6 overflow-hidden rounded-[2rem] border border-line bg-gradient-to-b from-surface to-night px-4 pb-0 pt-8 sm:px-10 sm:pt-10">
      {/* Projector beam, shining from the back of the room up to the screen */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-6 mx-auto w-full max-w-3xl bg-gradient-to-t from-gold/25 via-gold/10 to-transparent"
        style={{ clipPath: 'polygon(46% 100%, 54% 100%, 100% 0, 0 0)', animation: 'flicker 3.5s infinite' }}
      />

      {/* The curved IMAX screen */}
      <div className="relative mx-auto max-w-4xl [perspective:900px]">
        <div
          className="relative overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-raised via-surface to-raised px-5 py-8 text-center shadow-[0_0_80px_-10px] shadow-gold/40 sm:px-12 sm:py-12"
          style={{ borderRadius: '50% / 9%', transform: 'rotateX(6deg)' }}
        >
          {/* Screen sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
          <p className="relative text-[11px] font-bold uppercase tracking-[0.35em] text-accent">★ Now showing ★</p>
          <h2 className="relative mx-auto mt-3 max-w-2xl text-[clamp(2rem,9vw,3.75rem)] font-extrabold leading-[1.02] tracking-tight">
            Your friends’ own <span className="text-marquee">cinema</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-sm text-soft sm:text-base">
            One shared shelf for the movies, series, anime and books your group loves. Track them like tickets, review
            them, and let the wheel pick tonight’s show.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={onStart}
              className="rounded-full bg-gradient-to-b from-gold to-gold-deep px-5 py-2.5 font-display text-sm font-bold sm:px-6 sm:text-base text-ink shadow-lg shadow-gold/30 transition hover:brightness-110 active:scale-95"
            >
              {/* Shorter words on the smallest phones, so the button stays on one line */}
              <span className="min-[380px]:hidden">🔍 Find something</span>
              <span className="max-[379px]:hidden">🔍 Find something to watch</span>
            </button>
            <button
              onClick={() => onNavigate('tonight')}
              className="rounded-full border border-line bg-night/40 px-5 py-2.5 font-display text-sm font-bold sm:px-6 sm:text-base backdrop-blur transition hover:border-gold hover:text-accent"
            >
              🎡 Spin the wheel
            </button>
          </div>
        </div>
      </div>

      {/* The audience: our mascots in the front row */}
      <div className="relative mx-auto mt-6 grid max-w-2xl grid-cols-4 items-end gap-2 sm:mt-8 sm:gap-6">
        <div className="relative h-24 sm:h-36 lg:h-44">
          {/* Poppy's speech bubble */}
          <div
            className="absolute -top-10 left-1/2 z-10 w-max -translate-x-1/4 rounded-2xl rounded-bl-sm border border-line bg-surface px-3 py-1.5 text-xs font-semibold shadow-lg sm:-top-12 sm:text-sm"
            style={{ animation: 'bubble 6s ease-in-out infinite', transformOrigin: 'bottom left' }}
          >
            What’s on tonight? 🍿
          </div>
          <Poppy />
        </div>
        <div className="h-24 sm:h-36 lg:h-44">
          <Stubby />
        </div>
        <div className="h-24 sm:h-36 lg:h-44">
          <Reel />
        </div>
        <div className="h-24 sm:h-36 lg:h-44">
          <Clappy />
        </div>
      </div>

      {/* Cinema seats */}
      <div className="relative mx-auto mt-2 flex max-w-3xl justify-center gap-1.5 overflow-hidden pb-0 sm:gap-2" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="h-7 w-8 shrink-0 rounded-t-xl bg-raised shadow-inner sm:h-9 sm:w-11">
            <div className="mx-auto mt-1.5 h-2 w-3/4 rounded-full bg-line/70" />
          </div>
        ))}
      </div>
    </section>
  )
}

const WORLD_CINEMA = [
  'Hollywood', 'Bollywood', 'Tollywood', 'Kollywood', 'Mollywood', 'K-Drama', 'Anime', 'Nollywood',
  'French New Wave', 'Telenovelas', 'British TV', 'C-Drama', 'Turkish Dizi', 'Italian Neorealism', 'Bestsellers', 'Manga',
]

/** A film strip of the world's film industries, scrolling forever. */
export function WorldCinemaStrip() {
  const items = [...WORLD_CINEMA, ...WORLD_CINEMA] // twice, so the loop is seamless
  return (
    <div className="film-strip relative mt-10 -rotate-1 overflow-hidden py-4 shadow-xl" aria-label="World cinema: all welcome">
      <div className="flex w-max gap-6 whitespace-nowrap" style={{ animation: 'ticker 40s linear infinite' }}>
        {items.map((name, i) => (
          <span key={i} className="flex items-center gap-6 font-display text-lg font-extrabold uppercase tracking-wide text-[#fff4d6]">
            {name}
            <span className="text-[#ffc53d]">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

const FEATURES: { emoji: string; title: string; text: string; cta?: string; target?: HomeTarget }[] = [
  { emoji: '🔍', title: 'Discover everything', text: 'Movies, series, anime and books from four databases — searched all at once.' },
  { emoji: '🎟️', title: 'Keep your tickets', text: 'Track what you want to watch, what’s playing, and what you finished.', cta: 'Open my club', target: 'club' },
  { emoji: '✍️', title: 'Rate & review', text: 'Stars and honest reviews, so friends know if it’s worth their night.', cta: 'Write a review', target: 'club' },
  { emoji: '🎡', title: 'Can’t decide?', text: 'The wheel picks what everyone here will probably love.', cta: 'Spin now', target: 'tonight' },
]

/** "Now showing" — what the app does, as a row of cinema tickets. */
export function NowShowing({ onNavigate }: { onNavigate: (page: HomeTarget) => void }) {
  return (
    <section className="mt-14">
      <SectionTitle kicker="The programme" title="What’s playing at the club" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <article
            key={f.title}
            className="ticket group flex overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-gold/60"
          >
            {/* Ticket stub */}
            <div className="flex w-10 shrink-0 items-center justify-center border-r-2 border-dashed border-line bg-gold/10">
              <span className="-rotate-90 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.3em] text-accent">
                Admit one · No. 00{i + 1}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-4 pl-5">
              <div className="text-4xl transition duration-300 group-hover:scale-110 group-hover:-rotate-6">{f.emoji}</div>
              <h3 className="mt-3 text-lg font-extrabold">{f.title}</h3>
              <p className="mt-1 flex-1 text-sm text-soft">{f.text}</p>
              {f.cta && f.target && (
                <button onClick={() => onNavigate(f.target!)} className="mt-3 w-fit text-sm font-bold text-accent hover:underline">
                  {f.cta} →
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

const STEPS = [
  { emoji: '👥', title: 'Gather your crew', text: 'Add your friends from the member menu at the top.' },
  { emoji: '➕', title: 'Fill the shelf', text: 'Search anything and tap the gold + to add it.' },
  { emoji: '🍿', title: 'Watch together', text: 'Rate, review, and spin the wheel for movie night.' },
]

export function HowItWorks() {
  return (
    <section className="mt-14">
      <SectionTitle kicker="Tonight’s schedule" title="How it works" />
      <ol className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Dashed line joining the steps (bigger screens) */}
        <div className="absolute left-[16%] right-[16%] top-9 hidden border-t-2 border-dashed border-line sm:block" />
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex flex-col items-center rounded-3xl p-4 text-center">
            <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 border-gold/50 bg-surface text-3xl shadow-lg shadow-gold/10">
              {s.emoji}
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold font-display text-xs font-extrabold text-ink">
                {i + 1}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-extrabold">{s.title}</h3>
            <p className="mt-1 max-w-xs text-sm text-soft">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent">{kicker}</p>
      <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
    </div>
  )
}
