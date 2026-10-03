import { Clapperboard, Crown, Link, Search } from 'lucide-react'
import { useState } from 'react'
import { useClub } from '../store/ClubContext'
import { Portal } from './ui'

/**
 * 🎬 Clubs: start a new one, join one with an invite link, and switch between the clubs you're in.
 * One person can be in many clubs — friends, college, family…
 */

/** Two cards: "Start a new club" and "Join with an invite link". */
export function CreateOrJoin({ onDone }: { onDone?: () => void }) {
  const { createClub, joinClub, localTitleCount, clubs } = useClub()
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [importLocal, setImportLocal] = useState(true)
  const [busy, setBusy] = useState<'create' | 'join' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (which: 'create' | 'join', action: () => Promise<void>) => {
    setBusy(which)
    setError(null)
    try {
      await action()
      onDone?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <form
        className="flex flex-col rounded-2xl border border-gold/50 bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) void run('create', () => createClub(name, importLocal && localTitleCount > 0))
        }}
      >
        <Crown size={28} strokeWidth={1.75} aria-hidden="true" className="text-accent" />
        <h3 className="mt-2 text-xl font-extrabold">Start a new club</h3>
        <p className="mt-1 text-sm text-soft">You’ll be the host — you get a link to invite friends, family or anyone.</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="e.g. College Gang, Family Movie Night"
          className="mt-4 rounded-xl border border-line bg-night/50 px-3 py-2.5 outline-none placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/10"
        />
        {localTitleCount > 0 && clubs.length === 0 && (
          <label className="mt-3 flex items-start gap-2 text-sm text-soft">
            <input type="checkbox" checked={importLocal} onChange={(e) => setImportLocal(e.target.checked)} className="mt-1 accent-[var(--color-gold)]" />
            <span>
              Bring the <b className="text-cream">{localTitleCount} titles</b> already saved on this device into this club
            </span>
          </label>
        )}
        <button
          disabled={!name.trim() || busy !== null}
          className="mt-4 rounded-full bg-gold py-2.5 font-display font-bold text-on-gold transition hover:brightness-110 disabled:opacity-40"
        >
          {busy === 'create' ? 'Creating…' : 'Create club'}
        </button>
      </form>

      <form
        className="flex flex-col rounded-2xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (link.trim()) void run('join', () => joinClub(link))
        }}
      >
        <Link size={28} strokeWidth={1.75} aria-hidden="true" className="text-accent" />
        <h3 className="mt-2 text-xl font-extrabold">Join a friend’s club</h3>
        <p className="mt-1 text-sm text-soft">
          Got an invite link? Just open it — or paste it (or its code) here.
        </p>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…/?join=abc123 or abc123"
          className="mt-4 rounded-xl border border-line bg-night/50 px-3 py-2.5 outline-none placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/10"
        />
        <button
          disabled={!link.trim() || busy !== null}
          className="mt-auto rounded-full border-2 border-gold py-2.5 font-display font-bold text-accent transition hover:bg-gold/10 disabled:opacity-40 max-md:mt-4"
        >
          {busy === 'join' ? 'Joining…' : 'Join club →'}
        </button>
      </form>

      {error && <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral md:col-span-2">{error}</p>}
    </div>
  )
}

/** Full page shown when you're not in any club yet. */
export function NoClubScreen() {
  const { me } = useClub()
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Welcome, {me.name}</p>
      <h2 className="mt-2 text-center text-3xl font-extrabold sm:text-4xl">Pick your first club</h2>
      <p className="mx-auto mt-2 max-w-lg text-center text-soft">
        A club is a group of people sharing one shelf — your friends, your college gang, your family. You can be in as
        many as you like.
      </p>
      <div className="mt-8">
        <CreateOrJoin />
      </div>
    </div>
  )
}

/** Header button: which club is open. Tap it to see all your clubs, switch, create or join. */
export function ClubSwitcher() {
  const { activeClub, clubs } = useClub()
  const [open, setOpen] = useState(false)
  if (!activeClub) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex max-w-[11rem] items-center gap-1 rounded-full border border-line bg-surface/80 px-2.5 py-0.5 text-xs font-semibold text-soft transition hover:border-gold hover:text-cream sm:max-w-[16rem]"
        aria-label={`Current club: ${activeClub.name}. You're in ${clubs.length} ${clubs.length === 1 ? 'club' : 'clubs'} — open your clubs`}
      >
        <Clapperboard size={13} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{activeClub.name}</span>
        {clubs.length > 1 && <span className="shrink-0 rounded-full bg-raised px-1.5 text-[10px] text-muted">{clubs.length}</span>}
        <span className="text-muted">▾</span>
      </button>
      {open && <ClubsSheet onClose={() => setOpen(false)} />}
    </>
  )
}

/**
 * 🎬 "Your clubs": every club you're in — even 20+ — with search, and
 * "New club" / "Join a club" always visible at the top (never pushed off-screen).
 */
export function ClubsSheet({ onClose }: { onClose: () => void }) {
  const { clubs, activeClub, switchClub } = useClub()
  const [mode, setMode] = useState<'list' | 'add'>('list')
  const [query, setQuery] = useState('')
  const shown = clubs.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Portal>
      <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="clubs-title">
        {/* Tapping the dark area closes the sheet */}
        <div className="absolute inset-0" onClick={onClose} />
        <div className="animate-pop relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          {/* Title + actions: pinned at the top, however many clubs there are */}
          <div className="border-b border-line p-5 pb-4">
            <div className="flex items-center justify-between gap-3">
              {mode === 'list' ? (
                <h2 id="clubs-title" className="text-2xl font-extrabold">
                  Your clubs <span className="text-muted">· {clubs.length}</span>
                </h2>
              ) : (
                <button onClick={() => setMode('list')} className="text-sm font-semibold text-soft hover:text-cream">
                  ← Your clubs
                </button>
              )}
              <button onClick={onClose} aria-label="Close" className="rounded-full px-2 text-lg text-muted hover:text-cream">
                ✕
              </button>
            </div>
            {mode === 'list' && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode('add')}
                    className="rounded-2xl bg-gold py-2.5 font-display font-bold text-on-gold transition hover:brightness-110"
                  >
                    ＋ New club
                  </button>
                  <button
                    onClick={() => setMode('add')}
                    className="rounded-2xl border-2 border-gold/60 py-2.5 font-display font-bold text-accent transition hover:bg-gold/10"
                  >
                    Join a club
                  </button>
                </div>
                {clubs.length > 5 && (
                  <label className="relative mt-3 block">
                    <span className="sr-only">Search your clubs</span>
                    <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search ${clubs.length} clubs…`}
                      className="w-full rounded-full border border-line bg-night/50 py-2 pl-10 pr-4 text-sm outline-none placeholder:text-muted focus:border-gold"
                    />
                  </label>
                )}
              </>
            )}
          </div>

          {/* The list scrolls on its own, so the top stays put */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {mode === 'add' ? (
              <div className="p-2">
                <CreateOrJoin onDone={onClose} />
              </div>
            ) : shown.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">No club called “{query}”.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {shown.map((c) => {
                  const current = c.id === activeClub?.id
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => {
                          switchClub(c.id)
                          onClose()
                        }}
                        aria-current={current}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                          current ? 'bg-gold/15 ring-1 ring-gold/50' : 'hover:bg-raised'
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-raised font-display text-lg font-extrabold text-accent">
                          {c.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{c.name}</span>
                          <span className="block text-xs text-muted">{c.role === 'host' ? 'You’re the host' : 'Member'}</span>
                        </span>
                        {current && <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-on-gold">Open</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
