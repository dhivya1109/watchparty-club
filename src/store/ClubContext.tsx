import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  addMember,
  addTitle,
  emptyClub,
  MEMBER_COLORS,
  removeMember,
  removeTitle,
  renameMember,
  updateEntry,
  type ClubData,
  type EntryChange,
  type Member,
} from '../lib/club'
import type { SearchResult } from '../types'

const STORAGE_KEY = 'watchparty-club:v1'
/** Which member is using this device — each friend's phone remembers its own. */
const ME_KEY = 'watchparty-club:me'

const FIRST_MEMBER: Member = { id: 'me', name: 'Me', color: MEMBER_COLORS[0] }

interface ClubStore {
  data: ClubData
  /** The member using this device */
  me: Member
  setMe: (memberId: string) => void
  add: (result: SearchResult) => void
  remove: (titleId: string) => void
  update: (titleId: string, change: EntryChange) => void
  addMember: (name: string) => void
  renameMember: (memberId: string, name: string) => void
  removeMember: (memberId: string) => void
}

const ClubContext = createContext<ClubStore | null>(null)

export function ClubProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ClubData>(loadClub)
  const [meId, setMeId] = useState<string | null>(() => read(ME_KEY))
  const me = data.members.find((m) => m.id === meId) ?? data.members[0]

  // Save to the browser every time something changes.
  useEffect(() => write(STORAGE_KEY, JSON.stringify(data)), [data])
  useEffect(() => write(ME_KEY, me.id), [me.id])

  const store = useMemo<ClubStore>(
    () => ({
      data,
      me,
      setMe: setMeId,
      add: (result) => setData((d) => addTitle(d, result, me.id)),
      remove: (titleId) => setData((d) => removeTitle(d, titleId)),
      update: (titleId, change) => setData((d) => updateEntry(d, me.id, titleId, change)),
      addMember: (name) => setData((d) => addMember(d, name, crypto.randomUUID())),
      renameMember: (memberId, name) => setData((d) => renameMember(d, memberId, name)),
      // The last member can't be removed — the club always has at least one person.
      removeMember: (memberId) => setData((d) => (d.members.length > 1 ? removeMember(d, memberId) : d)),
    }),
    [data, me],
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
    const saved = read(STORAGE_KEY)
    const data: Partial<ClubData> = saved ? JSON.parse(saved) : emptyClub
    // Data saved on Day 1 has no members: everything belonged to "me".
    const members = data.members?.length ? data.members : [FIRST_MEMBER]
    return { members, titles: data.titles ?? {}, entries: data.entries ?? [] }
  } catch {
    return { ...emptyClub, members: [FIRST_MEMBER] }
  }
}

// Browser storage can be full or blocked (e.g. private mode) — the app still works, it just won't remember.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}
