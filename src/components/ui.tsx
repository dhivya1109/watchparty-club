import type { ReactNode } from 'react'
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
          ? 'border-gold bg-gold text-ink shadow-lg shadow-gold/20'
          : 'border-line bg-raised/60 text-soft hover:border-muted hover:text-cream'
      }`}
    >
      {children}
    </button>
  )
}

/** "🎬 Movie" label with the type's colour dot. */
export function TypeBadge({ type, className = '' }: { type: MediaType; className?: string }) {
  const meta = MEDIA_TYPES.find((m) => m.type === type)!
  const style = TYPE_STYLE[type]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {meta.label.replace(/s$/, '')}
    </span>
  )
}

/** A poster image, or the type's emoji when there is no image. */
export function Poster({ src, type, className = '' }: { src?: string; type: MediaType; className?: string }) {
  const emoji = MEDIA_TYPES.find((m) => m.type === type)!.emoji
  return (
    <div className={`relative overflow-hidden bg-raised ${className}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-raised to-surface text-4xl">
          {emoji}
        </div>
      )}
    </div>
  )
}

/** Big friendly message for empty pages, with one clear next step. */
export function EmptyState({
  emoji,
  title,
  text,
  action,
  onAction,
}: {
  emoji: string
  title: string
  text: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="animate-pop mx-auto max-w-md px-4 py-20 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-raised text-5xl ring-1 ring-line shadow-2xl shadow-gold/10">
        {emoji}
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
      className={`rounded-full bg-gradient-to-b from-gold to-gold-deep px-6 py-2.5 font-display font-bold text-ink shadow-lg shadow-gold/25 transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

/** A rounded panel on the surface colour. */
export function Panel({ title, note, children, className = '' }: { title?: ReactNode; note?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line bg-surface/80 p-5 backdrop-blur ${className}`}>
      {title && <h2 className="text-lg font-bold">{title}</h2>}
      {note && <p className="text-xs text-muted">{note}</p>}
      <div className={title || note ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}
