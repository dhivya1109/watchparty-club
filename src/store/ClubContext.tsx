import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { addTitle, emptyClub, removeTitle, updateEntry, type ClubData, type EntryChange } from '../lib/club'
import type { SearchResult } from '../types'

const STORAGE_KEY = 'watchparty-club:v1'

/** Until we add members on Day 2, everything belongs to one local member. */
export const ME = 'me'

interface ClubStore {
  data: ClubData
  add: (result: SearchResult) => void
  remove: (titleId: string) => void
  update: (titleId: string, change: EntryChange) => void
}

const ClubContext = createContext<ClubStore | null>(null)

export function ClubProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ClubData>(loadClub)

  // Save to the browser every time the data changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Storage can be full or blocked (e.g. private mode) — the app still works, it just won't remember.
    }
  }, [data])

  const store = useMemo<ClubStore>(
    () => ({
      data,
      add: (result) => setData((d) => addTitle(d, result, ME)),
      remove: (titleId) => setData((d) => removeTitle(d, titleId)),
      update: (titleId, change) => setData((d) => updateEntry(d, ME, titleId, change)),
    }),
    [data],
  )

  return <ClubContext.Provider value={store}>{children}</ClubContext.Provider>
}

export function useClub(): ClubStore {
  const store = useContext(ClubContext)
  if (!store) throw new Error('useClub must be used inside <ClubProvider>')
  return store
}

function loadClub(): ClubData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as ClubData) : emptyClub
  } catch {
    return emptyClub
  }
}
