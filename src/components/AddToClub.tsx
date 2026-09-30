import { useState } from 'react'
import { useClub } from '../store/ClubContext'
import { MEDIA_TYPES } from '../types'
import { Poster } from './ui'

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
    { icon: '＋', title: 'Add it', text: 'Tap the gold “Add to My Club” on anything you’ve watched or want to.' },
    { icon: '🎟️', title: 'It lands on your shelf', text: 'Find it in the My Club tab at the top — like a cinema ticket.' },
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
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold text-xl font-black text-ink shadow-lg shadow-gold/30 sm:h-12 sm:w-12"
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

/**
 * The "Recently added" tray: stays at the bottom of the screen after you add something,
 * so you can see what's in your club — until you close it or open My Club.
 */
export function AddedTray({ ids, onOpenClub, onClear }: { ids: string[]; onOpenClub: () => void; onClear: () => void }) {
  const { data, remove } = useClub()
  // Only titles that are still in the club (Undo removes them)
  const added = ids.map((id) => data.titles[id]).filter(Boolean)
  if (added.length === 0) return null
  const latest = added[added.length - 1]
  const shown = added.slice(-4)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3" role="status" aria-live="polite">
      <div
        key={added.length}
        className="animate-toast pointer-events-auto relative flex w-full max-w-lg items-center gap-3 overflow-hidden rounded-3xl border-2 border-book/60 bg-surface p-3 shadow-2xl shadow-black/60"
      >
        <div className="marquee-lights absolute inset-x-0 top-0 opacity-60" />
        {/* A little fan of the posters you added */}
        <div className="relative h-16 shrink-0" style={{ width: 34 + shown.length * 14 }}>
          {shown.map((t, i) => (
            <div
              key={t.id}
              className="absolute top-0"
              style={{ left: i * 14, transform: `rotate(${(i - shown.length + 1) * 6}deg)`, zIndex: i }}
            >
              <Poster src={t.image} type={t.type} className="h-16 w-11 rounded-lg shadow-lg ring-2 ring-surface" />
            </div>
          ))}
          <span className="absolute -bottom-1 -right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-book text-sm font-black text-ink shadow">
            ✓
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-extrabold leading-tight text-book">
            {added.length === 1 ? 'Added to My Club!' : `${added.length} added to My Club!`}
          </p>
          <p className="truncate text-xs text-soft">
            {MEDIA_TYPES.find((m) => m.type === latest.type)!.emoji} {latest.title}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <button onClick={() => remove(latest.id)} className="text-xs font-semibold text-muted hover:text-cream">
              ↩ Undo last
            </button>
            <button onClick={onClear} className="text-xs font-semibold text-muted hover:text-cream">
              Close
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            onClear()
            onOpenClub()
          }}
          className="shrink-0 rounded-2xl bg-gold px-3.5 py-2.5 text-center font-display text-sm font-extrabold leading-tight text-ink shadow-lg shadow-gold/30 transition hover:brightness-110 active:scale-95"
        >
          Open
          <br />
          My Club →
        </button>
      </div>
    </div>
  )
}
