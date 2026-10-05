import { useEffect, useState, type ReactNode } from 'react'
import { TRENDING } from '../api/search'
import { interleave, pickForYou, topGenres } from '../lib/suggest'
import { useClub } from '../store/ClubContext'
import { MEDIA_TYPES, type MediaType, type SearchResult } from '../types'
import { TypeIcon } from './icons'
import { ScrollRow } from './ui'

type Loaded = Partial<Record<MediaType, SearchResult[] | 'error'>>

// Trending changes slowly: fetch it once per visit and reuse it every time the search bar opens.
let cache: Promise<Loaded> | null = null
function loadTrending(): Promise<Loaded> {
  cache ??= Promise.all(
    MEDIA_TYPES.map(({ type }) =>
      TRENDING[type]()
        .then((list) => [type, list] as const)
        .catch(() => [type, 'error'] as const),
    ),
  ).then((pairs) => Object.fromEntries(pairs) as Loaded)
  return cache
}

const ROW_TITLES: Record<MediaType, string> = {
  movie: 'Trending movies this week',
  series: 'Trending series',
  anime: 'Trending anime',
  book: 'Trending books',
}

/**
 * 🍿 What you see when you tap the search bar before typing: picks "For you" (from the genres
 * on your list) and what's trending this week. Every card has the usual Add to club button.
 */
export function Suggestions({ renderCard }: { renderCard: (result: SearchResult) => ReactNode }) {
  const { data, me } = useClub()
  const [trending, setTrending] = useState<Loaded | null>(null)

  useEffect(() => {
    let alive = true
    void loadTrending().then((t) => alive && setTrending(t))
    return () => {
      alive = false
    }
  }, [])

  const lists = MEDIA_TYPES.map(({ type }) => trending?.[type]).map((l) => (Array.isArray(l) ? l : []))
  const genres = topGenres(data, me.id)
  const forYou = pickForYou(interleave(lists), data, genres)

  return (
    <div className="mt-6 flex flex-col gap-8">
      {genres.length > 0 && (forYou.length > 0 || !trending) && (
        <Row title="For you" note={`Because you like ${genres.join(', ')}`}>
          {trending ? forYou.map((r) => <Slot key={r.id}>{renderCard(r)}</Slot>) : <Placeholders />}
        </Row>
      )}

      {MEDIA_TYPES.map(({ type }) => {
        const list = trending?.[type]
        if (list === 'error' || (Array.isArray(list) && list.length === 0)) return null
        return (
          <Row key={type} title={ROW_TITLES[type]} icon={<TypeIcon type={type} size={18} />}>
            {Array.isArray(list) ? list.map((r) => <Slot key={r.id}>{renderCard(r)}</Slot>) : <Placeholders />}
          </Row>
        )
      })}
    </div>
  )
}

function Row({ title, note, icon, children }: { title: string; note?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-bold">
        {icon}
        {title}
      </h2>
      {note && <p className="text-sm text-muted">{note}</p>}
      <ScrollRow className="-mx-4 mt-3 gap-3 px-4 pb-2">{children}</ScrollRow>
    </section>
  )
}

/** Same card as the search results, in a fixed width so a row can scroll sideways */
function Slot({ children }: { children: ReactNode }) {
  return <div className="flex w-40 shrink-0 snap-start flex-col sm:w-44">{children}</div>
}

function Placeholders() {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="w-40 shrink-0 animate-pulse overflow-hidden rounded-2xl border border-line bg-surface sm:w-44">
          <div className="aspect-[2/3] bg-raised" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-4/5 rounded bg-raised" />
            <div className="h-3 w-1/2 rounded bg-raised" />
          </div>
        </div>
      ))}
    </>
  )
}
