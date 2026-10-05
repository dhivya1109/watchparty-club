import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { TypeIcon } from './icons'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MEDIA_TYPES, TYPE_STYLE, type MediaType } from '../types'

/**
 * The app's small UI kit: shared building blocks so every page looks consistent.
 */

/**
 * Draws its children straight onto the page body. Needed for pop-ups opened from the header:
 * the header's blur effect would otherwise trap "full-screen" layers inside the header's box.
 */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}

/**
 * A dropdown that looks the same everywhere: full width of its space, text cut off
 * neatly if too long, and our own ▾ arrow (browsers draw theirs in different places).
 */
export function Select({
  label,
  value,
  onChange,
  children,
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none truncate rounded-full border border-line bg-raised py-2 pl-4 pr-9 text-sm text-soft outline-none transition hover:border-muted focus:border-gold"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">▾</span>
    </label>
  )
}

/**
 * A single row of filter pills you can swipe sideways — never wraps into ragged rows.
 * `edge` matches the padding of what it sits in (page = 4, panel = 5), so the row scrolls edge to edge.
 */
export function PillRow({ children, className = '', edge = 4 }: { children: ReactNode; className?: string; edge?: 4 | 5 }) {
  const bleed = edge === 5 ? '-mx-5 px-5' : '-mx-4 px-4'
  return <div className={`no-scrollbar flex gap-2 overflow-x-auto pb-1 ${bleed} ${className}`}>{children}</div>
}

/** Rounded filter / tab button. Active = gold. */
export function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? 'border-gold bg-gold text-on-gold'
          : 'border-line bg-raised/60 text-soft hover:border-muted hover:text-cream'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * A sideways row of posters. Phones swipe; on bigger screens (mouse, trackpad, monitor)
 * round ‹ › buttons appear at the edges whenever there's more to see in that direction.
 */
export function ScrollRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  const row = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState({ left: false, right: false })

  const check = () => {
    const el = row.current
    if (!el) return
    const left = el.scrollLeft > 4
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }))
  }
  // Re-check after every render (posters added or removed) and when the window resizes
  useEffect(check)
  useEffect(() => {
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const scroll = (direction: 1 | -1) => row.current?.scrollBy({ left: direction * row.current.clientWidth * 0.8, behavior: 'smooth' })
  const arrow =
    'absolute top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/95 text-cream shadow-lg backdrop-blur transition hover:border-gold sm:flex'

  return (
    <div className="relative">
      <div ref={row} onScroll={check} className={`no-scrollbar flex snap-x overflow-x-auto ${className}`}>
        {children}
      </div>
      {more.left && (
        <button onClick={() => scroll(-1)} aria-label="Scroll left" className={`${arrow} -left-1`}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      )}
      {more.right && (
        <button onClick={() => scroll(1)} aria-label="Scroll right" className={`${arrow} -right-1`}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/** "Movie" label with the type's icon, in the type's colour. */
export function TypeBadge({ type, className = '' }: { type: MediaType; className?: string }) {
  const meta = MEDIA_TYPES.find((m) => m.type === type)!
  const style = TYPE_STYLE[type]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text} ${className}`}
    >
      <TypeIcon type={type} size={12} strokeWidth={2.4} />
      {meta.label.replace(/s$/, '')}
    </span>
  )
}

/** A poster image, or the type's icon when there is no image. */
export function Poster({ src, type, className = '' }: { src?: string; type: MediaType; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-raised ${className}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center bg-raised text-muted">
          <TypeIcon type={type} size={36} strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}

/** Big friendly message for empty pages, with one clear next step. */
export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  onAction,
}: {
  icon: LucideIcon
  title: string
  text: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="animate-pop mx-auto max-w-md px-4 py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-raised text-muted ring-1 ring-line">
        <Icon size={34} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <h2 className="mt-6 text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-soft">{text}</p>
      <GoldButton onClick={onAction} className="mt-7">
        {action}
      </GoldButton>
    </div>
  )
}

/** The main call-to-action button. */
export function GoldButton({
  onClick,
  disabled,
  children,
  className = '',
}: {
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full bg-gold px-6 py-2.5 font-display font-bold text-on-gold transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

/** A rounded panel on the surface colour. */
export function Panel({ title, note, children, className = '' }: { title?: ReactNode; note?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface/80 p-5 backdrop-blur ${className}`}>
      {title && <h2 className="text-lg font-bold">{title}</h2>}
      {note && <p className="text-xs text-muted">{note}</p>}
      <div className={title || note ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}
