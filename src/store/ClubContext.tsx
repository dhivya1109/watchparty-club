import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  addTitle,
  emptyClub,
  getEntry,
  removeTitle,
  updateEntry,
  type ClubData,
  type EntryChange,
  type Member,
  type MemberChange,
} from '../lib/club'
import * as cloud from '../lib/cloud'
import type { ClubSummary } from '../lib/cloud'
import type { SearchResult } from '../types'
import { useToast } from '../components/Toast'

/**
 * The club store, backed by the shared database.
 *
 * status:
 *  - loading  → checking this device's account
 *  - auth     → not logged in → the log-in / create-account screen
 *  - setup    → logged in, but no profile yet → the welcome (profile) screen
 *  - no-club  → has a profile, but isn't in any club → create or join one
 *  - ready    → a club is open
 *  - error    → something is misconfigured
 *
 * Changes show on screen immediately ("optimistic"), then save in the background.
 */

export type StoreStatus = 'loading' | 'auth' | 'setup' | 'no-club' | 'ready' | 'error'

const ACTIVE_KEY = 'watchparty-club:active-club'
const PENDING_JOIN_KEY = 'watchparty-club:pending-join'
/** The old, device-only club (before sharing existed) */
const LOCAL_KEY = 'watchparty-club:v1'
const LOCAL_ME_KEY = 'watchparty-club:me'
const IMPORTED_KEY = 'watchparty-club:imported'

const PLACEHOLDER_ME: Member = { id: '', name: 'You', color: '#8b5cf6', role: 'member' }

interface ClubStore {
  status: StoreStatus
  error: string | null
  /** The current club (empty until one is open) */
  data: ClubData
  me: Member
  amHost: boolean
  clubs: ClubSummary[]
  activeClub: ClubSummary | null
  /** An invite code from a link, waiting to be used once you have a profile */
  pendingInvite: string | null
  /** Who invited you to which club (shown before signing in); null if unknown */
  invitePreview: cloud.InvitePreview | null
  /** Changes each time you join a club from an invite — the app then opens that club's shelf */
  joinedCount: number
  /** Titles in the old device-only club that can be brought into a shared club */
  localTitleCount: number

  /** Is this a guest account (this browser only), or saved with an email? */
  account: cloud.Account
  /** Log in (or create an account): step 1 emails a code, step 2 checks it */
  sendLoginCode: (email: string) => Promise<void>
  verifyLoginCode: (email: string, code: string) => Promise<void>
  /** Older guest accounts: add an email so they're kept — same two steps */
  sendSaveCode: (email: string) => Promise<void>
  confirmSaveCode: (email: string, code: string) => Promise<void>
  signOut: () => Promise<void>

  setupProfile: (profile: cloud.Profile) => Promise<void>
  updateProfile: (change: MemberChange) => Promise<void>
  createClub: (name: string, importLocal: boolean) => Promise<void>
  joinClub: (linkOrCode: string) => Promise<void>
  switchClub: (clubId: string) => void
  renameClub: (name: string) => void
  removeMember: (memberId: string) => void
  leaveClub: () => Promise<void>

  add: (result: SearchResult) => void
  remove: (titleId: string) => void
  update: (titleId: string, change: EntryChange) => void
}

const ClubContext = createContext<ClubStore | null>(null)

export function ClubProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [status, setStatus] = useState<StoreStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Member | null>(null)
  const [clubs, setClubs] = useState<ClubSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [data, setData] = useState<ClubData>(emptyClub)
  const [pendingInvite, setPendingInvite] = useState<string | null>(() => readInviteFromUrl())
  const pendingRef = useRef(pendingInvite)
  const [invitePreview, setInvitePreview] = useState<cloud.InvitePreview | null>(null)
  const [joinedCount, setJoinedCount] = useState(0)
  const [account, setAccount] = useState<cloud.Account>({ email: null, isGuest: false })
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fail = useCallback(
    (err: unknown) => toast({ title: 'Something went wrong', text: err instanceof Error ? err.message : String(err), emoji: '⚠️' }),
    [toast],
  )

  /** Load my clubs, and open one (the one asked for, the last one used, or the first). */
  const loadClubs = useCallback(async (uid: string, preferId?: string) => {
    const list = await cloud.fetchMyClubs(uid)
    setClubs(list)
    const remembered = read(ACTIVE_KEY)
    const pick = list.find((c) => c.id === preferId) ?? list.find((c) => c.id === remembered) ?? list[0]
    setActiveId(pick?.id ?? null)
    setStatus(pick ? 'ready' : 'no-club')
  }, [])

  /**
   * After signing in: if you arrived with an invite, join that club first and open it
   * (so you never see another screen in between). Otherwise open your clubs as usual.
   */
  const enterClubs = useCallback(
    async (uid: string) => {
      const code = pendingRef.current
      if (!code) return loadClubs(uid)
      pendingRef.current = null
      setPendingInvite(null)
      remove(PENDING_JOIN_KEY)
      try {
        const club = await cloud.joinClub(code)
        await loadClubs(uid, club.id)
        setJoinedCount((n) => n + 1)
        toast({ title: `Welcome to ${club.name}! 🎉`, text: 'This is the club shelf — everything your friends picked.', emoji: '🎟️' })
      } catch (err) {
        fail(err)
        await loadClubs(uid)
      }
    },
    [loadClubs, toast, fail],
  )

  /** Load everything for an account: guest or saved, profile, and clubs. */
  const loadAccount = useCallback(
    async (uid: string) => {
      setUserId(uid)
      setAccount(await cloud.getAccount())
      const p = await cloud.fetchProfile(uid)
      setProfile(p)
      if (!p) return setStatus('setup')
      await enterClubs(uid)
    },
    [enterClubs],
  )

  // 1. On startup: find this device's account and profile.
  useEffect(() => {
    ;(async () => {
      if (!cloud.supabase) {
        setError('The app is missing its Supabase settings. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.')
        setStatus('error')
        return
      }
      try {
        const uid = await cloud.currentUserId()
        if (!uid) return setStatus('auth')
        await loadAccount(uid)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      }
    })()
  }, [loadAccount])

  // Invited? Find out who invited you to which club (works before signing in).
  useEffect(() => {
    if (pendingInvite && cloud.supabase) void cloud.clubPreview(pendingInvite).then(setInvitePreview)
  }, [pendingInvite])

  // 2. Whenever the open club changes: load it, and listen for live changes from friends.
  const reloadClub = useCallback(async () => {
    if (!activeId) return
    try {
      setData(await cloud.fetchClub(activeId))
    } catch (err) {
      fail(err)
    }
  }, [activeId, fail])

  useEffect(() => {
    if (!activeId) {
      setData(emptyClub)
      return
    }
    write(ACTIVE_KEY, activeId)
    void reloadClub()
    // Several changes often arrive together — wait a moment and reload once.
    const stop = cloud.watchClub(activeId, () => {
      clearTimeout(reloadTimer.current)
      reloadTimer.current = setTimeout(() => void reloadClub(), 300)
    })
    // Profiles aren't live, so also refresh when you come back to the app.
    const onFocus = () => void reloadClub()
    window.addEventListener('focus', onFocus)
    return () => {
      stop()
      window.removeEventListener('focus', onFocus)
      clearTimeout(reloadTimer.current)
    }
  }, [activeId, reloadClub])


  const me: Member = useMemo(() => {
    const inClub = data.members.find((m) => m.id === profile?.id)
    return inClub ?? profile ?? PLACEHOLDER_ME
  }, [data.members, profile])
  const amHost = me.role === 'host'
  const activeClub = clubs.find((c) => c.id === activeId) ?? null

  const localTitleCount = useMemo(() => {
    if (read(IMPORTED_KEY) === 'yes') return 0
    try {
      return Object.keys(JSON.parse(read(LOCAL_KEY) ?? '{}').titles ?? {}).length
    } catch {
      return 0
    }
  }, [])

  /** Show a change now; save it in the background; if saving fails, say so and reload. */
  const optimistic = useCallback(
    (apply: (d: ClubData) => ClubData, save: () => Promise<void>) => {
      setData(apply)
      save().catch((err) => {
        fail(err)
        void reloadClub()
      })
    },
    [fail, reloadClub],
  )

  const store = useMemo<ClubStore>(
    () => ({
      status,
      error,
      data,
      me,
      amHost,
      clubs,
      activeClub,
      pendingInvite,
      invitePreview,
      joinedCount,
      localTitleCount,
      account,

      sendLoginCode: (email) => cloud.sendLoginCode(email),
      verifyLoginCode: async (email, code) => {
        const uid = await cloud.verifyLoginCode(email, code)
        setActiveId(null)
        await loadAccount(uid)
      },
      sendSaveCode: (email) => cloud.sendSaveCode(email),
      confirmSaveCode: async (email, code) => {
        await cloud.confirmSaveCode(email, code)
        setAccount(await cloud.getAccount())
        toast({ title: 'Account saved 💾', text: `Log in with ${email.trim()} on any device to get your clubs back.`, emoji: '✉️' })
      },
      signOut: async () => {
        await cloud.signOut()
        setUserId(null)
        setProfile(null)
        setClubs([])
        setActiveId(null)
        setAccount({ email: null, isGuest: false })
        setStatus('auth')
      },

      setupProfile: async (p) => {
        const uid = userId ?? (await cloud.currentUserId())
        if (!uid) throw new Error('Please log in first.')
        await cloud.saveProfile(uid, p)
        setUserId(uid)
        setProfile({ id: uid, ...p, role: 'member' })
        await enterClubs(uid)
      },

      updateProfile: async (change) => {
        if (!userId || !profile) return
        const next = { ...profile, ...change }
        await cloud.saveProfile(userId, { name: next.name, color: next.color, emoji: next.emoji, bio: next.bio })
        setProfile(next)
        await reloadClub()
      },

      createClub: async (name, importLocal) => {
        if (!userId) return
        const club = await cloud.createClub(name)
        if (importLocal) {
          const local = JSON.parse(read(LOCAL_KEY) ?? '{}') as ClubData
          await cloud.importLocalShelf(club.id, userId, local, read(LOCAL_ME_KEY) ?? local.members?.[0]?.id ?? 'me')
          write(IMPORTED_KEY, 'yes')
        }
        await loadClubs(userId, club.id)
        toast({ title: `${club.name} is ready 👑`, text: 'You’re the host. Invite friends from the 👥 Friends tab.', emoji: '🎉' })
      },

      joinClub: async (linkOrCode) => {
        if (!userId) return
        const club = await cloud.joinClub(linkOrCode)
        await loadClubs(userId, club.id)
        toast({ title: `You joined ${club.name}! 🎉`, emoji: '🎟️' })
      },

      switchClub: (clubId) => setActiveId(clubId),

      renameClub: (name) => {
        if (!activeId || !name.trim()) return
        optimistic(
          (d) => ({ ...d, name: name.trim() }),
          async () => {
            await cloud.renameClub(activeId, name.trim())
            setClubs((list) => list.map((c) => (c.id === activeId ? { ...c, name: name.trim() } : c)))
          },
        )
      },

      removeMember: (memberId) => {
        if (!activeId || !amHost || memberId === me.id) return
        optimistic(
          (d) => ({ ...d, members: d.members.filter((m) => m.id !== memberId) }),
          () => cloud.removeMember(activeId, memberId),
        )
      },

      leaveClub: async () => {
        if (!activeId || !userId) return
        await cloud.removeMember(activeId, userId)
        write(ACTIVE_KEY, '')
        await loadClubs(userId)
      },

      add: (result) => {
        if (!activeId || !userId) return
        optimistic(
          (d) => addTitle(d, result, userId),
          () => cloud.addTitle(activeId, userId, result),
        )
      },

      remove: (titleId) => {
        if (!activeId) return
        optimistic(
          (d) => removeTitle(d, titleId),
          () => cloud.removeTitle(activeId, titleId),
        )
      },

      update: (titleId, change) => {
        if (!userId) return
        // Work out the new entry with the same (tested) rules, then save exactly that.
        const next = updateEntry(data, userId, titleId, change)
        const entry = getEntry(next, userId, titleId)
        if (!entry) return
        optimistic(
          () => next,
          () => cloud.saveEntry(entry),
        )
      },
    }),
    [status, error, data, me, amHost, clubs, activeClub, pendingInvite, invitePreview, joinedCount, localTitleCount, account, userId, profile, activeId, loadClubs, loadAccount, enterClubs, reloadClub, optimistic, toast],
  )

  return <ClubContext.Provider value={store}>{children}</ClubContext.Provider>
}

export function useClub(): ClubStore {
  const store = useContext(ClubContext)
  if (!store) throw new Error('useClub must be used inside <ClubProvider>')
  return store
}

/** An invite link looks like …/?join=abc123. Remember the code, and tidy the address bar. */
function readInviteFromUrl(): string | null {
  const params = new URLSearchParams(location.search)
  const code = params.get('join')
  if (code) {
    write(PENDING_JOIN_KEY, code)
    params.delete('join')
    const rest = params.toString()
    history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : ''))
  }
  return code ?? read(PENDING_JOIN_KEY)
}

// Browser storage can be blocked (e.g. private mode) — the app still works.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}
