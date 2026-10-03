import { Bookmark, BookOpen, CircleCheck, CircleSlash, Clapperboard, Origami, Play, Tv, type LucideProps } from 'lucide-react'
import type { Status } from '../lib/club'
import type { MediaType } from '../types'

/**
 * The app's icons: thin line icons (Lucide) instead of emojis, so the interface
 * feels drawn rather than generated. Emojis stay only where people chose them
 * (profile emoji, reactions) and in the mascots.
 */

const TYPE_ICONS = { movie: Clapperboard, series: Tv, anime: Origami, book: BookOpen }
const STATUS_ICONS = { want: Bookmark, watching: Play, completed: CircleCheck, dropped: CircleSlash }

/** 🎬 → a clapperboard, 📺 → a TV, 🍥 → an origami crane, 📚 → a book */
export function TypeIcon({ type, ...props }: { type: MediaType } & LucideProps) {
  const Icon = TYPE_ICONS[type]
  return <Icon aria-hidden="true" size={16} strokeWidth={2} {...props} />
}

/** Want to → bookmark, In progress → play, Completed → check, Dropped → slashed circle */
export function StatusIcon({ status, ...props }: { status: Status } & LucideProps) {
  const Icon = STATUS_ICONS[status]
  return <Icon aria-hidden="true" size={16} strokeWidth={2} {...props} />
}
