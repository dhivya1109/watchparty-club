import { useState } from 'react'

const HIDE_KEY = 'watchparty-club:howto-hidden'

/** 🎟️ "How your club works" — three steps, shown above search so nobody has to guess. */
export function ClubExplainer() {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDE_KEY) === 'yes'
    } catch {
      return false
    }
  })
  const setHide = (value: boolean) => {
    setHidden(value)
    try {
      if (value) localStorage.setItem(HIDE_KEY, 'yes')
      else localStorage.removeItem(HIDE_KEY)
    } catch {
      // ignore
    }
  }

  if (hidden) {
    return (
      <button onClick={() => setHide(false)} className="mt-3 text-xs font-semibold text-accent hover:underline sm:text-sm">
        🎟️ How does the club work?
      </button>
    )
  }

  const steps = [
    { icon: '＋', title: 'Add it', text: 'Tap the gold “Add to club” on anything you’ve watched or want to watch.' },
    { icon: '🎟️', title: 'It lands on the club shelf', text: 'Everyone sees it — marked as your pick — and it’s on your own list too.' },
    { icon: '⭐', title: 'Track, rate, review', text: 'Mark progress, give stars, write a review. Friends see it all.' },
  ]

  return (
    <section className="animate-pop relative mt-4 overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/10 via-surface to-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent">🎟️ How your club works</p>
        <button onClick={() => setHide(true)} className="rounded-full px-2 py-0.5 text-xs font-semibold text-muted hover:text-cream">
          Got it ✕
        </button>
      </div>
      <ol className="mt-3 grid grid-cols-3 gap-2 sm:gap-6">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left">
            <span
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold text-xl font-black text-on-gold shadow-lg shadow-gold/30 sm:h-12 sm:w-12"
              style={{ animation: `bob 2.6s ease-in-out ${i * 0.3}s infinite` }}
            >
              {s.icon}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-extrabold text-gold">
                {i + 1}
              </span>
            </span>
            <span className="mt-2 sm:mt-0">
              <span className="block text-xs font-extrabold leading-tight sm:text-base">{s.title}</span>
              <span className="mt-0.5 hidden text-sm text-soft sm:block">{s.text}</span>
            </span>
            {/* Arrow to the next step */}
            {i < steps.length - 1 && (
              <span className="absolute -right-2.5 top-3 text-lg text-accent sm:-right-5 sm:top-3" aria-hidden="true">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
