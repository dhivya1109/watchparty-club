import { BookOpen, Clapperboard, Origami, Tv, type LucideProps } from 'lucide-react'
import { STATUSES, type Status } from '../lib/club'
import type { MediaType } from '../types'

/**
 * The app's icons: thin line icons (Lucide) instead of emojis, so the interface
 * feels drawn rather than generated. Statuses keep their emojis (📌 ▶️ ✅ 💤) —
 * colourful and easy to spot on top of a poster.
 */

const TYPE_ICONS = { movie: Clapperboard, series: Tv, anime: Origami, book: BookOpen }

/** 🎬 → a clapperboard, 📺 → a TV, 🍥 → an origami crane, 📚 → a book */
export function TypeIcon({ type, ...props }: { type: MediaType } & LucideProps) {
  const Icon = TYPE_ICONS[type]
  return <Icon aria-hidden="true" size={16} strokeWidth={2} {...props} />
}

/** 📌 Want to · ▶️ In progress · ✅ Completed · 💤 Dropped */
export function StatusIcon({ status, size = 16, className = '' }: { status: Status; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <span aria-hidden="true" className={`inline-block shrink-0 leading-none ${className}`} style={{ fontSize: size }}>
      {STATUSES.find((s) => s.value === status)!.emoji}
    </span>
  )
}
