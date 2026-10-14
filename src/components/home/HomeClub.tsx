import { useState } from 'react'
import { getEntry, type ClubTitle } from '../../lib/club'
import { useClub } from '../../store/ClubContext'
import { LENGTH_UNIT } from '../../types'
import { PosterTile, TitleSheet } from '../ClubPage'
import { Poster, ScrollRow } from '../ui'

/**
 * 🏠 The top of the home screen, made from YOUR club: a greeting over a dimmed collage of the
 * club's own posters, and a live line about your list and your club.
 */
export function HomeHeader() {
  const { data, me, activeClub } = useClub()
  const [hour] = useState(() => new Date().getHours())
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const first = me.name.trim().split(/\s+/)[0]

  const titles = Object.values(data.titles)
  const posters = titles.filter((t) => t.image).sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 8)
  const mine = titles.map((t) => getEntry(data, me.id, t.id)).filter(Boolean)
  const watching = mine.filter((e) => e!.status === 'watching').length
  const facts = [
    watching > 0 && `${watching} in progress`,
    mine.length > 0 && `${mine.length} on your list`,
    data.members.length > 1 && `${data.members.length} people in ${data.name ?? activeClub?.name ?? 'your club'}`,
  ].filter(Boolean)

  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
      {/* The club's own posters, tilted and dimmed, as a backdrop */}
      {posters.length > 0 && (
        <div className="pointer-events-none absolute inset-0 flex -rotate-6 scale-125 items-center gap-2 opacity-40" aria-hidden="true">
          {posters.map((t) => (
            <Poster key={t.id} src={t.image} type={t.type} className="aspect-[2/3] w-24 shrink-0 rounded-lg sm:w-32" />
          ))}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-surface/40" aria-hidden="true" />

      <div className="relative flex items-end gap-3 p-5 sm:p-7">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {part}
            {first ? `, ${first}` : ''}
          </h1>
          <p className="mt-1 text-soft">What are we watching tonight?</p>
          {facts.length > 0 && <p className="mt-3 text-sm text-muted">{facts.join(' · ')}</p>}
        </div>
      </div>
    </section>
  )
}

/** "Continue watching": what you're in the middle of, with how far you are. Tap to update it. */
export function ContinueWatching() {
  const { data, me } = useClub()
  const [openId, setOpenId] = useState<string | null>(null)
  const items = Object.values(data.titles)
    .map((title) => ({ title, entry: getEntry(data, me.id, title.id) }))
    .filter((i) => i.entry?.status === 'watching')
    .sort((a, b) => b.entry!.updatedAt.localeCompare(a.entry!.updatedAt))
  if (items.length === 0) return null

  return (
    <HomeRow title="Continue watching" note="Tap to update your progress">
      {items.map(({ title, entry }) => (
        <ProgressCard key={title.id} title={title} progress={entry!.progress} onOpen={() => setOpenId(title.id)} />
      ))}
      {openId && <TitleSheet titleId={openId} onClose={() => setOpenId(null)} />}
    </HomeRow>
  )
}

/** "New on the club shelf": the latest picks, with who added them. */
export function ClubLatest() {
  const { data, me } = useClub()
  const [openId, setOpenId] = useState<string | null>(null)
  const latest = Object.values(data.titles)
    .filter((t) => t.addedBy !== me.id)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, 12)
  if (latest.length === 0) return null

  return (
    <HomeRow title={`New on the ${data.name ?? 'club'} shelf`} note="Your friends’ latest picks">
      {latest.map((t) => (
        <div key={t.id} className="w-[7.25rem] shrink-0 snap-start sm:w-36">
          <PosterTile title={t} showPicker onOpen={() => setOpenId(t.id)} />
        </div>
      ))}
      {openId && <TitleSheet titleId={openId} onClose={() => setOpenId(null)} />}
    </HomeRow>
  )
}

function HomeRow({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted">{note}</p>
      <ScrollRow className="-mx-4 mt-3 gap-3 px-4 pb-2 pt-1">{children}</ScrollRow>
    </section>
  )
}

function ProgressCard({ title, progress, onOpen }: { title: ClubTitle; progress: number; onOpen: () => void }) {
  const percent = title.length ? Math.round((progress / title.length) * 100) : null
  return (
    <button onClick={onOpen} className="group w-[7.25rem] shrink-0 snap-start text-left sm:w-36" aria-label={`Update ${title.title}`}>
      <div className="relative">
        <Poster src={title.image} type={title.type} className="aspect-[2/3] rounded-xl shadow-md transition duration-300 group-hover:-translate-y-1" />
        {percent !== null && (
          <div className="absolute inset-x-1.5 bottom-1.5 h-1.5 overflow-hidden rounded-full bg-night/70">
            <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-tight">{title.title}</p>
      <p className="text-[11px] text-muted">
        {progress > 0 ? `${progress}${title.length ? ` / ${title.length}` : ''} ${LENGTH_UNIT[title.type]}` : 'Just started'}
      </p>
    </button>
  )
}
