import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  addMember,
  addTitle,
  emptyClub,
  isHost,
  MEMBER_COLORS,
  removeMember,
  removeTitle,
  updateEntry,
  updateMember,
  withRoles,
  type ClubData,
  type EntryChange,
  type Member,
  type MemberChange,
} from '../lib/club'
import type { SearchResult } from '../types'

const STORAGE_KEY = 'watchparty-club:v1'
/** Which member is using this device — each friend's phone remembers its own. */
const ME_KEY = 'watchparty-club:me'
/** Whether this device has seen the welcome screen. */
const WELCOMED_KEY = 'watchparty-club:welcomed'

/** The placeholder person a brand-new club starts with (the welcome screen fills in their profile). */
function firstMember(): Member {
  return { id: 'me', name: 'Me', color: MEMBER_COLORS[0], role: 'host', joinedAt: new Date().toISOString() }
}

interface ClubStore {
  data: ClubData
  /** The member using this device */
  me: Member
  /** Whether the person using this device is the club's host (admin) */
  amHost: boolean
  setMe: (memberId: string) => void
  add: (result: SearchResult) => void
  remove: (titleId: string) => void
  update: (titleId: string, change: EntryChange) => void
  /** Adds a friend and returns their id */
  addMember: (name: string) => string
  updateMember: (memberId: string, change: MemberChange) => void
  /** Only the host can remove people (and never themselves). */
  removeMember: (memberId: string) => void
  renameClub: (name: string) => void
  welcomed: boolean
  finishWelcome: () => void
}

const ClubContext = createContext<ClubStore | null>(null)

export function ClubProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ClubData>(loadClub)
  const [meId, setMeId] = useState<string | null>(() => read(ME_KEY))
  const [welcomed, setWelcomed] = useState(() => read(WELCOMED_KEY) === 'yes')
  const me = data.members.find((m) => m.id === meId) ?? data.members[0]
  const amHost = isHost(data, me.id)

  // Save to the browser every time something changes.
  useEffect(() => write(STORAGE_KEY, JSON.stringify(data)), [data])
  useEffect(() => write(ME_KEY, me.id), [me.id])

  const store = useMemo<ClubStore>(
    () => ({
      data,
      me,
      amHost,
      setMe: setMeId,
      add: (result) => setData((d) => addTitle(d, result, me.id)),
      remove: (titleId) => setData((d) => removeTitle(d, titleId)),
      update: (titleId, change) => setData((d) => updateEntry(d, me.id, titleId, change)),
      addMember: (name) => {
        const id = crypto.randomUUID()
        setData((d) => addMember(d, name, id))
        return id
      },
      updateMember: (memberId, change) => setData((d) => updateMember(d, memberId, change)),
      removeMember: (memberId) => {
        if (!amHost || memberId === me.id) return
        setData((d) => removeMember(d, memberId))
      },
      renameClub: (name) => setData((d) => ({ ...d, name: name.trim() || undefined })),
      welcomed,
      finishWelcome: () => {
        write(WELCOMED_KEY, 'yes')
        setWelcomed(true)
      },
    }),
    [data, me, amHost, welcomed],
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
    // Clubs saved before roles existed get a host (the first member).
    const members = withRoles(data.members?.length ? data.members : [firstMember()])
    // Entries saved before reviews existed have no "review" field.
    const entries = (data.entries ?? []).map((e) => ({ ...e, review: e.review ?? null }))
    return { name: data.name, members, titles: data.titles ?? {}, entries }
  } catch {
    return { ...emptyClub, members: [firstMember()] }
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
