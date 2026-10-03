import { useClub } from '../store/ClubContext'
import { Poster } from './ui'

/**
 * The "Recently added" tray: stays at the bottom of the screen after you add something,
 * so you can see what's in your club — until you close it or open the club shelf.
 */
export function AddedTray({ ids, onOpenClub, onClear }: { ids: string[]; onOpenClub: () => void; onClear: () => void }) {
  const { data, remove } = useClub()
  // Only titles that are still in the club (Undo removes them)
  const added = ids.map((id) => data.titles[id]).filter(Boolean)
  if (added.length === 0) return null
  const latest = added[added.length - 1]
  const shown = added.slice(-4)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-3" role="status" aria-live="polite">
      <div
        key={added.length}
        className="animate-toast pointer-events-auto relative flex w-full max-w-lg items-center gap-3 overflow-hidden rounded-2xl border-2 border-book/60 bg-surface p-3 shadow-2xl shadow-black/60"
      >
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
            {added.length === 1 ? 'Added to the club!' : `${added.length} added to the club!`}
          </p>
          <p className="truncate text-xs text-soft">
            {latest.title}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <button onClick={() => remove(latest.id)} className="text-xs font-semibold text-muted hover:text-cream">
              Undo last
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
          className="shrink-0 rounded-2xl bg-gold px-3.5 py-2.5 text-center font-display text-sm font-extrabold leading-tight text-on-gold transition hover:brightness-110 active:scale-95"
        >
          Open
          <br />
          club shelf →
        </button>
      </div>
    </div>
  )
}
