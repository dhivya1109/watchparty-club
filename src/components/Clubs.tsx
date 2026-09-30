import { useState } from 'react'
import { useClub } from '../store/ClubContext'

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
    <div className="grid gap-4 md:grid-cols-2">
      <form
        className="flex flex-col rounded-3xl border border-gold/50 bg-gradient-to-br from-gold/10 to-surface p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) void run('create', () => createClub(name, importLocal && localTitleCount > 0))
        }}
      >
        <div className="text-3xl">👑</div>
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
          className="mt-4 rounded-full bg-gradient-to-b from-gold to-gold-deep py-2.5 font-display font-bold text-ink shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-40"
        >
          {busy === 'create' ? 'Creating…' : 'Create club 🍿'}
        </button>
      </form>

      <form
        className="flex flex-col rounded-3xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (link.trim()) void run('join', () => joinClub(link))
        }}
      >
        <div className="text-3xl">🔗</div>
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

      {error && <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral md:col-span-2">⚠️ {error}</p>}
    </div>
  )
}

/** Full page shown when you're not in any club yet. */
export function NoClubScreen() {
  const { me } = useClub()
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-accent">Welcome, {me.name}</p>
      <h2 className="mt-2 text-center text-3xl font-extrabold sm:text-4xl">Pick your first club 🎬</h2>
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

/** Header button: which club is open, with a menu to switch, create or join. */
export function ClubSwitcher() {
  const { clubs, activeClub, switchClub } = useClub()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  if (!activeClub) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex max-w-[11rem] items-center gap-1 rounded-full border border-line bg-surface/80 px-2.5 py-0.5 text-xs font-semibold text-soft transition hover:border-gold hover:text-cream sm:max-w-[16rem]"
        aria-label={`Current club: ${activeClub.name}. Switch club`}
      >
        <span>🎬</span>
        <span className="truncate">{activeClub.name}</span>
        <span className="text-muted">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="animate-pop absolute left-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-3xl border border-line bg-surface p-3 shadow-2xl shadow-black/40">
            <p className="px-2 pb-2 text-xs font-semibold text-muted">Your clubs</p>
            <ul className="flex flex-col gap-1">
              {clubs.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      switchClub(c.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      c.id === activeClub.id ? 'bg-gold/15 font-bold' : 'hover:bg-raised'
                    }`}
                  >
                    <span>🎬</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    {c.role === 'host' && <span title="You’re the host">👑</span>}
                    {c.id === activeClub.id && <span className="text-accent">✓</span>}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                setOpen(false)
                setAdding(true)
              }}
              className="mt-2 w-full rounded-xl border border-dashed border-line py-2 text-sm font-semibold text-soft transition hover:border-gold hover:text-accent"
            >
              ＋ New club or join one
            </button>
          </div>
        </>
      )}

      {adding && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
          <div className="animate-pop max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-line bg-night p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">Another club? 🎬</h2>
              <button onClick={() => setAdding(false)} className="rounded-full px-3 py-1 text-sm text-muted hover:text-cream">
                Close ✕
              </button>
            </div>
            <CreateOrJoin onDone={() => setAdding(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
